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
    if (d <= 2) return "bg-green-100 text-green-700 border border-green-200";
    if (d <= 3) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
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
        if (q.difficulty <= 2) easy++;
        else if (q.difficulty <= 3) medium++;
        else moderate++;
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
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
              <svg className="h-10 w-10 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Generating Your Interview Plan</h1>
            <p className="mt-2 text-gray-500">Our AI is crafting personalized questions based on your profile</p>
            <div className="mt-8 mx-auto max-w-sm">
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${Math.min(((loadingStep + 1) / LOADING_STEPS.length) * 100, 95)}%` }} />
              </div>
            </div>
            <div className="mt-8 space-y-3 mx-auto max-w-xs text-left">
              {LOADING_STEPS.map((step, idx) => (
                <div key={step.label} className="flex items-center gap-3">
                  {idx < loadingStep ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : idx === loadingStep ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-200" />
                  )}
                  <span className={`text-sm ${idx < loadingStep ? "text-green-600 font-medium" : idx === loadingStep ? "text-gray-900 font-medium" : "text-gray-400"}`}>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-xl bg-blue-50 border border-blue-100 p-4 mx-auto max-w-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mt-0.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Interview Tip</p>
                  <p className="mt-1 text-sm text-blue-600 leading-relaxed">{TIPS[tipIndex]}</p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-xs text-gray-400">This usually takes 10\u201315 seconds</p>
          </div>
        </main>
      ) : error ? (
        /* ── Error State ── */
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => router.push("/dashboard")} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Back to Dashboard</button>
              <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Try Again</button>
            </div>
          </div>
        </main>
      ) : plan ? (
        /* ── Plan View ── */
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Plan</h1>
                <p className="mt-1 text-sm text-gray-500">{totalQuestions} questions across {plan.categories.length} categories</p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                Save Plan
              </button>
            </div>

            {/* Filter Tabs + Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveFilter(tab.label)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
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

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search questions or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-5 pb-8">
              {filteredCategories.map((category) => {
                const origIdx = getOriginalIndex(category);
                const isExpanded = expandedCats.has(origIdx);
                const catNum = origIdx + 1;
                const estCatTime = category.questions.length * 5;

                return (
                  <section key={category.name} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(origIdx)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <CategoryIcon name={category.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className="text-base font-semibold text-gray-900">
                            {catNum}. {category.name}
                          </h2>
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {category.questions.length} Questions
                          </span>
                          <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ~{estCatTime} min
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 truncate">
                          Tests: {Array.from(new Set(category.questions.map((q) => q.skill_tested))).join(", ")}
                        </p>
                      </div>
                      <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Questions */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {category.questions.map((q, qIdx) => {
                          const skills = q.skill_tested.split(",").map((s) => s.trim()).filter(Boolean);
                          return (
                            <div key={qIdx} className="flex items-start gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition">
                              <span className="mt-0.5 text-sm font-medium text-gray-400 w-8 shrink-0">
                                {catNum}.{qIdx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 leading-relaxed">{q.text}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(q.difficulty)}`}>
                                  {difficultyLabel(q.difficulty)}
                                </span>
                                {skills.slice(0, 2).map((skill) => (
                                  <span key={skill} className="hidden lg:inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <p className="text-sm text-gray-500">No questions match your search.</p>
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[340px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Interview Summary */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Interview Summary</h3>
                <div className="grid grid-cols-2 gap-3 overflow-hidden">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-xs text-gray-500">Total Questions</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      <span className="text-xs text-gray-500">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{plan.categories.length}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">Estimated Time</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">~{estimatedTime} min</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                      <span className="text-xs text-gray-500">Difficulty Mix</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-1">
                      <span className="text-[10px] font-medium text-green-600">Easy</span>
                      <span className="text-[10px] text-gray-300">&bull;</span>
                      <span className="text-[10px] font-medium text-yellow-600">Medium</span>
                      <span className="text-[10px] text-gray-300">&bull;</span>
                      <span className="text-[10px] font-medium text-orange-600">Moderate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories List */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Categories ({plan.categories.length})</h3>
                <div className="space-y-2.5">
                  {plan.categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveFilter("All");
                        setExpandedCats(new Set([idx]));
                        // Scroll to category
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 transition"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <CategoryIcon name={cat.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{idx + 1}. {cat.name}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{cat.questions.length} questions</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Difficulty Distribution</h3>
                <div className="flex items-center gap-5">
                  {/* Donut chart */}
                  <div className="relative h-24 w-24 shrink-0">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                      {/* Easy - green */}
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none" stroke="#22c55e" strokeWidth="10"
                        strokeDasharray={`${(dist.easy / totalQuestions) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                        strokeDashoffset="0"
                      />
                      {/* Medium - yellow */}
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none" stroke="#eab308" strokeWidth="10"
                        strokeDasharray={`${(dist.medium / totalQuestions) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                        strokeDashoffset={`${-(dist.easy / totalQuestions) * 2 * Math.PI * 38}`}
                      />
                      {/* Moderate - orange */}
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none" stroke="#f97316" strokeWidth="10"
                        strokeDasharray={`${(dist.moderate / totalQuestions) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                        strokeDashoffset={`${-((dist.easy + dist.medium) / totalQuestions) * 2 * Math.PI * 38}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">{totalQuestions}</span>
                      <span className="text-[10px] text-gray-400">Total</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">Easy</span>
                      <span className="text-sm text-gray-400 ml-auto">{dist.easy} ({totalQuestions > 0 ? Math.round((dist.easy / totalQuestions) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <span className="text-sm text-gray-700">Medium</span>
                      <span className="text-sm text-gray-400 ml-auto">{dist.medium} ({totalQuestions > 0 ? Math.round((dist.medium / totalQuestions) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-700">Moderate</span>
                      <span className="text-sm text-gray-400 ml-auto">{dist.moderate} ({totalQuestions > 0 ? Math.round((dist.moderate / totalQuestions) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Context */}
              {context && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Your Context</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>
                        Role
                      </span>
                      <span className="font-medium text-gray-900">{context.role_type || "\u2014"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" /></svg>
                        Company
                      </span>
                      <span className="font-medium text-gray-900">{context.company_name || "\u2014"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                        Experience
                      </span>
                      <span className="font-medium text-gray-900">
                        {context.years_of_experience ?? 0} years ({context.level === "entry" ? "Entry Level" : "Experienced"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Employment Type
                      </span>
                      <span className="font-medium text-gray-900 capitalize">{context.employment_type?.replace("_", " ") || "\u2014"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Begin Interview Button */}
              <div className="border-t border-gray-100 pt-5">
                <button
                  onClick={() => router.push(`/interview/session/${id}`)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  Begin Interview
                </button>
                <p className="mt-2 text-xs text-center text-gray-400">
                  You can not pause or go back once started.
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
