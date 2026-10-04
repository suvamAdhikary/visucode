import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export interface AuthEnvConfig {
  nodeEnv?: string;
  authSecret?: string;
  nextauthSecret?: string;
  githubId?: string;
  githubSecret?: string;
  googleId?: string;
  googleSecret?: string;
}

/**
 * Resolves the JWT encryption secret.
 * In production (NODE_ENV === 'production'), AUTH_SECRET / NEXTAUTH_SECRET is strictly required.
 * Fallbacks are restricted exclusively to development and test environments to prevent token forgery.
 */
export function resolveAuthSecret(env?: AuthEnvConfig): string | undefined {
  const nodeEnv = env?.nodeEnv ?? process.env.NODE_ENV;
  const isProd = nodeEnv === 'production';
  const secret =
    env?.authSecret ??
    env?.nextauthSecret ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (secret) return secret;
  if (!isProd) {
    return 'visucode-development-auth-secret-key-32-chars-minimum';
  }
  return undefined;
}

/**
 * Resolves OAuth providers.
 * In production, providers are only registered if their respective credentials exist in the environment.
 * Development dummy credentials are never registered in production.
 */
export function resolveAuthProviders(env?: AuthEnvConfig): Provider[] {
  const nodeEnv = env?.nodeEnv ?? process.env.NODE_ENV;
  const isProd = nodeEnv === 'production';
  const providers: Provider[] = [];

  const githubId =
    env?.githubId ?? process.env.AUTH_GITHUB_ID ?? (!isProd ? 'github-dev-client-id' : undefined);
  const githubSecret =
    env?.githubSecret ??
    process.env.AUTH_GITHUB_SECRET ??
    (!isProd ? 'github-dev-client-secret' : undefined);

  if (githubId && githubSecret) {
    providers.push(
      GitHub({
        clientId: githubId,
        clientSecret: githubSecret,
      })
    );
  }

  const googleId =
    env?.googleId ?? process.env.AUTH_GOOGLE_ID ?? (!isProd ? 'google-dev-client-id' : undefined);
  const googleSecret =
    env?.googleSecret ??
    process.env.AUTH_GOOGLE_SECRET ??
    (!isProd ? 'google-dev-client-secret' : undefined);

  if (googleId && googleSecret) {
    providers.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
      })
    );
  }

  return providers;
}

/**
 * Builds the complete Auth.js v5 configuration object.
 */
export function getAuthConfig(env?: AuthEnvConfig): NextAuthConfig {
  const resolvedSecret = resolveAuthSecret(env);
  const resolvedProviders = resolveAuthProviders(env);

  return {
    providers: resolvedProviders,
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
        }
        if (account) {
          token.provider = account.provider;
        }
        return token;
      },
      session({ session, token }) {
        if (session?.user) {
          session.user.id = (token.id as string) || (token.sub as string);
          (session.user as unknown as { provider?: string }).provider = token.provider as
            | string
            | undefined;
        }
        return session;
      },
    },
    ...(resolvedSecret ? { secret: resolvedSecret } : {}),
  };
}

export const authConfig = getAuthConfig();
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

