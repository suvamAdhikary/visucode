import { semanticCompare } from '../comparator';

describe('semanticCompare', () => {
  it('correctly compares unordered matrices (e.g. 3Sum)', () => {
    // 3Sum results can be in any order, and the triplets themselves can be in any order, 
    // although our semanticCompare sorts the top-level array and inner arrays for matrices.
    expect(semanticCompare('[[-1,-1,2],[-1,0,1]]', '[[-1,0,1],[-1,-1,2]]')).toBe(true);
    expect(semanticCompare('[[-1,-1,2],[-1,0,1]]', '[[-1,2,-1],[0,-1,1]]')).toBe(true);
    expect(semanticCompare('[[-1,-1,2],[-1,0,1]]', '[[-1,0,1]]')).toBe(false);
  });

  it('correctly handles ANY_OF expected results', () => {
    expect(semanticCompare('ANY_OF:1|5', '1')).toBe(true);
    expect(semanticCompare('ANY_OF:1|5', '5')).toBe(true);
    expect(semanticCompare('ANY_OF:1|5', '2')).toBe(false);
  });

  it('maintains strict equality for simple 1D arrays (e.g. Two Sum)', () => {
    expect(semanticCompare('[1,2]', '[2,1]')).toBe(false); // Two Sum stays ordered
  });
});
