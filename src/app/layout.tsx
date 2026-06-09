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
  title: {
    default: "RoundReady — AI Mock Interview Practice | Voice & Coding Rounds",
    template: "%s | RoundReady",
  },
  description:
    "Practice mock interviews with an AI interviewer that adapts to your resume. Voice interviews, live coding rounds, and detailed feedback reports. Free to try.",
  keywords: [
    "mock interview",
    "AI interview practice",
    "interview preparation",
    "coding interview practice",
    "voice interview simulator",
    "technical interview prep",
    "behavioral interview practice",
    "AI interviewer",
    "interview feedback",
    "job interview practice",
    "software engineer interview",
    "coding round practice",
  ],
  metadataBase: new URL("https://www.roundready.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RoundReady — AI Mock Interview Practice",
    description:
      "Practice mock interviews with an AI that adapts to your resume. Voice interviews, live coding rounds, and detailed feedback.",
    url: "https://www.roundready.in",
    siteName: "RoundReady",
    type: "website",
    images: [
      {
        url: "/RoundReady logo.png",
        width: 512,
        height: 512,
        alt: "RoundReady - AI Mock Interview Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoundReady — AI Mock Interview Practice",
    description:
      "Practice mock interviews with an AI that adapts to your resume. Voice & coding rounds with detailed feedback.",
    images: ["/RoundReady logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
