import type { DryRunStep, Variable } from '@visucode/shared-types';
import type { DiagnosticKind, TraceDiagnostic } from './types';
import { inferStepVisualizerState } from './state-mapper';

export interface WorkerTracePayload {
  instrumentedCode: string;
  functionName: string;
  args: any[];
  detectedIndexVariables?: string[];
}

export interface WorkerTraceResponse {
  success: boolean;
  steps: DryRunStep[];
  totalSteps: number;
  completed: boolean;
  diagnostic?: TraceDiagnostic;
  returnValue?: any;
}

import {
  MAX_STEPS,
  MAX_RECURSION_DEPTH,
  safeStringify,
  getVariableType,
  createDiagnosticSuggestion,
} from './tracer-utils';

export {
  MAX_STEPS,
  MAX_RECURSION_DEPTH,
  safeStringify,
  getVariableType,
  createDiagnosticSuggestion,
};

/**
 * Sandboxed execution context tracking lines, local variables, call stack depth,
 * and detecting repeat states (F-LDR-S1-01, F-LDR-S1-02, F-LDR-S1-07).
 * Pure context class without Worker side effects or global listeners.
 */
export class ExecutionTracerContext {
  public steps: DryRunStep[] = [];
  public stepCount = 0;
  public callStackDepth = 0;
  public isAborted = false;
  public fatalDiagnostic?: TraceDiagnostic;
  public fatalError?: any;
  public detectedIndexVariables = new Set<string>();
  private lastSignature = '';
  private consecutiveRepeatCount = 0;

  registerIndexVariables(names: string[]) {
    if (Array.isArray(names)) {
      for (const name of names) {
        if (name && typeof name === 'string') {
          this.detectedIndexVariables.add(name.toLowerCase());
        }
      }
    }
  }

  abort(kind: DiagnosticKind, message: string, line?: number): never {
    this.isAborted = true;
    this.fatalDiagnostic = {
      kind,
      line,
      message,
      suggestion: createDiagnosticSuggestion(kind, line),
      observedEvent: message,
    };
    const err: any = new Error(message);
    err.__vc_abort = true;
    err.kind = kind;
    err.line = line;
    this.fatalError = err;
    throw err;
  }

  enter() {
    if (this.isAborted) {
      throw this.fatalError;
    }
    this.callStackDepth++;
    if (this.callStackDepth > MAX_RECURSION_DEPTH) {
      this.abort(
        'recursion-depth-exceeded',
        `Maximum recursion depth of ${MAX_RECURSION_DEPTH} exceeded (call stack overflow).`
      );
    }
  }

  leave() {
    this.callStackDepth = Math.max(0, this.callStackDepth - 1);
  }

  step(line: number, locals: Record<string, any>) {
    if (this.isAborted) {
      throw this.fatalError;
    }

    this.stepCount++;
    if (this.stepCount > MAX_STEPS) {
      this.abort(
        'step-cap-exceeded',
        `Step limit of ${MAX_STEPS} steps exceeded.`,
        line
      );
    }

    const variables: Variable[] = Object.entries(locals)
      .filter(([k]) => k !== 'this' && k !== 'arguments' && k !== '__vc')
      .map(([name, val]) => ({
        name,
        value: safeStringify(val),
        type: getVariableType(val),
      }));

    // Early abort on repeat state (F-LDR-S1-07): same line and identical locals repeated
    const sig = `${line}:${variables.map((v) => `${v.name}=${v.value}`).sort().join(',')}`;
    if (sig === this.lastSignature) {
      this.consecutiveRepeatCount++;
      if (this.consecutiveRepeatCount >= 2) {
        this.abort(
          'loop-hang',
          `Infinite loop detected: code reached line ${line} with identical local variables repeatedly.`,
          line
        );
      }
    } else {
      this.consecutiveRepeatCount = 0;
      this.lastSignature = sig;
    }

    // Factual explanation from variables (F-LDR-S1-03, F-LDR-S2-04)
    const priorityNames = [
      'return',
      'left',
      'right',
      'i',
      'j',
      'k',
      'mid',
      'lo',
      'hi',
      'start',
      'end',
      'sum',
      'target',
    ];
    const sortedVars = [...variables].sort((a, b) => {
      const aIdx = priorityNames.indexOf(a.name.toLowerCase());
      const bIdx = priorityNames.indexOf(b.name.toLowerCase());
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

    const explanationParts = sortedVars.map((v) => `${v.name} = ${v.value}`);
    const explanation =
      explanationParts.length > 0
        ? explanationParts.slice(0, 4).join(', ')
        : `Line ${line}`;

    const vizState = inferStepVisualizerState(locals, this.detectedIndexVariables);

    this.steps.push({
      stepNumber: this.steps.length + 1,
      line,
      variables,
      explanation,
      arrayState: vizState.arrayState,
      pointers: vizState.pointers,
      dpTableState: vizState.dpTableState,
      hashMapState: vizState.hashMapState,
    });
  }
}

