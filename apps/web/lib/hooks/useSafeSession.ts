'use client';

import { useContext } from 'react';
import { SessionContext } from 'next-auth/react';

/**
 * Resilient wrapper around Auth.js NextAuth SessionContext.
 * Returns the active session when wrapped in <SessionProvider>,
 * or a safe default { data: null, status: 'unauthenticated' } when rendered
 * standalone in isolated component tests or Storybook stories.
 */
export function useSafeSession() {
  const context = useContext(SessionContext);
  if (!context) {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: async () => null,
    };
  }
  return context;
}
