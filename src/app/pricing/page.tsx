"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "",
    description: "Try RoundReady with 2 free interviews",
    credits: "2 interviews (one-time)",
    features: [
      "2 interview credits",
      "Voice & coding rounds",
      "AI-powered feedback",
      "Detailed performance report",
    ],
    cta: "Current Plan",
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹849",
    period: "/month",
    description: "For casual practice and steady improvement",
    credits: "15 interviews/month",
    features: [
      "15 interview credits/month",
      "Voice & coding rounds",
      "AI-powered feedback",
      "Detailed performance report",
      "Score trends & analytics",
      "Target company research",
    ],
    cta: "Subscribe",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹2,099",
    period: "/month",
    description: "For serious prep before your next big interview",
    credits: "40 interviews/month",
    features: [
      "40 interview credits/month",
      "Voice & coding rounds",
      "AI-powered feedback",
      "Detailed performance report",
      "Score trends & analytics",
      "Target company research",
      "Priority support",
    ],
    cta: "Subscribe",
    highlight: true,
  },
];

const TOPUP_PACKS = [
  { id: "pack_5", credits: 5, price: "₹419", perCredit: "₹84" },
  { id: "pack_15", credits: 15, price: "₹1,099", perCredit: "₹73" },
  { id: "pack_30", credits: 30, price: "₹1,899", perCredit: "₹63" },
];

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: () => void;
  prefill: {
    email: string;
    name: string;
  };
  theme: { color: string };
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayCheckout = {
  on: (event: "payment.failed", callback: () => void) => void;
  open: () => void;
};

function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  return err instanceof Error ? err.message : fallback;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, planInfo, refreshPlan } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loadRazorpayScript(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Poll for plan update after payment (webhook may take a few seconds)
  const waitForPlanUpdate = useCallback(
    (expectedChange: "subscription" | "topup", previousCredits: number) => {
      setMessage({ type: "info", text: "Payment received! Updating your account..." });
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        await refreshPlan();
        const res = await apiFetch("/api/payment/plan");
        if (res.ok) {
          const data = await res.json();
          const updated =
            expectedChange === "subscription"
              ? data.plan !== "free"
              : data.credits_remaining > previousCredits;
          if (updated) {
            if (pollRef.current) clearInterval(pollRef.current);
            setMessage({ type: "success", text: "Payment successful! Your account has been updated." });
            setTimeout(() => router.push("/dashboard"), 1500);
            return;
          }
        }
        if (attempts >= 15) {
          // Stop after ~30 seconds
          if (pollRef.current) clearInterval(pollRef.current);
          setMessage({
            type: "success",
            text: "Payment received! Your credits will update shortly.",
          });
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      }, 2000);
    },
    [refreshPlan, router],
  );

  async function handleSubscribe(plan: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(plan);
    setMessage(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway");

      const res = await apiFetch("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      const data = await res.json();

      // Get current credits before payment
      const planRes = await apiFetch("/api/payment/plan");
      const currentPlan = planRes.ok ? await planRes.json() : { credits_remaining: 0 };

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "RoundReady",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly`,
        order_id: data.order_id,
        handler: () => {
          // Payment done on Razorpay's side — now wait for webhook to process
          waitForPlanUpdate("subscription", currentPlan.credits_remaining);
        },
        prefill: {
          email: user.email || "",
          name: user.displayName || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setLoading(null),
        },
      };

      if (!window.Razorpay) throw new Error("Payment gateway is unavailable");

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setMessage({ type: "error", text: "Payment failed. Please try again." });
        setLoading(null);
      });
      rzp.open();
    } catch (err: unknown) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(null);
    }
  }

  async function handleTopup(packId: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(packId);
    setMessage(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway");

      const res = await apiFetch("/api/payment/create-topup", {
        method: "POST",
        body: JSON.stringify({ pack_id: packId }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      const data = await res.json();

      const pack = TOPUP_PACKS.find((p) => p.id === packId)!;

      // Get current credits before payment
      const planRes = await apiFetch("/api/payment/plan");
      const currentPlan = planRes.ok ? await planRes.json() : { credits_remaining: 0 };

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "RoundReady",
        description: `Top-up: ${pack.credits} Credits`,
        order_id: data.order_id,
        handler: () => {
          // Payment done on Razorpay's side — now wait for webhook to process
          waitForPlanUpdate("topup", currentPlan.credits_remaining);
        },
        prefill: {
          email: user.email || "",
          name: user.displayName || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setLoading(null),
        },
      };

      if (!window.Razorpay) throw new Error("Payment gateway is unavailable");

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setMessage({ type: "error", text: "Payment failed. Please try again." });
        setLoading(null);
      });
      rzp.open();
    } catch (err: unknown) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500">
            Start free, upgrade when you need more practice
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-auto mb-6 max-w-md rounded-lg px-4 py-3 text-center text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : message.type === "info"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Plans */}
        <div className="grid gap-6 sm:grid-cols-3 mb-14">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-white p-6 flex flex-col ${
                plan.highlight
                  ? "border-blue-500 shadow-md ring-1 ring-blue-500"
                  : "border-gray-200"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-gray-500">{plan.period}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">{plan.credits}</p>
              <p className="mt-3 text-sm text-gray-600">{plan.description}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {(() => {
                const userPlan = planInfo?.plan || "free";
                const isCurrentPlan = plan.id === userPlan;
                const planRank = { free: 0, starter: 1, pro: 2 } as Record<string, number>;
                const isDowngrade = (planRank[plan.id] ?? 0) < (planRank[userPlan] ?? 0);

                let label = plan.cta;
                if (isCurrentPlan) label = "Current Plan";
                else if (isDowngrade) label = "Current: " + (userPlan.charAt(0).toUpperCase() + userPlan.slice(1));
                else if (plan.id !== "free") label = "Upgrade";
                if (loading === plan.id) label = "Processing...";

                const disabled = isCurrentPlan || isDowngrade || plan.id === "free" || loading === plan.id;

                return (
                  <button
                    onClick={() => !disabled && handleSubscribe(plan.id)}
                    disabled={disabled}
                    className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition ${
                      isCurrentPlan
                        ? "cursor-default border border-green-300 bg-green-50 text-green-700"
                        : disabled
                        ? "cursor-default border border-gray-200 bg-gray-50 text-gray-400"
                        : plan.highlight
                        ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    }`}
                  >
                    {label}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>

        {/* Top-up Section */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Need More Credits?</h2>
          <p className="mt-1 text-sm text-gray-500">
            One-time top-up packs — no subscription required
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          {TOPUP_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-xl border border-gray-200 bg-white p-5 text-center"
            >
              <p className="text-2xl font-bold text-gray-900">{pack.credits}</p>
              <p className="text-xs text-gray-500">credits</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{pack.price}</p>
              <p className="text-xs text-gray-400">{pack.perCredit}/credit</p>
              <button
                onClick={() => handleTopup(pack.id)}
                disabled={loading === pack.id}
                className="mt-4 w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                {loading === pack.id ? "Processing..." : "Buy Now"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Payments powered by Razorpay. All prices in INR. Subscription credits reset monthly.
          Top-up credits never expire.
        </p>
      </div>
    </div>
  );
}
