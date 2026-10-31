import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/email-allowlist";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "database" },
  trustHost: true,
  pages: { signIn: "/signin" },
  callbacks: {
    signIn({ user }) {
      return isEmailAllowed(
        user.email,
        process.env.ALLOWED_EMAILS ?? "",
        process.env.AUTH_OWNER_EMAIL ?? "",
      );
    },
  },
  events: {
    // เก็บ providerAccountId ของ Google เป็น googleId ตอนสร้าง/ล็อกอินครั้งแรก
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.id) return;
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { googleId: true },
      });
      if (existing?.googleId) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: account.providerAccountId },
      });
    },
  },
});
