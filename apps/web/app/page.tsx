import Link from 'next/link';
import styles from './page.module.css';

// Server Component — zero JS shipped to client
export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background animated grid */}
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.gridOverlay} />
          <div className={styles.glowOrb1} />
          <div className={styles.glowOrb2} />
          <div className={styles.glowOrb3} />
        </div>

        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Open Source DSA Learning Platform
            </div>

            <h1 className={styles.heroTitle}>
              Learn DSA <span className={styles.heroGradient}>Visually</span>,
              <br />
              Not Just Textually
            </h1>

            <p className={styles.heroDescription}>
              Interactive animations, step-by-step dry runs, and a built-in code
              editor. Replace pen & paper with VisuCode — see every pointer
              move, every variable change, every pattern click into place.
            </p>

            <div className={styles.heroCtas}>
              <Link
                href="/learn"
                className="btn btn-primary btn-lg"
                id="hero-cta-learn"
              >
                🎓 Start Learning
              </Link>
              <Link
                href="/problems"
                className="btn btn-secondary btn-lg"
                id="hero-cta-practice"
              >
                💡 Practice Problems
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>15+</span>
                <span className={styles.heroStatLabel}>Problems</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>3</span>
                <span className={styles.heroStatLabel}>Patterns</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>5</span>
                <span className={styles.heroStatLabel}>Visual Lessons</span>
              </div>
            </div>
          </div>

          {/* Hero Visual — Animated Array Visualization */}
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.vizCard}>
              <div className={styles.vizHeader}>
                <span className={styles.vizDot} style={{ background: '#ef4444' }} />
                <span className={styles.vizDot} style={{ background: '#f59e0b' }} />
                <span className={styles.vizDot} style={{ background: '#22c55e' }} />
                <span className={styles.vizTitle}>Two Pointers</span>
              </div>
              <div className={styles.vizArray}>
                {[1, 3, 5, 7, 9, 11].map((val, i) => (
                  <div
                    key={i}
                    className={`${styles.vizElement} ${i === 0 ? styles.vizElementLeft : ''
                      } ${i === 5 ? styles.vizElementRight : ''}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {val}
                  </div>
                ))}
              </div>
              <div className={styles.vizPointers}>
                <span className={styles.pointerLeft}>L ↑</span>
                <span className={styles.pointerRight}>↑ R</span>
              </div>
              <div className={styles.vizCaption}>
                Target: 12 → L=1, R=11 → Sum=12 ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Everything You Need to{' '}
            <span className={styles.heroGradient}>Master DSA</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            From zero to interview-ready, with visual learning at every step
          </p>

          <div className={`${styles.featureGrid} stagger-children`}>
            <Link href="/learn" className={`card ${styles.featureCard}`} id="feature-learn">
              <div
                className={styles.featureIcon}
                style={{ background: 'var(--color-two-pointers-soft)' }}
              >
                🎓
              </div>
              <h3>Visual Lessons</h3>
              <p>
                Animated step-by-step lessons that teach concepts visually. No
                walls of text — 90% animation, 10% captions.
              </p>
              <span className={styles.featureLink}>Start Learning →</span>
            </Link>

            <Link href="/problems" className={`card ${styles.featureCard}`} id="feature-problems">
              <div
                className={styles.featureIcon}
                style={{ background: 'var(--color-sliding-window-soft)' }}
              >
                💡
              </div>
              <h3>Practice Problems</h3>
              <p>
                Curated problems from Grind 75 with real-world use cases,
                company tags, and external platform links.
              </p>
              <span className={styles.featureLink}>Browse Problems →</span>
            </Link>

            <Link href="/problems" className={`card ${styles.featureCard}`} id="feature-dryrun">
              <div
                className={styles.featureIcon}
                style={{ background: 'var(--color-binary-search-soft)' }}
              >
                🔍
              </div>
              <h3>Dry Run Helper</h3>
              <p>
                Replace pen & paper. See every variable, every pointer, every
                step — animated with full state tracking.
              </p>
              <span className={styles.featureLink}>Try a Dry Run →</span>
            </Link>

            <Link href="/patterns" className={`card ${styles.featureCard}`} id="feature-patterns">
              <div
                className={styles.featureIcon}
                style={{ background: 'var(--color-brand-soft)' }}
              >
                🧩
              </div>
              <h3>Pattern Library</h3>
              <p>
                Master the patterns that matter — Two Pointers, Sliding Window,
                Binary Search — with pseudocode and real-world examples.
              </p>
              <span className={styles.featureLink}>Explore Patterns →</span>
            </Link>

            <Link href="/playground" className={`card ${styles.featureCard}`} id="feature-editor">
              <div
                className={styles.featureIcon}
                style={{ background: 'var(--color-success-soft)' }}
              >
                ⚡
              </div>
              <h3>Code & Run</h3>
              <p>
                Built-in Monaco editor with in-browser execution. Write, test,
                and debug — right here, no setup needed.
              </p>
              <span className={styles.featureLink}>Open Playground →</span>
            </Link>

            <div className={`card ${styles.featureCard} ${styles.featureCardComingSoon}`} id="feature-interview">
              <div
                className={styles.featureIcon}
                style={{ background: 'var(--color-error-soft)' }}
              >
                🎯
              </div>
              <h3>Interview Mode</h3>
              <p>
                Timed sessions, no hints, clean problem view. For interviewers
                and mock interviews alike.
              </p>
              <span className={styles.featureLink}>Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Patterns Preview */}
      <section className={styles.patternsPreview}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Start With These Patterns</h2>
          <p className={styles.sectionSubtitle}>
            The 3 most common array patterns in coding interviews
          </p>

          <div className={styles.patternCards}>
            <Link href="/patterns/two-pointers" className={styles.patternCard} id="pattern-two-pointers">
              <div
                className={styles.patternStripe}
                style={{ background: 'var(--color-two-pointers)' }}
              />
              <div className={styles.patternContent}>
                <h3>Two Pointers</h3>
                <p>L → ← R scanning from both ends</p>
                <div className={styles.patternMeta}>
                  <span className="badge badge-easy">5 Problems</span>
                  <span className={styles.patternCompanies}>
                    Amazon • Google • Meta
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/patterns/sliding-window" className={styles.patternCard} id="pattern-sliding-window">
              <div
                className={styles.patternStripe}
                style={{ background: 'var(--color-sliding-window)' }}
              />
              <div className={styles.patternContent}>
                <h3>Sliding Window</h3>
                <p>Fixed or dynamic window traversal</p>
                <div className={styles.patternMeta}>
                  <span className="badge badge-medium">5 Problems</span>
                  <span className={styles.patternCompanies}>
                    Amazon • Microsoft • Apple
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/patterns/binary-search" className={styles.patternCard} id="pattern-binary-search">
              <div
                className={styles.patternStripe}
                style={{ background: 'var(--color-binary-search)' }}
              />
              <div className={styles.patternContent}>
                <h3>Binary Search</h3>
                <p>Divide and conquer on sorted data</p>
                <div className={styles.patternMeta}>
                  <span className="badge badge-hard">5 Problems</span>
                  <span className={styles.patternCompanies}>
                    Google • Meta • Bloomberg
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaCard}>
            <h2>Ready to See Algorithms Come Alive?</h2>
            <p>
              Start with the basics. No account needed. Just pick a lesson and
              watch the magic unfold.
            </p>
            <Link
              href="/learn"
              className="btn btn-primary btn-lg"
              id="bottom-cta-start"
            >
              🚀 Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span className="navbar-logo-icon" aria-hidden="true">▶</span>
              <span>
                Visu<strong>Code</strong>
              </span>
            </div>
            <p className={styles.footerText}>
              Learn DSA visually. Built with ❤️ as an open-source project.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
