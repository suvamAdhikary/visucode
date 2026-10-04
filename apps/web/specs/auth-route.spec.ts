/**
 * @jest-environment node
 */
import {
  handlers,
  auth,
  signIn,
  signOut,
  authConfig,
  resolveAuthSecret,
  resolveAuthProviders,
  getAuthConfig,
} from '../auth';
import { GET, POST } from '../app/api/auth/[...nextauth]/route';

describe('Auth.js v5 Server Route Handlers & Configuration (Phase 3 Sprint 2, F-P3S2-01, F-P3S2-03)', () => {
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

  it('exports valid authConfig with JWT session strategy', () => {
    expect(authConfig).toBeDefined();
    expect(authConfig.session?.strategy).toBe('jwt');
    expect(typeof authConfig.callbacks?.jwt).toBe('function');
    expect(typeof authConfig.callbacks?.session).toBe('function');
  });

  describe('Production Secret & Provider Security Guards in auth.ts', () => {
    it('resolveAuthSecret strictly disallows fallback secrets in production when env is unset', () => {
      // In production with no env secret, resolveAuthSecret must return undefined to prevent public token signing
      const prodSecret = resolveAuthSecret({ nodeEnv: 'production' });
      expect(prodSecret).toBeUndefined();
    });

    it('resolveAuthSecret accepts explicit production secrets from env', () => {
      const prodSecret = resolveAuthSecret({
        nodeEnv: 'production',
        authSecret: 'custom-production-secret-min-32-chars-long',
      });
      expect(prodSecret).toBe('custom-production-secret-min-32-chars-long');
    });

    it('resolveAuthSecret provides dev fallback only in non-production environments', () => {
      const devSecret = resolveAuthSecret({ nodeEnv: 'development' });
      expect(devSecret).toBe('visucode-development-auth-secret-key-32-chars-minimum');
    });

    it('resolveAuthProviders rejects dummy dev credentials in production mode', () => {
      // In production without configured OAuth credentials, no dummy providers are registered
      const prodProviders = resolveAuthProviders({ nodeEnv: 'production' });
      expect(prodProviders).toEqual([]);
    });

    it('resolveAuthProviders registers providers when credentials are provided in production', () => {
      const prodProviders = resolveAuthProviders({
        nodeEnv: 'production',
        githubId: 'real-gh-client-id',
        githubSecret: 'real-gh-client-secret',
      });
      expect(prodProviders.length).toBe(1);
    });

    it('getAuthConfig configures undefined secret in production when env secret is absent', () => {
      const config = getAuthConfig({ nodeEnv: 'production' });
      expect(config.secret).toBeUndefined();
    });
  });
});
