export const metadata = {
    title: 'Patterns — Algorithm Patterns Library',
    description: 'Master the most important algorithm patterns: Two Pointers, Sliding Window, Binary Search. With pseudocode, complexity analysis, and real-world use cases.',
};

export default function PatternsPage() {
    return (
        <div className="container" style={{ padding: '3rem 1.5rem' }}>
            <h1>🧩 Pattern Library</h1>
            <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                Master the patterns that matter. Each pattern includes pseudocode, diagrams, complexity analysis, and real-world use cases.
            </p>
            <p style={{ color: 'var(--color-text-muted)' }}>
                Pattern pages coming soon — building the visualizer engine first! 🚀
            </p>
        </div>
    );
}
