import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || 'github-dev-client-id',
      clientSecret: process.env.AUTH_GITHUB_SECRET || 'github-dev-client-secret',
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || 'google-dev-client-id',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || 'google-dev-client-secret',
    }),
  ],
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
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'visucode-development-auth-secret-key-32-chars-minimum',
});
