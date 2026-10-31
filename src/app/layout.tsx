import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";
import { auth } from "@/auth";
import "./globals.css";

const fontSans = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "MyShelf",
  description: "บันทึกชั้นวางหนังสือของฉัน",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, image: session.user.image ?? null }
    : null;

  return (
    <html lang="th" className={`${fontSans.variable} h-full antialiased font-sans`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NavBar user={user} />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
