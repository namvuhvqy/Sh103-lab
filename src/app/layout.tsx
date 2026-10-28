import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalPushSync } from "@/components/notifications/GlobalPushSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SH103 Lab - Quản lý Biểu mẫu Sinh Hóa",
  description: "Web app quản lý biểu mẫu nội bộ Khoa/Bộ môn Sinh hóa",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo103.png",
    apple: "/images/logo103.png",
    shortcut: "/images/logo103.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SH103 Lab",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans">
        <GlobalPushSync />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                function registerSW() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('Service Worker registration failed:', err);
                  });
                }
                if (document.readyState === 'complete') {
                  registerSW();
                } else {
                  window.addEventListener('load', registerSW);
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
