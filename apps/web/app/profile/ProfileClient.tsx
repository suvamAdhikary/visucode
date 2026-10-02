'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useUserProgress,
  resetProgress,
} from '../../lib/services/progress.service';
import type { Difficulty, PatternSlug, Category } from '@visucode/shared-types';
import styles from './Profile.module.css';

export interface ProfileProblemSummary {
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  patterns: PatternSlug[];
}

export interface ProfilePatternSummary {
  slug: PatternSlug;
  name: string;
  color: string;
  problems: string[];
}

interface ProfileClientProps {
  allProblems?: ProfileProblemSummary[];
  patterns?: ProfilePatternSummary[];
}

export function ProfileClient({
  allProblems = [],
  patterns = [],
}: ProfileClientProps) {
  const progress = useUserProgress();

  const [filterDifficulty, setFilterDifficulty] = useState<'All' | Difficulty>('All');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Overall Stats
  const totalProblems = allProblems.length;
  const completedSlugs = new Set(progress.completedProblems);
  const solvedProblems = allProblems.filter((p) => completedSlugs.has(p.slug));
  const totalSolved = solvedProblems.length;
  const overallPercent = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  // Difficulty Breakdown
  const easyTotal = allProblems.filter((p) => p.difficulty === 'Easy').length;
  const easySolved = solvedProblems.filter((p) => p.difficulty === 'Easy').length;
  const easyPercent = easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0;

  const mediumTotal = allProblems.filter((p) => p.difficulty === 'Medium').length;
  const mediumSolved = solvedProblems.filter((p) => p.difficulty === 'Medium').length;
  const mediumPercent = mediumTotal > 0 ? Math.round((mediumSolved / mediumTotal) * 100) : 0;

  const hardTotal = allProblems.filter((p) => p.difficulty === 'Hard').length;
  const hardSolved = solvedProblems.filter((p) => p.difficulty === 'Hard').length;
  const hardPercent = hardTotal > 0 ? Math.round((hardSolved / hardTotal) * 100) : 0;

  // Filtered Solved Problems List
  const filteredSolved = solvedProblems.filter((p) => {
    if (filterDifficulty === 'All') return true;
    return p.difficulty === filterDifficulty;
  });

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(progress.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
      setCopiedId(false);
    }
  };

  const handleReset = () => {
    resetProgress();
    setIsConfirmingReset(false);
  };

  return (
    <div className={styles.profileContainer}>
      {/* Hero Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroHeader}>
          <div className={styles.avatar} aria-hidden="true">
            👤
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.heroTitleRow}>
              <h1 className={styles.heroTitle}>Developer Profile</h1>
              <span className={styles.anonBadge}>Anonymous Mode</span>
            </div>
            <div className={styles.userIdRow}>
              <span>Session ID:</span>
              <code className={styles.userIdCode}>
                {progress.userId.length > 20
                  ? `${progress.userId.slice(0, 8)}...${progress.userId.slice(-6)}`
                  : progress.userId}
              </code>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyId}
                title="Copy User ID"
              >
                {copiedId ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.syncNotice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            💡
          </span>
          <div>
            <strong>Local anonymous progress:</strong> All solved problems and lesson progress
            are safely persisted in this browser. When Auth.js (GitHub/Google sign-in) launches
            in Sprint 2, your progress will seamlessly merge with your account.
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Total Solved Card */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Problems Solved</span>
          <div className={styles.statValueRow}>
            <div>
              <span className={styles.statBigNumber} data-testid="profile-total-solved">
                {totalSolved}
              </span>
              <span className={styles.statTotal}>/ {totalProblems}</span>
            </div>
            <span className={styles.statPercent}>{overallPercent}%</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressBarFill} ${styles.overallFill}`}
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Easy Breakdown */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Easy Problems</span>
          <div className={styles.statValueRow}>
            <div>
              <span className={`${styles.statBigNumber} ${styles.easyText}`}>
                {easySolved}
              </span>
              <span className={styles.statTotal}>/ {easyTotal}</span>
            </div>
            <span className={`${styles.statPercent} ${styles.easyText}`}>
              {easyPercent}%
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressBarFill} ${styles.easyFill}`}
              style={{ width: `${easyPercent}%` }}
            />
          </div>
        </div>

        {/* Medium Breakdown */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Medium Problems</span>
          <div className={styles.statValueRow}>
            <div>
              <span className={`${styles.statBigNumber} ${styles.mediumText}`}>
                {mediumSolved}
              </span>
              <span className={styles.statTotal}>/ {mediumTotal}</span>
            </div>
            <span className={`${styles.statPercent} ${styles.mediumText}`}>
              {mediumPercent}%
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressBarFill} ${styles.mediumFill}`}
              style={{ width: `${mediumPercent}%` }}
            />
          </div>
        </div>

        {/* Hard Breakdown */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Hard Problems</span>
          <div className={styles.statValueRow}>
            <div>
              <span className={`${styles.statBigNumber} ${styles.hardText}`}>
                {hardSolved}
              </span>
              <span className={styles.statTotal}>/ {hardTotal}</span>
            </div>
            <span className={`${styles.statPercent} ${styles.hardText}`}>
              {hardPercent}%
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressBarFill} ${styles.hardFill}`}
              style={{ width: `${hardPercent}%` }}
            />
          </div>
        </div>

        {/* Lessons & Current Track */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Lessons & Track</span>
          <div className={styles.statValueRow}>
            <div>
              <span className={styles.statBigNumber} data-testid="profile-total-lessons">
                {progress.completedLessons.length}
              </span>
              <span className={styles.statTotal}>completed</span>
            </div>
            <Link
              href={`/learn/${progress.currentTrack}`}
              className={styles.trackLink}
              title="Current learning track"
            >
              {progress.currentTrack.charAt(0).toUpperCase() + progress.currentTrack.slice(1)} (L{progress.currentLesson}) →
            </Link>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{
                width: `${Math.min(100, progress.completedLessons.length > 0 ? (progress.completedLessons.length / 5) * 100 : 5)}%`,
                background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Pattern Mastery Breakdown */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span>🧩</span> Pattern Mastery
          </h2>
        </div>
        <div className={styles.patternGrid}>
          {patterns.map((pattern) => {
            const patternProblems = pattern.problems;
            const patternSolved = patternProblems.filter((slug) =>
              completedSlugs.has(slug)
            ).length;
            const patternTotal = patternProblems.length;
            const pct = patternTotal > 0 ? Math.round((patternSolved / patternTotal) * 100) : 0;

            return (
              <Link
                key={pattern.slug}
                href={`/patterns/${pattern.slug}`}
                className={styles.patternCard}
                style={{ '--accent-color': pattern.color } as React.CSSProperties}
              >
                <div className={styles.patternCardHeader}>
                  <span className={styles.patternName}>{pattern.name}</span>
                  <span className={styles.patternCount}>
                    {patternSolved} / {patternTotal}
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${pct}%`,
                      background: pattern.color || 'var(--color-primary)',
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Solved Problems List */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span>✅</span> Solved Problems ({totalSolved})
          </h2>
          {totalSolved > 0 && (
            <div className={styles.filterPills}>
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`${styles.filterPill} ${
                    filterDifficulty === diff ? styles.filterPillActive : ''
                  }`}
                  onClick={() => setFilterDifficulty(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}
        </div>

        {totalSolved === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon} aria-hidden="true">
              🚀
            </span>
            <h3>No problems solved yet</h3>
            <p>
              Your solved problems will appear here once you pass test cases or mark them as
              done.
            </p>
            <Link href="/problems" className="btn btn-primary">
              Explore Problems Catalog →
            </Link>
          </div>
        ) : filteredSolved.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No {filterDifficulty} problems solved yet.</p>
          </div>
        ) : (
          <div className={styles.problemList}>
            {filteredSolved.map((problem) => (
              <Link
                key={problem.slug}
                href={`/problems/${problem.slug}`}
                className={styles.problemItem}
                id={`solved-${problem.slug}`}
              >
                <div className={styles.problemItemLeft}>
                  <span className={styles.checkIcon} aria-hidden="true">
                    ✓
                  </span>
                  <h3 className={styles.problemItemTitle}>{problem.title}</h3>
                  <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                  {problem.patterns.map((p) => (
                    <span key={p} className="badge badge-pattern">
                      {p.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
                <span className={styles.reviewArrow}>Review →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Progress */}
      <div className={styles.dangerCard}>
        <div className={styles.dangerInfo}>
          <h4>Reset Progress</h4>
          <p>
            Clears all completed problem and lesson records. Your anonymous user ID and
            editor preferences will be preserved.
          </p>
        </div>
        {isConfirmingReset ? (
          <div className={styles.confirmRow}>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleReset}
              data-testid="confirm-reset-btn"
            >
              Yes, Reset Everything
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setIsConfirmingReset(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => setIsConfirmingReset(true)}
            data-testid="reset-progress-btn"
          >
            Reset All Progress
          </button>
        )}
      </div>
    </div>
  );
}
