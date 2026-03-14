import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import UnverifiedEmailBanner from "@/components/ui/UnverifiedEmailBanner";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CampusKart",
  description: "Campus-only peer-to-peer marketplace for .edu students",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read session once at the layout level to drive both the Navbar and the banner.
  // getSession() is cheap — it only decodes the cookie; no DB call.
  const session = await getSession();
  const showBanner = session !== null && !session.emailVerified;

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-text-primary">
        <Navbar />
        {/* T-12: amber warning banner for logged-in users whose email is unverified */}
        {showBanner && <UnverifiedEmailBanner />}
        {children}
      </body>
    </html>
  );
}
