'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { AuthMergeSync } from './AuthMergeSync';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthMergeSync />
      {children}
    </SessionProvider>
  );
}
