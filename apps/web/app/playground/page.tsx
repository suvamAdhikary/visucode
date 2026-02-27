export const metadata = {
    title: 'Playground — Free-form Visualizer',
    description: 'Experiment with any array and algorithm. Pick a pattern, enter your data, and watch the visualization unfold.',
};

export default function PlaygroundPage() {
    return (
        <div className="container" style={{ padding: '3rem 1.5rem' }}>
            <h1>🎮 Playground</h1>
            <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                Free-form sandbox — enter any array, pick an algorithm, and watch it visualize step by step.
            </p>
            <p style={{ color: 'var(--color-text-muted)' }}>
                Playground coming soon — building the visualizer engine first! 🚀
            </p>
        </div>
    );
}
