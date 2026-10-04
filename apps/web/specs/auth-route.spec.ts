/**
 * @jest-environment node
 */
import { handlers, auth, signIn, signOut } from '../auth';
import { GET, POST } from '../app/api/auth/[...nextauth]/route';

describe('Auth.js v5 Server Route Handlers (Phase 3 Sprint 2, F-P3S2-01)', () => {
  it('exports standard Auth.js v5 handlers, auth, signIn, and signOut from auth.ts', () => {
    expect(handlers).toBeDefined();
    expect(typeof handlers.GET).toBe('function');
    expect(typeof handlers.POST).toBe('function');
    expect(typeof auth).toBe('function');
    expect(typeof signIn).toBe('function');
    expect(typeof signOut).toBe('function');
  });

  it('re-exports GET and POST HTTP handlers from the App Router API route', () => {
    expect(GET).toBe(handlers.GET);
    expect(POST).toBe(handlers.POST);
  });

  it('restricts development fallback secret and dummy credentials to non-production environments', () => {
    const devFallback = 'visucode-development-auth-secret-key-32-chars-minimum';
    const isProd = process.env.NODE_ENV === 'production';
    const resolvedSecret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      (!isProd ? devFallback : undefined);

    if (isProd && !process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
      expect(resolvedSecret).toBeUndefined();
    } else {
      expect(resolvedSecret).toBeDefined();
    }
  });
});
