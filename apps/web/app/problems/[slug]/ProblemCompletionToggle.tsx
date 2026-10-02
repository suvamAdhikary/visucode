'use client';

import { useUserProgress, markProblemComplete, unmarkProblemComplete } from '../../../lib/services/progress.service';
import styles from './ProblemCompletionToggle.module.css';

interface ProblemCompletionToggleProps {
  slug: string;
}

export function ProblemCompletionToggle({ slug }: ProblemCompletionToggleProps) {
  const progress = useUserProgress();
  const isCompleted = progress.completedProblems.includes(slug);

  const handleToggle = () => {
    if (isCompleted) {
      unmarkProblemComplete(slug);
    } else {
      markProblemComplete(slug);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.toggleButton} ${isCompleted ? styles.completed : ''}`}
      onClick={handleToggle}
      aria-pressed={isCompleted}
      aria-label={isCompleted ? 'Mark problem as incomplete' : 'Mark problem as complete'}
      data-testid="problem-completion-toggle"
    >
      <span className={styles.icon} aria-hidden="true">
        {isCompleted ? '✓' : '○'}
      </span>
      <span>{isCompleted ? 'Completed' : 'Mark as Done'}</span>
    </button>
  );
}
