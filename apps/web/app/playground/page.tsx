import PlaygroundClient from './PlaygroundClient';

export const metadata = {
  title: 'Playground — Code Sandbox | VisuCode',
  description:
    'Write, run, and experiment with algorithm code. Pick a pattern template, toggle Interview/Practice mode, and see instant results.',
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
