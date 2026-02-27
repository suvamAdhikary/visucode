export const metadata = {
    title: 'Problems — Practice DSA',
    description: 'Browse curated DSA problems from Grind 75 with visual dry runs, company tags, and external platform links.',
};

export default function ProblemsPage() {
    return (
        <div className="container" style={{ padding: '3rem 1.5rem' }}>
            <h1>💡 Problem Browser</h1>
            <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                Curated problems from Grind 75 with visual dry runs, real-world use cases, and company tags.
            </p>
            <p style={{ color: 'var(--color-text-muted)' }}>
                Problem list coming soon — building the visualizer engine first! 🚀
            </p>
        </div>
    );
}
