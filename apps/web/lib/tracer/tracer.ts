import { validatePreflightInput } from './input-validator';
import { instrumentCode } from './instrumenter';
import type { LiveTraceResult } from './types';
import {
  ExecutionTracerContext,
  WorkerTracePayload,
  WorkerTraceResponse,
  createDiagnosticSuggestion,
} from './tracer.worker';

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

  const { instrumentedCode, functionName = 'solution' } = instrumentResult;
  const args = preflight.args || [];

  // 3. Execute in Web Worker (or sync fallback in Node.js test environment)
  if (typeof Worker === 'undefined' || process.env.NODE_ENV === 'test') {
    return executeTraceSync(instrumentedCode, functionName, args);
  }

  return new Promise((resolve) => {
    try {
      const worker = new Worker(new URL('./tracer.worker.ts', import.meta.url));

      const timer = setTimeout(() => {
        worker.terminate();
        resolve({
          steps: [],
          totalSteps: 0,
          completed: false,
          diagnostic: {
            kind: 'timeout',
            message: `Execution timed out after ${timeoutMs}ms.`,
            suggestion: 'Check for infinite loops or long-running computations.',
          },
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent<WorkerTraceResponse>) => {
        clearTimeout(timer);
        worker.terminate();
        resolve(e.data);
      };

      worker.onerror = (e) => {
        clearTimeout(timer);
        worker.terminate();
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
      };

      worker.postMessage(payload);
    } catch (err: any) {
      resolve({
        steps: [],
        totalSteps: 0,
        completed: false,
        diagnostic: {
          kind: 'runtime-error',
          message: err.message || 'Failed to initialize tracer worker.',
          suggestion: 'Ensure Web Workers are supported in your browser.',
        },
      });
    }
  });
}

/**
 * Synchronous test runner for Jest / Node.js test environments
 */
export function executeTraceSync(
  instrumentedCode: string,
  functionName: string,
  args: any[]
): LiveTraceResult {
  const ctx = new ExecutionTracerContext();

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

    return {
      steps: ctx.steps,
      totalSteps: ctx.steps.length,
      completed: true,
      returnValue,
    };
  } catch (err: any) {
    const kind = err?.kind || 'runtime-error';
    const line = err?.line;
    const message = err?.message || String(err);
    const suggestion = createDiagnosticSuggestion(kind, line);

    return {
      steps: ctx.steps, // Partial steps preserved! (F-LDR-S1-07)
      totalSteps: ctx.steps.length,
      completed: false,
      diagnostic: {
        kind,
        line,
        message,
        suggestion,
        observedEvent: err?.message,
      },
    };
  }
}
