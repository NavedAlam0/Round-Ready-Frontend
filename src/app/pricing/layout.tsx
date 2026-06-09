import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Affordable AI Mock Interview Plans",
  description:
    "Start with 2 free AI mock interviews. Upgrade for more voice interview and coding round practice sessions with detailed feedback reports.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "RoundReady Pricing — AI Mock Interview Plans",
    description:
      "Start free with 2 mock interviews. Affordable plans for unlimited AI interview practice.",
    url: "https://www.roundready.in/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
