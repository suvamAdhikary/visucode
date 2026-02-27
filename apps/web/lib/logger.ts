// VisuCode Structured Logger
// < 1KB — zero bundle impact, ships everywhere
// Phase 1: PostHog events + console in dev
// Phase 2+: Pipe to Kibana via structured JSON

import type { LogEntry, LogLevel } from '@visucode/shared-types';

// Generate a stable anonymous user ID (persisted in localStorage)
function getUserId(): string {
    if (typeof window === 'undefined') return 'server';
    let id = localStorage.getItem('visucode_uid');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('visucode_uid', id);
    }
    return id;
}

// Session ID — unique per browser tab session
const sessionId =
    typeof window !== 'undefined' ? crypto.randomUUID() : 'server';

function createEntry(
    level: LogLevel,
    event: string,
    data: Record<string, unknown> = {},
    error?: { message: string; stack?: string; code?: string }
): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        event,
        context: {
            userId: getUserId(),
            sessionId,
            route: typeof window !== 'undefined' ? window.location.pathname : '',
            ...data,
        },
        ...(error ? { error } : {}),
    };
}

// ============================================
// Public API
// ============================================

export const logger = {
    info(event: string, data?: Record<string, unknown>) {
        const entry = createEntry('info', event, data);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[VisuCode] ${event}`, entry.context);
        }
        // Phase 1: PostHog capture (when integrated)
        // posthog?.capture(event, entry.context);
    },

    warn(event: string, data?: Record<string, unknown>) {
        const entry = createEntry('warn', event, data);
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[VisuCode] ${event}`, entry.context);
        }
    },

    error(
        event: string,
        error: Error | string,
        data?: Record<string, unknown>
    ) {
        const err =
            error instanceof Error
                ? { message: error.message, stack: error.stack }
                : { message: error };
        const entry = createEntry('error', event, data, err);
        console.error(`[VisuCode] ${event}`, entry);
        // Phase 2: Sentry.captureException(error, { extra: entry.context });
    },

    debug(event: string, data?: Record<string, unknown>) {
        if (process.env.NODE_ENV === 'development') {
            const entry = createEntry('debug', event, data);
            console.debug(`[VisuCode] ${event}`, entry.context);
        }
    },

    // Convenience methods for common events
    track: {
        lessonStarted(trackSlug: string, lessonSlug: string) {
            logger.info('lesson.started', { trackSlug, lessonSlug });
        },
        lessonStepViewed(stepNumber: number, totalSteps: number) {
            logger.info('lesson.step_viewed', { stepNumber, totalSteps });
        },
        lessonCompleted(trackSlug: string, lessonSlug: string, durationMs: number) {
            logger.info('lesson.completed', { trackSlug, lessonSlug, durationMs });
        },
        problemOpened(problemSlug: string, source: string) {
            logger.info('problem.opened', { problemSlug, source });
        },
        codeRun(problemSlug: string, passed: number, failed: number) {
            logger.info('problem.code_run', { problemSlug, passed, failed });
        },
        dryRunStep(problemSlug: string, stepNumber: number, direction: 'fwd' | 'back') {
            logger.info('dryrun.step', { problemSlug, stepNumber, direction });
        },
        visualizerInteraction(type: string, value: unknown) {
            logger.info('visualizer.interaction', { type, value });
        },
    },
};
