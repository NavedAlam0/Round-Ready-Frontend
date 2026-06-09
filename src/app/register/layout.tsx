import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Start Practicing Mock Interviews Free",
  description:
    "Create a free RoundReady account. Get 2 free AI mock interviews with voice conversations, coding rounds, and detailed feedback reports.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Sign Up for RoundReady — Free AI Mock Interviews",
    description:
      "Get 2 free AI mock interviews. Practice voice interviews and coding rounds with personalized feedback.",
    url: "https://www.roundready.in/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
