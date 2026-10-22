'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSafeSession } from '../../../lib/hooks/useSafeSession';
import type { Problem } from '@visucode/shared-types';
import styles from './PremiumGate.module.css';

interface PremiumGateProps {
  problem: Problem;
  children: React.ReactNode;
}

export function PremiumGate({ problem, children }: PremiumGateProps) {
  const { data: session, status } = useSafeSession();
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState(false);

  // If the problem is not premium, render children directly
  if (problem.accessLevel !== 'premium') {
    return <>{children}</>;
  }

  // If client preview was unlocked, render the children with an honest preview banner
  if (isPreviewUnlocked) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.unlockedBanner} data-testid="premium-unlocked-banner">
          <span>★ Premium Architecture Preview (Client Unlocked)</span>
          <button
            type="button"
            className={styles.lockBtn}
            onClick={() => setIsPreviewUnlocked(false)}
            data-testid="premium-relock-btn"
          >
            🔒 Re-lock Gate
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Otherwise render the honest preview gate
  return (
    <div className={styles.gateContainer} data-testid="premium-gate-card">
      <div className={styles.gateCard}>
        <div className={styles.crownIcon} aria-hidden="true">
          👑
        </div>
        <h2 className={styles.gateTitle}>★ Premium Challenge</h2>
        <p className={styles.gateSubtitle}>
          <strong>{problem.title}</strong> is classified as a premium problem.
        </p>

        <div className={styles.previewNotice} data-testid="premium-preview-notice">
          <span className={styles.noticeIcon} aria-hidden="true">
            ℹ️
          </span>
          <div>
            <div className={styles.noticeHeading}>
              Client-Side Architecture Preview (Phase 3 Sprint 3)
            </div>
            <div>
              This gating is an honest client-side architecture preview. True secure server
              entitlements, user database roles, and payment verification will be introduced in{' '}
              <strong>Phase 4</strong> with the PostgreSQL backend. There is no fake checkout or
              simulated payment processing.
            </div>
          </div>
        </div>

        <div className={styles.teaserDetails}>
          <span className={styles.teaserItem}>
            <strong>Difficulty:</strong> {problem.difficulty}
          </span>
          <span className={styles.teaserItem}>
            <strong>Pattern:</strong> {problem.patterns.join(', ')}
          </span>
          {problem.companies.length > 0 && (
            <span className={styles.teaserItem}>
              <strong>Companies:</strong> {problem.companies.slice(0, 3).join(', ')}
            </span>
          )}
        </div>

        <div className={styles.actionRow}>
          {!isAuthenticated && (
            <button
              type="button"
              className={styles.signInBtn}
              onClick={() => signIn()}
              id="premium-signin-btn"
              data-testid="premium-signin-btn"
            >
              Sign In to Account
            </button>
          )}
          <button
            type="button"
            className={styles.unlockBtn}
            onClick={() => setIsPreviewUnlocked(true)}
            id="premium-unlock-btn"
            data-testid="premium-preview-unlock"
          >
            Preview Gated Visualizer & Editor
          </button>
        </div>
      </div>
    </div>
  );
}
