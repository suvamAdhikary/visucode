import Link from 'next/link';

export const metadata = {
    title: 'Learn DSA — Visual Lessons',
    description: 'Master Data Structures & Algorithms through animated visual lessons. Start from zero with interactive step-by-step animations.',
};

export default function LearnPage() {
    return (
        <div className="container" style={{ padding: '3rem 1.5rem' }}>
            <h1>📚 Learning Tracks</h1>
            <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                Start from the basics. Each track teaches you a data structure or concept through animated visual lessons — no walls of text.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <Link href="/learn/arrays" className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>📊</span>
                    <h3>Arrays</h3>
                    <p style={{ fontSize: '0.875rem' }}>What is an array? Operations, Two Pointers, Sliding Window, Binary Search.</p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge badge-easy">5 Lessons</span>
                        <span className="badge badge-pattern">15 Problems</span>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-hover)' }}>Start Learning →</span>
                </Link>

                <div className="card" style={{ opacity: 0.5, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>🔗</span>
                    <h3>Linked Lists</h3>
                    <p style={{ fontSize: '0.875rem' }}>Singly, doubly, circular. Fast & slow pointers, reversal patterns.</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Coming Soon</span>
                </div>

                <div className="card" style={{ opacity: 0.5, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>🌳</span>
                    <h3>Trees & Graphs</h3>
                    <p style={{ fontSize: '0.875rem' }}>BFS, DFS, traversals, shortest path, topological sort.</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Coming Soon</span>
                </div>
            </div>
        </div>
    );
}
