import './global.css';
import type { Metadata } from 'next';
import { Navbar } from './components/layout/Navbar';

export const metadata: Metadata = {
  title: {
    default: 'VisuCode — Learn DSA Visually',
    template: '%s | VisuCode',
  },
  description:
    'Master Data Structures & Algorithms through interactive visual lessons, step-by-step dry runs, and a built-in code editor. Learn by seeing, not just reading.',
  keywords: [
    'DSA',
    'data structures',
    'algorithms',
    'visual learning',
    'coding interview',
    'leetcode',
    'two pointers',
    'binary search',
    'sliding window',
  ],
  openGraph: {
    title: 'VisuCode — Learn DSA Visually',
    description:
      'Master Data Structures & Algorithms through interactive visual lessons, step-by-step dry runs, and a built-in code editor.',
    type: 'website',
    locale: 'en_US',
    siteName: 'VisuCode',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
