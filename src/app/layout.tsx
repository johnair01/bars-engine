import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
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

import { db } from "@/lib/db";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("bars_player_id")?.value;
  let isAdmin = false;

  if (playerId) {
    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { roles: { include: { role: true } } },
    });
    if (player) {
      isAdmin = player.roles.some((r) => r.role.key === "admin");
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavBar isAdmin={isAdmin} />
        <div className="pt-14">
          {children}
        </div>
        {(process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_TOOLS === 'true') && <DevIdentitySwitcher />}
      </body>
    </html>
  );
}
