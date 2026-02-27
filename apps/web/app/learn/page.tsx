import Link from 'next/link';
import { listTracks } from '../../lib/services';

export const metadata = {
  title: 'Learn DSA — Visual Lessons',
  description:
    'Master Data Structures & Algorithms through animated visual lessons. Start from zero with interactive step-by-step animations.',
};

export default function LearnPage() {
  const tracks = listTracks();

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1>📚 Learning Tracks</h1>
      <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        Start from the basics. Each track teaches you a data structure through
        animated visual lessons — no walls of text.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {tracks.map((track) => (
          <Link
            key={track.slug}
            href={`/learn/${track.slug}`}
            className="card"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              padding: '1.5rem',
            }}
            id={`track-${track.slug}`}
          >
            <span style={{ fontSize: '2rem' }}>{track.icon}</span>
            <h3>{track.name}</h3>
            <p style={{ fontSize: '0.875rem' }}>{track.description}</p>
            <div
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <span className="badge badge-easy">
                {track.lessons.length} Lessons
              </span>
            </div>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: track.color,
              }}
            >
              Start Learning →
            </span>
          </Link>
        ))}

        {/* Coming Soon placeholders */}
        <div
          className="card"
          style={{
            opacity: 0.5,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🔗</span>
          <h3>Linked Lists</h3>
          <p style={{ fontSize: '0.875rem' }}>
            Singly, doubly, circular. Fast & slow pointers, reversal patterns.
          </p>
          <span
            style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
          >
            Coming Soon
          </span>
        </div>

        <div
          className="card"
          style={{
            opacity: 0.5,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🌳</span>
          <h3>Trees & Graphs</h3>
          <p style={{ fontSize: '0.875rem' }}>
            BFS, DFS, traversals, shortest path, topological sort.
          </p>
          <span
            style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
          >
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
