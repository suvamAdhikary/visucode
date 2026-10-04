import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

const isProduction = process.env.NODE_ENV === 'production';

// In production, AUTH_SECRET / NEXTAUTH_SECRET MUST be set via environment.
// Fallback is strictly disallowed in production to prevent signing tokens with a known public key.
const secret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (!isProduction ? 'visucode-development-auth-secret-key-32-chars-minimum' : undefined);

// Build providers list: in production, only register providers with configured credentials.
const providers: Provider[] = [];

const githubClientId = process.env.AUTH_GITHUB_ID || (!isProduction ? 'github-dev-client-id' : undefined);
const githubClientSecret = process.env.AUTH_GITHUB_SECRET || (!isProduction ? 'github-dev-client-secret' : undefined);

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
}

const googleClientId = process.env.AUTH_GOOGLE_ID || (!isProduction ? 'google-dev-client-id' : undefined);
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || (!isProduction ? 'google-dev-client-secret' : undefined);

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
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
        (session.user as unknown as { provider?: string }).provider = token.provider as string | undefined;
      }
      return session;
    },
  },
  ...(secret ? { secret } : {}),
});
