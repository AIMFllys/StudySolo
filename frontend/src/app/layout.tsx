import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { AuthSessionBridge } from "@/features/auth/components";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudySolo - AI Learning Workflow Platform",
  description:
    "Generate complete learning workflows with AI, from outlines to key concepts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionBridge />
        <NextTopLoader
          color="#6366F1"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 15px rgba(99, 102, 241, 0.6), 0 0 5px rgba(99, 102, 241, 0.4)"
        />
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          richColors
          position="top-center"
          theme="system"
          closeButton
          toastOptions={{
            style: {
              background: "var(--ss-surface-glass)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--ss-border-dark)",
              color: "var(--ss-text-main)",
            },
            className: "glass-card shadow-glow",
          }}
        />
      </body>
    </html>
  );
}
