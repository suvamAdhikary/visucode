import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLearningTrack, getLesson, getLessonsForTrack } from '../../../../lib/services';
import { LessonViewer } from './LessonViewer';
import styles from './page.module.css';

interface LessonPageProps {
  params: Promise<{ track: string; slug: string }>;
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = await getLesson(slug);
  if (!lesson) return { title: 'Lesson Not Found' };

  return {
    title: `${lesson.title} — Learn DSA`,
    description: `Visual lesson: ${lesson.title}. ${lesson.animationSteps.length} animated steps with interactive exercise.`,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { track: trackSlug, slug } = await params;
  const track = getLearningTrack(trackSlug);
  const lesson = await getLesson(slug);

  if (!track || !lesson) {
    notFound();
  }

  const trackLessons = getLessonsForTrack(trackSlug);
  const currentIndex = trackLessons.findIndex((l) => l.slug === slug);
  const prevLesson = currentIndex > 0 ? trackLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < trackLessons.length - 1
      ? trackLessons[currentIndex + 1]
      : null;

  return (
    <div className={styles.lessonPage}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/learn">Learn</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/learn/${trackSlug}`}>{track.name}</Link>
          <span aria-hidden="true">›</span>
          <span>{lesson.title}</span>
        </nav>
        <span className={styles.lessonProgress}>
          Lesson {currentIndex + 1} of {trackLessons.length}
        </span>
      </div>

      {/* Lesson Content — Client Component */}
      <LessonViewer
        lesson={lesson}
        trackSlug={trackSlug}
        trackColor={track.color}
      />

      {/* Navigation */}
      <div className={styles.lessonNav}>
        {prevLesson ? (
          <Link
            href={`/learn/${trackSlug}/${prevLesson.slug}`}
            className="btn btn-secondary"
            id="lesson-nav-prev"
          >
            ← {prevLesson.title}
          </Link>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <Link
            href={`/learn/${trackSlug}/${nextLesson.slug}`}
            className="btn btn-primary"
            id="lesson-nav-next"
          >
            {nextLesson.title} →
          </Link>
        ) : lesson.linkedProblem ? (
          <Link
            href={`/problems/${lesson.linkedProblem}`}
            className="btn btn-primary"
            id="lesson-nav-practice"
          >
            🏋️ Practice This Pattern →
          </Link>
        ) : (
          <Link
            href={`/learn/${trackSlug}`}
            className="btn btn-secondary"
            id="lesson-nav-back"
          >
            Back to {track.name}
          </Link>
        )}
      </div>
    </div>
  );
}
