import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "@/app/components/PageTransition";

export const metadata: Metadata = {
  title: "NEU Library — Visitor Log",
  description: "New Era University Library Visitor Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}