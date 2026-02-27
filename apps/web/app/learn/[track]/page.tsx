import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLearningTrack, getLessonsForTrack } from '../../../lib/services';
import styles from './page.module.css';

interface TrackPageProps {
  params: Promise<{ track: string }>;
}

export async function generateMetadata({ params }: TrackPageProps) {
  const { track: trackSlug } = await params;
  const track = getLearningTrack(trackSlug);
  if (!track) return { title: 'Track Not Found' };

  return {
    title: `${track.name} — Learn DSA`,
    description: track.description,
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { track: trackSlug } = await params;
  const track = getLearningTrack(trackSlug);

  if (!track) {
    notFound();
  }

  const lessons = getLessonsForTrack(trackSlug);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/learn">Learn</Link>
        <span aria-hidden="true">›</span>
        <span>{track.name}</span>
      </nav>

      {/* Track Header */}
      <div className={styles.trackHeader}>
        <span className={styles.trackIcon}>{track.icon}</span>
        <div>
          <h1>{track.name}</h1>
          <p>{track.description}</p>
        </div>
      </div>

      {/* Lesson Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: '0%', background: track.color }}
          />
        </div>
        <span className={styles.progressText}>
          0 / {lessons.length} completed
        </span>
      </div>

      {/* Lesson List */}
      <div className={styles.lessonList}>
        {lessons.map((lesson, index) => (
          <Link
            key={lesson.slug}
            href={`/learn/${trackSlug}/${lesson.slug}`}
            className={`${styles.lessonCard} card`}
            id={`lesson-${lesson.slug}`}
          >
            <div
              className={styles.lessonNumber}
              style={{ borderColor: track.color, color: track.color }}
            >
              {index + 1}
            </div>
            <div className={styles.lessonInfo}>
              <h3>{lesson.title}</h3>
              <div className={styles.lessonMeta}>
                <span className={`badge ${lesson.type === 'concept' ? 'badge-easy' : 'badge-pattern'}`}>
                  {lesson.type}
                </span>
                <span className={styles.lessonSteps}>
                  {lesson.animationSteps.length} steps
                </span>
                {lesson.miniExercise && (
                  <span className={styles.lessonExercise}>+ quiz</span>
                )}
              </div>
              {lesson.linkedProblem && (
                <span className={styles.linkedProblem}>
                  🔗 Links to: {lesson.linkedProblem}
                </span>
              )}
            </div>
            <span className={styles.lessonArrow} aria-hidden="true">
              →
            </span>
          </Link>
        ))}

        {/* Placeholder for upcoming lessons */}
        {track.lessons.length > lessons.length && (
          <div className={`${styles.lessonCard} card`} style={{ opacity: 0.4 }}>
            <div className={styles.lessonNumber} style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' }}>
              {lessons.length + 1}
            </div>
            <div className={styles.lessonInfo}>
              <h3 style={{ color: 'var(--color-text-muted)' }}>More lessons coming soon...</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
