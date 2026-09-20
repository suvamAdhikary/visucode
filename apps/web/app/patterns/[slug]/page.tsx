import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { PatternSlug } from '@visucode/shared-types';
import { getPattern, listPatterns } from '../../../lib/services/pattern.service';
import { getProblemSummariesForPattern } from '../../../lib/services/problem.service';
import styles from './page.module.css';

// Generate static params for all known patterns
export async function generateStaticParams() {
  const patterns = listPatterns();
  return patterns.map((p) => ({ slug: p.slug }));
}

// Dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPattern(slug as PatternSlug);
  if (!pattern) return { title: 'Pattern Not Found' };

  return {
    title: `${pattern.name} — Algorithm Pattern | VisuCode`,
    description: pattern.description.replace(/\*\*/g, '').slice(0, 160),
  };
}

// Render markdown-lite text (bold and inline code)
function renderDescription(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pattern = await getPattern(slug as PatternSlug);

  if (!pattern) notFound();

  const problems = getProblemSummariesForPattern(
    slug as PatternSlug,
    pattern.problems
  );
  const pseudocodeLines = pattern.pseudocode.split('\n');

  return (
    <div
      className={styles.detailPage}
      style={{ '--accent-color': pattern.color } as React.CSSProperties}
    >
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/patterns">Patterns</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>{pattern.name}</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.patternName}>
          <span
            className={styles.colorDot}
            style={{ background: pattern.color }}
          />
          {pattern.name}
        </h1>

        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.time}`}>
            ⏱ Time: {pattern.timeComplexity}
          </span>
          <span className={`${styles.badge} ${styles.space}`}>
            💾 Space: {pattern.spaceComplexity}
          </span>
        </div>

        <p className={styles.description}>
          {renderDescription(pattern.description)}
        </p>
      </header>

      {/* When to Use */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎯 When to Use</h2>
        <ul className={styles.whenToUseList}>
          {pattern.whenToUse.map((use) => (
            <li key={use} className={styles.whenToUseItem}>
              <span className={styles.checkIcon}>✓</span>
              {use}
            </li>
          ))}
        </ul>
      </section>

      {/* Pseudocode */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📝 Pseudocode</h2>
        <div className={styles.pseudocodeBlock}>
          <div className={styles.pseudocodeHeader}>
            <span>{pattern.name} Template</span>
            <span style={{ color: pattern.color }}>
              {pattern.timeComplexity}
            </span>
          </div>
          <pre className={styles.pseudocodeContent}>
            {pseudocodeLines.map((line, i) => (
              <span key={i} className={styles.pseudocodeLine}>
                <span className={styles.pseudocodeLineNumber}>{i + 1}</span>
                {line}
                {'\n'}
              </span>
            ))}
          </pre>
        </div>
      </section>

      {/* Real-World Use Cases */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🏢 Real-World Use Cases</h2>
        <div className={styles.useCasesGrid}>
          {pattern.realWorldUseCases.map((uc) => (
            <div key={uc.scenario} className={styles.useCaseCard}>
              <div className={styles.useCaseCompany}>{uc.company}</div>
              <div className={styles.useCaseScenario}>{uc.scenario}</div>
              <p className={styles.useCaseDescription}>{uc.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Linked Problems */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          💡 Practice Problems ({problems.length})
        </h2>
        <div className={styles.problemsList}>
          {problems.map((p, i) => {
            const diffClass =
              p.difficulty === 'Easy'
                ? styles.easy
                : p.difficulty === 'Medium'
                  ? styles.medium
                  : styles.hard;

            if (!p.exists) {
              return (
                <div key={p.slug} className={styles.problemLink}>
                  <div className={styles.problemInfo}>
                    <span className={styles.problemNumber}>{i + 1}.</span>
                    <span className={styles.problemTitle}>{p.title}</span>
                  </div>
                  <span className={styles.comingSoon}>Coming Soon</span>
                </div>
              );
            }

            return (
              <Link
                key={p.slug}
                href={`/problems/${p.slug}`}
                className={styles.problemLink}
              >
                <div className={styles.problemInfo}>
                  <span className={styles.problemNumber}>{i + 1}.</span>
                  <span className={styles.problemTitle}>{p.title}</span>
                  <span
                    className={`${styles.difficultyBadge} ${diffClass}`}
                  >
                    {p.difficulty}
                  </span>
                </div>
                <span className={styles.problemArrow}>→</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Back Link */}
      <Link href="/patterns" className={styles.backLink}>
        ← Back to Patterns
      </Link>
    </div>
  );
}
