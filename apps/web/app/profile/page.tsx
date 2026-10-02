import type { Metadata } from 'next';
import { listProblems, listPatterns, listTracks } from '../../lib/services';
import { ProfileClient } from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile — Developer Progress | VisuCode',
  description:
    'Track your DSA learning journey, solved problems, pattern mastery, and anonymous completion statistics on VisuCode.',
};

export default function ProfilePage() {
  const problems = listProblems();
  const patterns = listPatterns();
  const tracks = listTracks();
  const totalLessons = tracks.reduce((sum, t) => sum + (t.lessons?.length || 0), 0);

  return (
    <main>
      <ProfileClient
        allProblems={problems}
        patterns={patterns}
        totalLessons={totalLessons}
      />
    </main>
  );
}
