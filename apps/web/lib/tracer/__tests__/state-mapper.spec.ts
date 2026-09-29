import { inferStepVisualizerState } from '../state-mapper';
import { traceUserCode } from '../tracer';

describe('Live Dry Run State Mapper (Sprint 2 — F-LDR-S2-01..04)', () => {
  describe('1D Array and Pointers (F-LDR-S2-01)', () => {
    it('infers 1D arrayState and valid index pointers from locals', () => {
      const locals = {
        nums: [1, 3, 5, 7, 9],
        left: 0,
        right: 4,
        target: 12,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.arrayState).toBeDefined();
      expect(viz.arrayState?.elements).toEqual([1, 3, 5, 7, 9]);
      expect(viz.pointers).toBeDefined();
      expect(viz.pointers?.length).toBe(2);

      const leftPtr = viz.pointers?.find((p) => p.name === 'left');
      expect(leftPtr).toBeDefined();
      expect(leftPtr?.index).toBe(0);
      expect(leftPtr?.color).toBe('#06b6d4');

      const rightPtr = viz.pointers?.find((p) => p.name === 'right');
      expect(rightPtr).toBeDefined();
      expect(rightPtr?.index).toBe(4);
      expect(rightPtr?.color).toBe('#a855f7');

      expect(viz.arrayState?.highlightIndices).toEqual([0, 4]);
    });

    it('ignores out-of-bounds numeric locals as pointers', () => {
      const locals = {
        arr: [10, 20, 30],
        i: 1,
        outOfBounds: 100,
        negative: -5,
      };

      const viz = inferStepVisualizerState(locals);
      expect(viz.arrayState?.elements).toEqual([10, 20, 30]);
      expect(viz.pointers?.length).toBe(1);
      expect(viz.pointers?.[0].name).toBe('i');
      expect(viz.pointers?.[0].index).toBe(1);
    });
  });

  describe('2D Grid and Active Cell (F-LDR-S2-02)', () => {
    it('infers dpTableState from nested 2D array and tracks activeCell', () => {
      const locals = {
        dp: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        i: 1,
        j: 1,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.dpTableState).toBeDefined();
      expect(viz.dpTableState?.grid).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
      expect(viz.dpTableState?.activeCell).toEqual([1, 1]);
    });

    it('handles null/undefined cells in dp grid safely', () => {
      const locals = {
        grid: [
          [1, undefined],
          [null, 2],
        ],
      };

      const viz = inferStepVisualizerState(locals);
      expect(viz.dpTableState?.grid).toEqual([
        [1, null],
        [null, 2],
      ]);
      expect(viz.dpTableState?.activeCell).toBeUndefined();
    });
  });

  describe('Objects, Maps, and Class Fields (F-LDR-S2-03)', () => {
    it('infers hashMapState from JS Map instance', () => {
      const map = new Map<string, number>();
      map.set('apple', 3);
      map.set('banana', 5);

      const locals = {
        seen: map,
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.hashMapState).toBeDefined();
      expect(viz.hashMapState?.entries).toEqual([
        { key: 'apple', value: 3 },
        { key: 'banana', value: 5 },
      ]);
    });

    it('infers hashMapState from plain object', () => {
      const locals = {
        counts: {
          x: 10,
          y: 20,
        },
      };

      const viz = inferStepVisualizerState(locals);

      expect(viz.hashMapState).toBeDefined();
      expect(viz.hashMapState?.entries).toEqual([
        { key: 'x', value: 10 },
        { key: 'y', value: 20 },
      ]);
    });
  });

  describe('End-to-end Tracer Visualizer Integration', () => {
    it('populates arrayState and pointers automatically in live dry run trace', async () => {
      const code = `function twoSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`;

      const res = await traceUserCode({
        code,
        input: '[[2, 7, 11, 15], 9]',
      });

      expect(res.completed).toBe(true);
      expect(res.steps.length).toBeGreaterThan(0);

      // Verify that intermediate steps contain arrayState and pointers
      const stepWithPointers = res.steps.find(
        (s) => s.arrayState && s.pointers && s.pointers.length >= 2
      );
      expect(stepWithPointers).toBeDefined();
      expect(stepWithPointers?.arrayState?.elements).toEqual([2, 7, 11, 15]);

      const left = stepWithPointers?.pointers?.find((p) => p.name === 'left');
      const right = stepWithPointers?.pointers?.find((p) => p.name === 'right');
      expect(left?.index).toBe(0);
      expect(right?.index).toBe(3);

      // Factual explanation (F-LDR-S2-04)
      expect(stepWithPointers?.explanation).toContain('left = 0');
      expect(stepWithPointers?.explanation).toContain('right = 3');
      expect(stepWithPointers?.explanation).not.toContain('Moving pointer from');
    });

    it('populates dpTableState in live dry run trace for grid algorithms', async () => {
      const code = `function miniDP() {
  const dp = [
    [1, 2],
    [3, 4]
  ];
  let i = 0;
  let j = 1;
  return dp[i][j];
}`;

      const res = await traceUserCode({
        code,
        input: '[]',
      });

      expect(res.completed).toBe(true);
      const stepWithDP = res.steps.find((s) => s.dpTableState);
      expect(stepWithDP).toBeDefined();
      expect(stepWithDP?.dpTableState?.grid).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });
});
