import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/modules/common/components/Header";
import { OfflineIndicator } from "@/modules/common/components/OfflineIndicator";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ServiceWorkerRegistrator } from "./ServiceWorkerRegistrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobPulse - Job Intelligence Engine",
  description: "Find and track the best job opportunities with intelligent scoring and filtering",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Job Pulse",
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Static manifest link - must be in initial HTML for PWA detection */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Job Pulse" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
        <ServiceWorkerRegistrator />
        <ThemeProvider>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <OfflineIndicator />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
