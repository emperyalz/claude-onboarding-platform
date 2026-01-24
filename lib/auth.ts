import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Convex client for server-side operations
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

async function convexQuery(functionPath: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });
  const data = await response.json();
  return data.value;
}

async function convexMutation(functionPath: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });
  const data = await response.json();
  return data.value;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Get user from Convex
        const user = await convexQuery("users:getUserWithPassword", {
          email: credentials.email,
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please use Google to log in.");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Sync Google user to Convex
        await convexMutation("users:saveUser", {
          name: user.name || "User",
          email: user.email!,
          image: user.image,
          provider: "google",
          providerId: account.providerAccountId,
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.provider = token.provider as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper to hash password for registration
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper to verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
