// Web Worker execution sandbox for Live Dry Run (ADR-002, F-LDR-S1-01)
// Runs in dedicated worker thread; never imported directly into client bundles.

import {
  ExecutionTracerContext,
  createDiagnosticSuggestion,
  type WorkerTracePayload,
  type WorkerTraceResponse,
} from './tracer-context';
import type { DiagnosticKind } from './types';

if (typeof self !== 'undefined' && typeof postMessage === 'function') {
  self.onmessage = (e: MessageEvent<WorkerTracePayload>) => {
    const {
      instrumentedCode,
      functionName,
      args,
      detectedIndexVariables,
      detectedCoordinatePairs,
      timeoutMs,
    } = e.data;
    const ctx = new ExecutionTracerContext();
    if (timeoutMs) {
      ctx.startExecution(timeoutMs);
    }
    if (detectedIndexVariables || detectedCoordinatePairs) {
      ctx.registerIndexVariables(detectedIndexVariables || [], detectedCoordinatePairs);
    }

    ctx.onStep = (steps) => {
      // Periodically stream steps to the parent thread so terminate() never loses partial steps
      if (steps.length % 5 === 0 || steps.length === 1) {
        postMessage({
          type: 'progress',
          steps,
        });
      }
    };

    try {
      // Execute the instrumented function inside worker sandbox
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
        const response: WorkerTraceResponse = {
          success: true,
          steps: ctx.steps,
          totalSteps: ctx.steps.length,
          completed: false,
          diagnostic: ctx.fatalDiagnostic,
          returnValue: undefined,
        };
        postMessage(response);
        return;
      }

      const response: WorkerTraceResponse = {
        success: true,
        steps: ctx.steps,
        totalSteps: ctx.steps.length,
        completed: true,
        returnValue,
      };

      postMessage(response);
    } catch (err: any) {
      const diagnostic = ctx.fatalDiagnostic || {
        kind: (err?.kind || 'runtime-error') as DiagnosticKind,
        line: err?.line,
        message: err?.message || String(err),
        suggestion: createDiagnosticSuggestion(err?.kind || 'runtime-error', err?.line),
        observedEvent: err?.message,
      };

      const response: WorkerTraceResponse = {
        success: true,
        steps: ctx.steps, // Partial steps preserved! (F-LDR-S1-07)
        totalSteps: ctx.steps.length,
        completed: false,
        diagnostic,
        returnValue: undefined,
      };

      postMessage(response);
    }
  };
}
