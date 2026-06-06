"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

interface Question {
  text: string;
  difficulty: number;
  skill_tested: string;
  follow_up_hints: string[];
}

interface Category {
  name: string;
  questions: Question[];
}

interface Plan {
  categories: Category[];
}

interface InterviewContext {
  role_type: string | null;
  level: string | null;
  years_of_experience: number | null;
  employment_type: string | null;
  company_name: string | null;
}

const LOADING_STEPS = [
  { label: "Analyzing your resume", duration: 3000 },
  { label: "Researching company details", duration: 3000 },
  { label: "Crafting personalized questions", duration: 4000 },
  { label: "Finalizing your interview plan", duration: 5000 },
];

const TIPS = [
  "Take a moment to review each question before your interview begins.",
  "Think about real examples from your experience for behavioral questions.",
  "It\u2019s okay to pause and think before answering \u2014 interviewers appreciate thoughtfulness.",
  "Focus on the STAR method: Situation, Task, Action, Result.",
  "Be specific with examples \u2014 vague answers are less convincing.",
];

// Category icons by keyword
function CategoryIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("behavioral") || lower.includes("background")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    );
  }
  if (lower.includes("voice") || lower.includes("real-time") || lower.includes("ai")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    );
  }
  if (lower.includes("backend") || lower.includes("system") || lower.includes("design")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    );
  }
  if (lower.includes("skill") || lower.includes("conceptual")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    );
  }
  if (lower.includes("company") || lower.includes("domain") || lower.includes("healthcare")) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
      </svg>
    );
  }
  // Default: technical/code
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

