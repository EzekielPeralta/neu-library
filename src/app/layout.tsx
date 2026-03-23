import type { Metadata, Viewport } from "next";
import "./globals.css";
import PageTransition from "@/app/components/PageTransition";
import { ThemeProvider } from "@/app/lib/themeContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#060d1a",
};

export const metadata: Metadata = {
  title: "NEU Library — Visitor Log",
  description: "New Era University Library Visitor Management System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEU Library",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/neu-library-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/neu-library-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/neu-library-logo.png" />
        <link rel="shortcut icon" href="/neu-library-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}