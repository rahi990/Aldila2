"use client";

import { usePathname, useRouter } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, user, logout } = useAuth();
  const { showToast } = useToast();

  // Hide Header and BottomNav on login, register, and admin panel pages
  const hideNavigation = pathname === "/login" || pathname === "/register" || pathname?.startsWith("/aldilaadmin");

  // Check if user is banned
  useEffect(() => {
    if (user && userData && userData.isBanned) {
      showToast("আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। সাপোর্টে যোগাযোগ করুন।", "error");
      logout();
      router.push("/login");
    }
  }, [user, userData, router, logout, showToast]);

  return (
    <>
      {!hideNavigation && <Header />}
      <main className={hideNavigation ? "min-h-screen" : "pb-20 min-h-screen"}>
        {children}
      </main>
      {!hideNavigation && <BottomNav />}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Aldila</title>
        <meta name="description" content="Earn money by completing tasks" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#84cc16" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Aldila" />
        <link rel="apple-touch-icon" href="/assets/applogo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ToastProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
