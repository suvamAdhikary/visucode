'use client';

import { useUserProgress } from '../../lib/services/progress.service';
import styles from './ProblemCompletionBadge.module.css';

interface ProblemCompletionBadgeProps {
  slug: string;
}

export function ProblemCompletionBadge({ slug }: ProblemCompletionBadgeProps) {
  const progress = useUserProgress();
  const isCompleted = progress.completedProblems.includes(slug);

  if (!isCompleted) return null;

  return (
    <span
      className={styles.badge}
      data-testid={`completion-badge-${slug}`}
      title="Solved"
    >
      <span className={styles.icon} aria-hidden="true">✓</span>
      <span>Solved</span>
    </span>
  );
}
