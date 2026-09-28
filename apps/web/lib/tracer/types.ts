import type { DryRunStep } from '@visucode/shared-types';

export type DiagnosticKind =
  | 'loop-hang'
  | 'step-cap-exceeded'
  | 'recursion-depth-exceeded'
  | 'runtime-error'
  | 'syntax-error'
  | 'timeout'
  | 'preflight-error';

export interface TraceDiagnostic {
  kind: DiagnosticKind;
  line?: number;
  message: string;
  suggestion: string;
  observedEvent?: string;
}

export interface TracePreflightResult {
  valid: boolean;
  args?: any[];
  error?: string;
}

export interface LiveTraceResult {
  steps: DryRunStep[];
  totalSteps: number;
  completed: boolean;
  diagnostic?: TraceDiagnostic;
  returnValue?: any;
}
