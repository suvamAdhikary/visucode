'use client';

import { useUserProgress } from '../../../lib/services/progress.service';
import styles from './page.module.css';

interface TrackProgressBarProps {
  lessonSlugs: string[];
  trackColor: string;
}

export function TrackProgressBar({ lessonSlugs, trackColor }: TrackProgressBarProps) {
  const progress = useUserProgress();
  const completedCount = lessonSlugs.filter((slug) =>
    progress.completedLessons.includes(slug)
  ).length;
  const total = lessonSlugs.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className={styles.progressBar} data-testid="track-progress-bar">
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${pct}%`, background: trackColor }}
        />
      </div>
      <span className={styles.progressText}>
        {completedCount} / {total} completed
      </span>
    </div>
  );
}
