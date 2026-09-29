import { validatePreflightInput } from './input-validator';
import { instrumentCode } from './instrumenter';
import type { LiveTraceResult, DiagnosticKind } from './types';
import {
  ExecutionTracerContext,
  createDiagnosticSuggestion,
  type WorkerTracePayload,
  type WorkerTraceResponse,
} from './tracer-context';

export interface TraceOptions {
  code: string;
  input: string | unknown;
  timeoutMs?: number;
}

/**
 * Traces user JavaScript code line-by-line using Acorn AST instrumentation
 * and sandboxed Web Worker execution.
 *
 * Implements ADR-002:
 * - Preflight validation before Worker start (F-LDR-S1-08)
 * - Worker-only sandboxing with 2s timeout and 500-step cap (F-LDR-S1-01, F-LDR-S1-02)
 * - Early abort on repeat state + partial step preservation (F-LDR-S1-07)
 * - Fails closed in production if Web Worker is unavailable (zero UI-thread new Function)
 */
export async function traceUserCode(options: TraceOptions): Promise<LiveTraceResult> {
  const { code, input, timeoutMs = 2000 } = options;

  // 1. Preflight input validation (before Worker or navigation)
  const preflight = validatePreflightInput(input);
  if (!preflight.valid) {
    return {
      steps: [],
      totalSteps: 0,
      completed: false,
      diagnostic: {
        kind: 'preflight-error',
        message: preflight.error || 'Invalid input arguments.',
        suggestion: 'Ensure inputs meet size and shape limits defined in ADR-002.',
      },
    };
  }

  // 2. Instrument source code with AST step markers
  const instrumentResult = instrumentCode(code);
  if (!instrumentResult.success || !instrumentResult.instrumentedCode) {
    return {
      steps: [],
      totalSteps: 0,
      completed: false,
      diagnostic: instrumentResult.error || {
        kind: 'syntax-error',
        message: 'Could not instrument code due to a syntax error.',
        suggestion: 'Check JavaScript syntax in the code editor.',
      },
    };
  }

  const {
    instrumentedCode,
    functionName = 'solution',
    detectedIndexVariables,
    detectedCoordinatePairs,
  } = instrumentResult;
  const args = preflight.args || [];

  // 3. Worker environment check (F-LDR-S1-01)
  if (typeof Worker === 'undefined') {
    if (process.env.NODE_ENV === 'test') {
      return executeTraceSync(
        instrumentedCode,
        functionName,
        args,
        detectedIndexVariables,
        detectedCoordinatePairs
      );
    }
    // Fail-closed in production: never execute on the UI thread
    return {
      steps: [],
      totalSteps: 0,
      completed: false,
      diagnostic: {
        kind: 'runtime-error',
        message: 'Web Workers are not supported in this environment.',
        suggestion: 'Run in a modern browser that supports Web Workers.',
      },
    };
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      worker = new Worker(new URL('./tracer.worker.ts', import.meta.url));

      timer = setTimeout(() => {
        if (worker) {
          worker.terminate();
        }
        resolve({
          steps: [],
          totalSteps: 0,
          completed: false,
          diagnostic: {
            kind: 'timeout',
            message: `Execution timed out after ${timeoutMs}ms. The execution tape is empty because the worker was terminated. Check for infinite loops or unoptimized iterations.`,
            suggestion: 'Check loop termination conditions and recursive base cases.',
          },
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent<WorkerTraceResponse>) => {
        if (timer) clearTimeout(timer);
        if (worker) worker.terminate();
        resolve(e.data);
      };

      worker.onerror = (e) => {
        if (timer) clearTimeout(timer);
        if (worker) worker.terminate();
        resolve({
          steps: [],
          totalSteps: 0,
          completed: false,
          diagnostic: {
            kind: 'runtime-error',
            message: e.message || 'Worker thread execution error.',
            suggestion: 'Check for unhandled exceptions in the user script.',
          },
        });
      };

      const payload: WorkerTracePayload = {
        instrumentedCode,
        functionName,
        args,
        detectedIndexVariables,
        detectedCoordinatePairs,
      };

      worker.postMessage(payload);
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      if (process.env.NODE_ENV === 'test') {
        resolve(
          executeTraceSync(
            instrumentedCode,
            functionName,
            args,
            detectedIndexVariables,
            detectedCoordinatePairs
          )
        );
        return;
      }
      resolve({
        steps: [],
        totalSteps: 0,
        completed: false,
        diagnostic: {
          kind: 'runtime-error',
          message: err?.message || 'Failed to initialize tracer worker sandbox.',
          suggestion: 'Ensure Web Workers can be instantiated in your browser.',
        },
      });
    }
  });
}

/**
 * Synchronous test runner for Jest / Node.js test environments only.
 * Never called on the browser UI thread in production (F-LDR-S1-01).
 */
export function executeTraceSync(
  instrumentedCode: string,
  functionName: string,
  args: any[],
  detectedIndexVariables?: string[],
  detectedCoordinatePairs?: [string, string][]
): LiveTraceResult {
  const ctx = new ExecutionTracerContext();
  if (detectedIndexVariables || detectedCoordinatePairs) {
    ctx.registerIndexVariables(detectedIndexVariables || [], detectedCoordinatePairs);
  }

  try {
    const executor = new Function(
      '__vc',
      `
      ${instrumentedCode}
      if (typeof ${functionName} === 'function') {
        return ${functionName}(...arguments[1]);
      }
      return undefined;
      `
    );

    const returnValue = executor(ctx, args);

    if (ctx.isAborted && ctx.fatalDiagnostic) {
      return {
        steps: ctx.steps,
        totalSteps: ctx.steps.length,
        completed: false,
        diagnostic: ctx.fatalDiagnostic,
        returnValue: undefined,
      };
    }

    return {
      steps: ctx.steps,
      totalSteps: ctx.steps.length,
      completed: true,
      returnValue,
    };
  } catch (err: any) {
    const diagnostic = ctx.fatalDiagnostic || {
      kind: (err?.kind || 'runtime-error') as DiagnosticKind,
      line: err?.line,
      message: err?.message || String(err),
      suggestion: createDiagnosticSuggestion(err?.kind || 'runtime-error', err?.line),
      observedEvent: err?.message,
    };

    return {
      steps: ctx.steps, // Partial steps preserved! (F-LDR-S1-07)
      totalSteps: ctx.steps.length,
      completed: false,
      diagnostic,
      returnValue: undefined,
    };
  }
}
