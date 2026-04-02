import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      role?: string;
      memberId?: string | null;
      portalTier?: number | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role?: string;
    memberId?: string | null;
    portalTier?: number | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    memberId?: string | null;
    portalTier?: number | null;
  }
}
