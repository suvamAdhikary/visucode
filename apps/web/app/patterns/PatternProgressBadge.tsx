'use client';

import { useUserProgress } from '../../lib/services/progress.service';
import styles from './PatternProgressBadge.module.css';

interface PatternProgressBadgeProps {
  problemSlugs: string[];
}

export function PatternProgressBadge({ problemSlugs }: PatternProgressBadgeProps) {
  const progress = useUserProgress();
  const completedCount = problemSlugs.filter((slug) =>
    progress.completedProblems.includes(slug)
  ).length;
  const totalCount = problemSlugs.length;

  if (totalCount === 0) return null;

  const hasProgress = completedCount > 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  let className = styles.progressBadge;
  if (allCompleted) {
    className += ` ${styles.allCompleted}`;
  } else if (hasProgress) {
    className += ` ${styles.hasProgress}`;
  }

  return (
    <span
      className={className}
      data-testid="pattern-progress-badge"
      title={`${completedCount} of ${totalCount} problems solved`}
    >
      <span className={styles.icon} aria-hidden="true">
        {allCompleted ? '✓' : hasProgress ? '●' : '○'}
      </span>
      <span>
        {completedCount}/{totalCount} solved
      </span>
    </span>
  );
}
