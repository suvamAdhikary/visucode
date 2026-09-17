import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProblem } from '../../../lib/services';
import { ProblemTabs } from './ProblemTabs';
import styles from './page.module.css';

interface ProblemPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProblemPageProps) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) return { title: 'Problem Not Found' };

  return {
    title: `${problem.title} — VisuCode`,
    description: `Visual dry run and solution for ${problem.title}. ${problem.difficulty} difficulty, ${problem.patterns.join(', ')} pattern.`,
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  const problem = await getProblem(slug);

  if (!problem) {
    notFound();
  }

  const difficultyClass = problem.difficulty.toLowerCase();

  return (
    <div className={styles.problemPage}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/problems">Problems</Link>
          <span aria-hidden="true">›</span>
          <span>{problem.title}</span>
        </nav>
        <div className={styles.topActions}>
          {problem.externalLinks?.map((link, idx) => {
            const platform = typeof link.platform === 'string' ? link.platform : 'link';
            return (
              <a
                key={platform + idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                {platform.toLowerCase() === 'leetcode' ? '🔗 LeetCode' : `🔗 ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Content — 2 column layout */}
      <div className={styles.mainGrid}>
        {/* Left: Problem Description (Server Component — zero JS) */}
        <div className={styles.descriptionPanel}>
          <div className={styles.problemHeader}>
            <h1>{problem.title}</h1>
            <div className={styles.problemMeta}>
              <span className={`badge badge-${difficultyClass}`}>
                {problem.difficulty}
              </span>
              {problem.patterns.map((p) => (
                <Link
                  key={p}
                  href={`/patterns/${p}`}
                  className="badge badge-pattern"
                >
                  {p.replace(/-/g, ' ')}
                </Link>
              ))}
              {problem.companies.map((c) => (
                <span key={c} className={styles.companyTag}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className={styles.description}>
            {problem.description.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '1rem' }}>{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.startsWith('`') || line.includes('`')) {
                const parts = line.split('`');
                return (
                  <p key={i}>
                    {parts.map((part, j) =>
                      j % 2 === 1 ? <code key={j}>{part}</code> : part
                    )}
                  </p>
                );
              }
              return line ? <p key={i}>{line}</p> : <br key={i} />;
            })}
          </div>

          {/* Examples */}
          <div className={styles.section}>
            <h3>Examples</h3>
            {problem.examples.map((ex, i) => (
              <div key={i} className={styles.example}>
                <div className={styles.exampleLine}>
                  <span className={styles.exampleLabel}>Input:</span>
                  <code>{ex.input}</code>
                </div>
                <div className={styles.exampleLine}>
                  <span className={styles.exampleLabel}>Output:</span>
                  <code>{ex.output}</code>
                </div>
                {ex.explanation && (
                  <div className={styles.exampleLine}>
                    <span className={styles.exampleLabel}>Explanation:</span>
                    <span>{ex.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className={styles.section}>
            <h3>Constraints</h3>
            <ul className={styles.constraintsList}>
              {problem.constraints.map((c, i) => (
                <li key={i}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </div>

          {/* Hints (collapsible) */}
          {problem.hints.length > 0 && (
            <div className={styles.section}>
              <h3>💡 Hints</h3>
              {problem.hints.map((hint, i) => (
                <details key={i} className={styles.hintDetails}>
                  <summary className={styles.hintSummary}>
                    Hint {i + 1}
                  </summary>
                  <p className={styles.hintContent}>{hint}</p>
                </details>
              ))}
            </div>
          )}

          {/* Real World Use Cases */}
          {problem.realWorldUseCases.length > 0 && (
            <div className={styles.section}>
              <h3>🌍 Real-World Use Cases</h3>
              {problem.realWorldUseCases.map((uc, i) => (
                <div key={i} className={styles.useCase}>
                  <span className={styles.useCaseCompany}>{uc.company}</span>
                  <strong>{uc.scenario}</strong>
                  <p>{uc.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Problem Tabs (Client Component) */}
        <div className={styles.visualizerPanel}>
          <ProblemTabs problem={problem} />
        </div>
      </div>
    </div>
  );
}
