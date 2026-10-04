'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  mergeAnonymousProgress,
  clearActiveUserId,
  setActiveUserId,
} from '../../../lib/services/progress.service';

/**
 * Automatically synchronizes authentication session state with user progress:
 * 1. When a user logs in, merges any local anonymous progress into the user's account (lossless union, F-P3S2-02).
 * 2. When a user logs out, resets active progress context to anonymous mode.
 */
export function AuthMergeSync() {
  const { data: session, status } = useSession();
  const lastMergedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const authUserId = session.user.id;
      if (lastMergedUserId.current !== authUserId) {
        lastMergedUserId.current = authUserId;
        mergeAnonymousProgress(authUserId);
      } else {
        setActiveUserId(authUserId);
      }
    } else if (status === 'unauthenticated') {
      lastMergedUserId.current = null;
      clearActiveUserId();
    }
  }, [status, session?.user?.id]);

  return null;
}
