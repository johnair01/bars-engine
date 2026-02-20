import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { AdminIdentitySwitcher } from "@/components/AdminIdentitySwitcher";
import { DevIdentitySwitcher } from "@/components/DevIdentitySwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conclave",
  description: "A quest system for the vibrational convergence",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Conclave",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on text inputs
  },
};

export const viewport = {
  themeColor: "#000000",
}

import { getCurrentPlayerSafe } from "@/lib/auth-safe";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { playerId, player, isAdmin, dbError, errorMessage } = await getCurrentPlayerSafe({ includeRoles: true });

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {dbError && process.env.NODE_ENV !== 'production' && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-[10px] font-bold py-1 px-4 text-center uppercase tracking-widest shadow-lg">
            ⚠️ {errorMessage || "Database Unreachable"} — Running in Guest Mode (Check DATABASE_URL)
          </div>
        )}
        <NavBar isAdmin={isAdmin} isAuthenticated={!!playerId} />
        <div className={`pt-14 ${dbError && process.env.NODE_ENV !== 'production' ? 'mt-6' : ''}`}>
          {children}
        </div>
        {/* Production Switcher (Admin Gated) */}
        {isAdmin && <AdminIdentitySwitcher />}

        {/* Legacy Dev Switcher (Non-production only) */}
        {process.env.NODE_ENV !== 'production' && <DevIdentitySwitcher />}
      </body>
    </html>
  );
}