export default function InterviewPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [context, setContext] = useState<InterviewContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [regenerating, setRegenerating] = useState(false);

  // Animate through loading steps
  useEffect(() => {
    if (!loading) return;
    const timers: NodeJS.Timeout[] = [];
    let elapsed = 0;
    LOADING_STEPS.forEach((step, idx) => {
      if (idx === 0) return;
      elapsed += step.duration;
      timers.push(setTimeout(() => setLoadingStep(idx), elapsed));
    });
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // Cycle tips
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      setError("");

      try {
        const getRes = await apiFetch(`/api/interview/${id}/plan`);
        if (cancelled) return;
        if (getRes.ok) {
          const data = await getRes.json();
          setPlan(data.plan);
          if (data.context) setContext(data.context);
          setLoading(false);
          // Expand all categories by default
          if (data.plan?.categories) {
            setExpandedCats(new Set(data.plan.categories.map((_: Category, i: number) => i)));
          }
          return;
        }

        const postRes = await apiFetch(`/api/interview/${id}/plan`, {
          method: "POST",
        });
        if (cancelled) return;

        if (!postRes.ok) {
          const data = await postRes.json();
          setError(data.detail || "Failed to generate plan");
          return;
        }

        const data = await postRes.json();
        setPlan(data.plan);
        if (data.context) setContext(data.context);
        if (data.plan?.categories) {
          setExpandedCats(new Set(data.plan.categories.map((_: Category, i: number) => i)));
        }
      } catch {
        if (!cancelled) {
          setError("Failed to generate interview plan. Check your API key.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [id, authUser, authLoading]);

  const difficultyLabel = (d: number) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Expert"];
    return labels[d] || "Medium";
  };

  const difficultyColor = (d: number) => {
    if (d <= 1) return "bg-green-100 text-green-700 border border-green-200";
    if (d <= 2) return "bg-blue-100 text-blue-600 border border-blue-200";
    if (d <= 3) return "bg-orange-100 text-orange-700 border border-orange-200";
    return "bg-red-100 text-red-700 border border-red-200";
  };

  const difficultyDotColor = (d: number) => {
    if (d <= 2) return "bg-green-500";
    if (d <= 3) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const totalQuestions = plan
    ? plan.categories.reduce((sum, cat) => sum + cat.questions.length, 0)
    : 0;

  const estimatedTime = plan ? totalQuestions * 5 : 0; // ~5 min per question

  // Difficulty distribution
  function getDifficultyDistribution() {
    if (!plan) return { easy: 0, medium: 0, moderate: 0 };
    let easy = 0, medium = 0, moderate = 0;
    plan.categories.forEach((cat) =>
      cat.questions.forEach((q) => {
        if (q.difficulty <= 1) easy++;
        else if (q.difficulty <= 2) medium++;
        else moderate++; // 3 = Moderate, 4 = Hard, 5 = Expert
      })
    );
    return { easy, medium, moderate };
  }

  const dist = getDifficultyDistribution();

  // Filter categories
  function getFilteredCategories() {
    if (!plan) return [];
    let cats = plan.categories;

    // Filter by tab
    if (activeFilter !== "All") {
      cats = cats.filter((cat) => {
        const lower = cat.name.toLowerCase();
        if (activeFilter === "Behavioral") return lower.includes("behavioral") || lower.includes("background");
        if (activeFilter === "Technical") return lower.includes("technical") || lower.includes("backend") || lower.includes("system") || lower.includes("voice") || lower.includes("ai");
        if (activeFilter === "Skills") return lower.includes("skill") || lower.includes("conceptual");
        if (activeFilter === "Company") return lower.includes("company") || lower.includes("domain");
        return true;
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (question) =>
              question.text.toLowerCase().includes(q) ||
              question.skill_tested.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.questions.length > 0);
    }

    return cats;
  }

  const filteredCategories = getFilteredCategories();

  function toggleCategory(idx: number) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  // Get original category index for expanded state
  function getOriginalIndex(cat: Category) {
    return plan?.categories.findIndex((c) => c.name === cat.name) ?? 0;
  }

  async function regeneratePlan() {
    setRegenerating(true);
    setLoadingStep(0);
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/interview/${id}/plan?regenerate=true`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to regenerate plan");
        return;
      }
      const data = await res.json();
      setPlan(data.plan);
      if (data.context) setContext(data.context);
      if (data.plan?.categories) {
        setExpandedCats(new Set(data.plan.categories.map((_: Category, i: number) => i)));
      }
    } catch {
      setError("Failed to regenerate interview plan.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }

  const filterTabs = [
    { label: "All", icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    )},
    { label: "Behavioral", icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )},
    { label: "Technical", icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    )},
    { label: "Skills", icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    )},
    { label: "Company", icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
      </svg>
    )},
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {loading ? (
        /* ── Loading State ── */
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6">
          <div className="w-full max-w-lg text-center">
            {/* AI Agent Orb */}
            <div className="mx-auto mb-3 sm:mb-4 relative" style={{ width: 120, height: 120 }}>
              {/* Outer dashed orbit with 3 dots */}
              <svg className="absolute inset-0 animate-[spin_25s_linear_infinite]" width="120" height="120" viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="76" stroke="#c7d2e8" strokeWidth="0.8" strokeDasharray="5 3.5" />
                <circle cx="80" cy="4" r="3.5" fill="#6b8abf" />
                <circle cx="156" cy="80" r="4" fill="#7c9fd4" />
                <circle cx="28" cy="142" r="3" fill="#94b3de" />
              </svg>
              {/* Inner solid ring */}
              <div className="absolute inset-[16px] sm:inset-[22px] rounded-full border border-blue-200/50" />
              {/* Center glowing orb */}
              <div className="absolute inset-[26px] sm:inset-[36px] rounded-full shadow-[0_0_35px_rgba(59,130,246,0.15)] flex items-center justify-center" style={{ background: "radial-gradient(circle, #ffffff 0%, #eff6ff 50%, #dbeafe 100%)" }}>
                <svg className="w-8 h-6 sm:w-[44px] sm:h-9" viewBox="0 0 44 36" fill="none">
                  {(() => {
                    const bars = [3,5,8,5,11,14,8,17,22,26,30,32,30,26,22,17,11,14,8,6,9,5,6,3];
                    return bars.map((h, i) => (
                      <rect key={i} x={1.5 + i * 1.8} y={18 - h / 2} width="1.2" height={h} rx="0.6" fill="#2563eb" />
                    ));
                  })()}
                </svg>
              </div>
            </div>
            {/* AI agent working badge */}
            <div className="mx-auto mb-2.5 sm:mb-4 inline-flex items-center gap-1.5 rounded-full bg-green-50/80 border border-green-200/60 px-2.5 py-0.5 sm:px-3 sm:py-1">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
              <span className="text-[11px] sm:text-[13px] font-medium text-green-700">AI agent working</span>
            </div>
            <h1 className="text-[15px] sm:text-xl font-bold text-gray-900">Generating Your Interview Plan</h1>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[13px] text-gray-500">Our AI is crafting personalized questions based on your profile</p>
            <div className="mt-3 sm:mt-5 mx-auto max-w-xs">
              <div className="h-1 sm:h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 95)}%` }} />
              </div>
            </div>
            <div className="mt-3 sm:mt-5 space-y-2 sm:space-y-2.5 mx-auto max-w-xs text-left">
              {LOADING_STEPS.map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2 sm:gap-2.5">
                  {idx < loadingStep ? (
                    <div className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : idx === loadingStep ? (
                    <div className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center">
                      <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-200" />
                  )}
                  <span className={`text-[11px] sm:text-[13px] ${idx < loadingStep ? "text-green-600 font-medium" : idx === loadingStep ? "text-gray-900 font-medium" : "text-gray-400"}`}>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 sm:mt-6 rounded-lg bg-blue-50 border border-blue-100 p-2.5 sm:p-3 mx-auto max-w-xs">
              <div className="flex items-start gap-2 sm:gap-2.5">
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 mt-0.5">
                  <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Interview Tip</p>
                  <p className="mt-0.5 text-[11px] sm:text-[13px] text-blue-600 leading-relaxed">{TIPS[tipIndex]}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-gray-400">This usually takes 10–15 seconds</p>
          </div>
        </main>
      ) : error ? (
        /* ── Error State ── */
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-3 sm:mb-5 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-red-100">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h2 className="text-[15px] sm:text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm text-gray-500">{error}</p>
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3">
              <button onClick={() => router.push("/dashboard")} className="rounded-md sm:rounded-lg border border-gray-300 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Back to Dashboard</button>
              <button onClick={() => window.location.reload()} className="rounded-md sm:rounded-lg bg-blue-600 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[11px] sm:text-sm font-medium text-white hover:bg-blue-500 transition">Try Again</button>
            </div>
          </div>
        </main>
      ) : plan ? (
        /* ── Plan View ── */
        <div className="flex-1 overflow-y-auto">
          {/* Header Section */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-10 py-3 sm:py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                    <h1 className="text-[15px] sm:text-xl font-bold text-gray-900">Interview Plan</h1>
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-green-700">
                      <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-green-500" />
                      Plan ready
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-[13px] text-gray-500">AI-generated practice blueprint tailored to your profile</p>
                  {/* Context Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2.5">
                    {context?.role_type && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-1.5 py-px sm:px-2.5 sm:py-0.5 text-[10px] sm:text-xs text-blue-700">
                        <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>
                        {context.role_type}
                      </span>
                    )}
                    {context?.company_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-1.5 py-px sm:px-2.5 sm:py-0.5 text-[10px] sm:text-xs text-purple-700">
                        <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" /></svg>
                        {context.company_name}
                      </span>
                    )}
                    {context?.level && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-1.5 py-px sm:px-2.5 sm:py-0.5 text-[10px] sm:text-xs text-amber-700">
                        <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                        {context.level === "entry" ? "Entry Level" : context.level === "mid" ? "Mid Level" : context.level === "senior" ? "Senior" : context.level}
                      </span>
                    )}
                    {context?.employment_type && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-1.5 py-px sm:px-2.5 sm:py-0.5 text-[10px] sm:text-xs text-gray-600">
                        <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {context.employment_type === "full_time" ? "Full Time" : context.employment_type === "part_time" ? "Part Time" : context.employment_type === "contract" ? "Contract" : context.employment_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button className="flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                    Save Plan
                  </button>
                  <button
                    onClick={regeneratePlan}
                    disabled={regenerating}
                    className="flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${regenerating ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                    {regenerating ? "Regenerating..." : "Regenerate"}
                  </button>
                  <button
                    onClick={() => router.push(`/interview/session/${id}`)}
                    className="flex items-center gap-1 sm:gap-1.5 rounded-md sm:rounded-lg bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-[13px] font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                    Begin Interview
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-10 py-3 sm:py-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-2.5 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg bg-blue-50">
                    <svg className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] sm:text-xl font-bold text-gray-900">{totalQuestions}</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500">Questions</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-2.5 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg bg-purple-50">
                    <svg className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] sm:text-xl font-bold text-gray-900">{plan.categories.length}</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500">Categories</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-2.5 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg bg-amber-50">
                    <svg className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] sm:text-xl font-bold text-gray-900">~{estimatedTime} min</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500">Estimated Time</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-2.5 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-md sm:rounded-lg bg-green-50">
                    <svg className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] sm:text-xl font-bold text-gray-900">Ready</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500">Voice Agent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content + Sidebar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-10 pb-6 sm:pb-8 flex gap-6">
            {/* Left: Questions */}
            <div className="flex-1 min-w-0">
              {/* Filter Tabs + Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
                <div className="flex items-center gap-0.5 sm:gap-1 rounded-md sm:rounded-lg border border-gray-200 bg-white p-0.5 sm:p-1">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => setActiveFilter(tab.label)}
                      className={`flex items-center gap-1 sm:gap-1.5 rounded-md px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-[13px] font-medium transition ${
                        activeFilter === tab.label
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-56">
                  <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md sm:rounded-lg border border-gray-200 bg-white pl-8 sm:pl-9 pr-3 py-1 sm:py-1.5 text-[11px] sm:text-[13px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Question Cards by Category */}
              <div className="space-y-4 sm:space-y-6">
                {filteredCategories.map((category) => {
                  const origIdx = getOriginalIndex(category);
                  const catNum = origIdx + 1;

                  return (
                    <div key={category.name}>
                      {/* Category Label */}
                      <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-blue-50 text-blue-600">
                          <CategoryIcon name={category.name} />
                        </div>
                        <h2 className="text-[12px] sm:text-[14px] font-semibold text-gray-900">{catNum}. {category.name}</h2>
                        <span className="rounded-full bg-gray-100 px-1.5 py-px sm:px-2 sm:py-0.5 text-[9px] sm:text-[11px] font-medium text-gray-500">{category.questions.length}</span>
                      </div>

                      {/* Individual Question Cards */}
                      <div className="space-y-2 sm:space-y-2.5">
                        {category.questions.map((q, qIdx) => {
                          const skills = q.skill_tested.split(",").map((s) => s.trim()).filter(Boolean);
                          return (
                            <div key={qIdx} className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 hover:border-gray-300 transition">
                              {/* Question number + Tags row */}
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">{catNum}.{qIdx + 1}</span>
                                <span className={`rounded-full px-1.5 py-px sm:px-2 sm:py-0.5 text-[9px] sm:text-[11px] font-medium ${difficultyColor(q.difficulty)}`}>
                                  {difficultyLabel(q.difficulty)}
                                </span>
                                {skills.map((skill) => (
                                  <span key={skill} className="rounded-full border border-gray-200 bg-gray-50 px-1.5 py-px sm:px-2 sm:py-0.5 text-[9px] sm:text-[11px] text-gray-600">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              {/* Question text */}
                              <p className="text-[11px] sm:text-[13px] text-gray-900 leading-relaxed">{q.text}</p>
                              {/* Why this matters */}
                              {q.follow_up_hints && q.follow_up_hints.length > 0 && (
                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-gray-100">
                                  <p className="text-[9px] sm:text-[11px] text-gray-400 font-medium mb-0.5 sm:mb-1">Why this matters</p>
                                  <p className="text-[10px] sm:text-[12px] text-gray-500 leading-relaxed">{q.follow_up_hints[0]}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                    <p className="text-[13px] text-gray-500">No questions match your search.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <aside className="hidden xl:block w-[300px] shrink-0">
              <div className="space-y-5 sticky top-4">
                {/* Interview Summary */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-3">Interview Summary</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-lg font-bold text-gray-900">{totalQuestions}</p>
                      <p className="text-[11px] text-gray-500">Questions</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-lg font-bold text-gray-900">{plan.categories.length}</p>
                      <p className="text-[11px] text-gray-500">Categories</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-lg font-bold text-gray-900">~{estimatedTime}m</p>
                      <p className="text-[11px] text-gray-500">Est. Time</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <p className="text-[11px] font-medium text-green-700">Ready</p>
                      </div>
                      <p className="text-[11px] text-gray-500">Voice Agent</p>
                    </div>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-3">Difficulty Distribution</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray={`${(dist.easy / totalQuestions) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`} strokeDashoffset="0" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#60a5fa" strokeWidth="10" strokeDasharray={`${(dist.medium / totalQuestions) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`} strokeDashoffset={`${-(dist.easy / totalQuestions) * 2 * Math.PI * 38}`} />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" strokeWidth="10" strokeDasharray={`${(dist.moderate / totalQuestions) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`} strokeDashoffset={`${-((dist.easy + dist.medium) / totalQuestions) * 2 * Math.PI * 38}`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-bold text-gray-900">{totalQuestions}</span>
                        <span className="text-[9px] text-gray-400">Total</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-[12px] text-gray-700">Easy</span>
                        </div>
                        <span className="text-[12px] text-gray-400">{dist.easy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                          <span className="text-[12px] text-gray-700">Medium</span>
                        </div>
                        <span className="text-[12px] text-gray-400">{dist.medium}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          <span className="text-[12px] text-gray-700">Moderate</span>
                        </div>
                        <span className="text-[12px] text-gray-400">{dist.moderate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Agent Focus */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-3">AI Agent Focus</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 mt-0.5">
                        <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-gray-900">Natural Conversation</p>
                        <p className="text-[11px] text-gray-500">AI adapts follow-ups based on your responses</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 mt-0.5">
                        <svg className="h-3.5 w-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-gray-900">Real-time Scoring</p>
                        <p className="text-[11px] text-gray-500">Instant feedback on each answer</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50 mt-0.5">
                        <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-gray-900">Detailed Report</p>
                        <p className="text-[11px] text-gray-500">Comprehensive analysis after interview</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-2">
                    {plan.categories.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveFilter("All");
                          setExpandedCats(new Set([idx]));
                        }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 transition"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                          <CategoryIcon name={cat.name} />
                        </div>
                        <p className="text-[12px] text-gray-900 truncate flex-1">{cat.name}</p>
                        <span className="text-[11px] text-gray-400 shrink-0">{cat.questions.length}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Your Context */}
                {context && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-3">Your Context</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-500">Role</span>
                        <span className="text-[12px] font-medium text-gray-900">{context.role_type || "\u2014"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-500">Company</span>
                        <span className="text-[12px] font-medium text-gray-900">{context.company_name || "\u2014"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-500">Experience</span>
                        <span className="text-[12px] font-medium text-gray-900">{context.years_of_experience ?? 0} years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-500">Level</span>
                        <span className="text-[12px] font-medium text-gray-900 capitalize">{context.level || "\u2014"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Begin Interview Button */}
                <button
                  onClick={() => router.push(`/interview/session/${id}`)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-[13px] font-semibold text-white shadow-lg hover:bg-blue-500 transition"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                  Begin Interview
                </button>
                <p className="text-[11px] text-center text-gray-400 -mt-3">
                  You cannot pause or go back once started.
                </p>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}
