import type { Metadata } from 'next';
import { listProblems, listPatterns } from '../../lib/services';
import { ProfileClient } from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile — Developer Progress | VisuCode',
  description:
    'Track your DSA learning journey, solved problems, pattern mastery, and anonymous completion statistics on VisuCode.',
};

export default function ProfilePage() {
  const problems = listProblems();
  const patterns = listPatterns();

  return (
    <main>
      <ProfileClient allProblems={problems} patterns={patterns} />
    </main>
  );
}
