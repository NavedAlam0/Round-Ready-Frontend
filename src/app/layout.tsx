import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoundReady — Ace Your Next Interview",
  description:
    "Practice interviews with an AI interviewer that adapts to your resume. Real-time voice conversations and detailed feedback.",
  icons: {
    icon: "/RoundReady logo.png",
    shortcut: "/RoundReady logo.png",
    apple: "/RoundReady logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
