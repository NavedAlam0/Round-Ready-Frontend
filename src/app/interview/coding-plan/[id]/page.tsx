"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface CodingProblem {
  title: string;
  difficulty: string;
  topics: string[];
  description: string;
  examples: Example[];
  constraints: string[];
  starter_code: Record<string, string>;
  hints: string[];
  expected_complexity: {
    time: string;
    space: string;
  };
  follow_up_questions: string[];
}

interface PlanContext {
  role_type: string | null;
  level: string | null;
  years_of_experience: number | null;
  employment_type: string | null;
  coding_language: string | null;
  company_name: string | null;
}

const LOADING_STEPS = [
  { label: "Analyzing your resume & skills", duration: 3000 },
  { label: "Selecting the right difficulty", duration: 3000 },
  { label: "Crafting your coding challenge", duration: 4000 },
  { label: "Preparing starter code & examples", duration: 5000 },
];

const TIPS = [
  "Read the problem statement carefully before writing any code.",
  "Start by understanding the examples and edge cases.",
  "Think about your approach before coding — plan first, code second.",
  "It's okay to start with a brute force solution and optimize later.",
  "Communicate your thought process — the interviewer wants to see how you think.",
];

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
  go: "Go",
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    hard: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${colors[difficulty] || colors.medium}`}>
      {difficulty}
    </span>
  );
}

export default function CodingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser, loading: authLoading, planInfo } = useAuth();
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [context, setContext] = useState<PlanContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("python");

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

    async function loadProblem() {
      setLoading(true);
      setError("");

      try {
        // Try GET first (already generated)
        const getRes = await apiFetch(`/api/interview/${id}/coding-plan`);
        if (!cancelled && getRes.ok) {
          const data = await getRes.json();
          setProblem(data.problem);
          if (data.context) {
            setContext(data.context);
            if (data.context.coding_language) setSelectedLang(data.context.coding_language);
          }
          setLoading(false);
          return;
        }

        // Generate via POST
        const postRes = await apiFetch(`/api/interview/${id}/coding-plan`, {
          method: "POST",
        });
        if (cancelled) return;

        if (!postRes.ok) {
          const data = await postRes.json();
          setError(data.detail || "Failed to generate coding problem");
          return;
        }

        const data = await postRes.json();
        setProblem(data.problem);
        if (data.context) {
          setContext(data.context);
          if (data.context.coding_language) setSelectedLang(data.context.coding_language);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to generate coding problem. Check your API key.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProblem();
    return () => { cancelled = true; };
  }, [id, authUser, authLoading]);

  async function regenerateProblem() {
    setRegenerating(true);
    setLoadingStep(0);
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/interview/${id}/coding-plan?regenerate=true`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to regenerate problem");
        return;
      }
      const data = await res.json();
      setProblem(data.problem);
      if (data.context) setContext(data.context);
    } catch {
      setError("Failed to regenerate coding problem.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {loading ? (
        /* ── Loading State ── */
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6">
          <div className="w-full max-w-lg text-center">
            {/* AI Agent Orb */}
            <div className="mx-auto mb-3 sm:mb-4 relative" style={{ width: 120, height: 120 }}>
              <svg className="absolute inset-0 animate-[spin_25s_linear_infinite]" width="120" height="120" viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="76" stroke="#c7d2e8" strokeWidth="0.8" strokeDasharray="5 3.5" />
                <circle cx="80" cy="4" r="3.5" fill="#6b8abf" />
                <circle cx="156" cy="80" r="4" fill="#7c9fd4" />
                <circle cx="28" cy="142" r="3" fill="#94b3de" />
              </svg>
              <div className="absolute inset-[16px] sm:inset-[22px] rounded-full border border-blue-200/50" />
              <div className="absolute inset-[26px] sm:inset-[36px] rounded-full shadow-[0_0_35px_rgba(59,130,246,0.15)] flex items-center justify-center" style={{ background: "radial-gradient(circle, #ffffff 0%, #eff6ff 50%, #dbeafe 100%)" }}>
                {/* Code icon */}
                <svg className="w-7 h-7 sm:w-9 sm:h-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
            </div>
            <div className="mx-auto mb-2.5 sm:mb-4 inline-flex items-center gap-1.5 rounded-full bg-green-50/80 border border-green-200/60 px-2.5 py-0.5 sm:px-3 sm:py-1">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] sm:text-[13px] font-medium text-green-700">AI agent working</span>
            </div>
            <h1 className="text-[15px] sm:text-xl font-bold text-gray-900">
              {regenerating ? "Generating a New Problem" : "Crafting Your Coding Challenge"}
            </h1>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[13px] text-gray-500">
              Our AI is designing a personalized problem based on your profile
            </p>
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
                  <span className={`text-[11px] sm:text-sm ${idx <= loadingStep ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Tips */}
            <div className="mt-5 sm:mt-8 mx-auto max-w-sm rounded-xl bg-white/80 border border-gray-200/60 p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Tip</p>
              <p className="text-[11px] sm:text-sm text-gray-600 transition-opacity duration-500">{TIPS[tipIndex]}</p>
            </div>
          </div>
        </main>
      ) : error ? (
        /* ── Error State ── */
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-50 border border-red-100">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-[15px] sm:text-lg font-bold text-gray-900">Something went wrong</h2>
            <p className="mt-1 text-[11px] sm:text-sm text-gray-500">{error}</p>
            <div className="mt-4 sm:mt-6 flex justify-center gap-3">
              <button
                onClick={() => router.push("/interview/setup")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Setup
              </button>
              <button
                onClick={() => { setError(""); setLoadingStep(0); setLoading(true); location.reload(); }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-[11px] sm:text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      ) : problem ? (
        /* ── Problem Display ── */
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <button
                  onClick={() => router.push("/interview/setup")}
                  className="mb-2 inline-flex items-center gap-1 text-[11px] sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back to Setup
                </button>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Your Coding Challenge</h1>
                <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">Review the problem, then start your coding session with Katie</p>
              </div>
              <div className="flex items-center gap-2">
                {planInfo && !planInfo.is_super_admin && planInfo.credits_remaining <= 0 ? (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all"
                  >
                    No Credits — Upgrade Plan
                  </button>
                ) : (
                  <>
                    <button
                      onClick={regenerateProblem}
                      disabled={regenerating}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <svg className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${regenerating ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
                      </svg>
                      New Problem
                    </button>
                    <button
                      onClick={() => router.push(`/interview/coding/${id}`)}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                    >
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                      Start Coding Session
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Context Bar */}
            {context && (
              <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
                {context.role_type && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-blue-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    {context.role_type}
                  </span>
                )}
                {context.level && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-purple-700 capitalize">
                    {context.level === "entry" ? "Entry Level" : "Experienced"}
                  </span>
                )}
                {context.coding_language && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-emerald-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                    {LANGUAGE_LABELS[context.coding_language] || context.coding_language}
                  </span>
                )}
                {context.company_name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-gray-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21" /></svg>
                    {context.company_name}
                  </span>
                )}
              </div>
            )}

            {/* Main Problem Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Problem Title & Meta */}
              <div className="border-b border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">{problem.title}</h2>
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {problem.topics.map((topic) => (
                      <span key={topic} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-gray-600">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Expected Complexity */}
                {problem.expected_complexity && (
                  <div className="mt-2 flex items-center gap-3 text-[10px] sm:text-xs text-gray-500">
                    <span>Expected: <strong className="text-gray-700">Time {problem.expected_complexity.time}</strong></span>
                    <span className="text-gray-300">|</span>
                    <span>Expected: <strong className="text-gray-700">Space {problem.expected_complexity.space}</strong></span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Problem Description</h3>
                <p className="text-[12px] sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">{problem.description}</p>
              </div>

              {/* Examples */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Examples</h3>
                <div className="space-y-3">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-3 sm:p-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1.5">Example {i + 1}</p>
                      <div className="space-y-1">
                        <p className="text-[11px] sm:text-sm text-gray-700">
                          <span className="font-medium text-gray-500">Input:</span>{" "}
                          <code className="bg-gray-200/60 rounded px-1 py-0.5 text-[11px] sm:text-xs font-mono">{ex.input}</code>
                        </p>
                        <p className="text-[11px] sm:text-sm text-gray-700">
                          <span className="font-medium text-gray-500">Output:</span>{" "}
                          <code className="bg-gray-200/60 rounded px-1 py-0.5 text-[11px] sm:text-xs font-mono">{ex.output}</code>
                        </p>
                        {ex.explanation && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                            <span className="font-medium">Explanation:</span> {ex.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Constraints</h3>
                <ul className="space-y-1">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] sm:text-sm text-gray-700">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <code className="font-mono text-[11px] sm:text-xs">{c}</code>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Starter Code Preview */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Starter Code</h3>
                  <div className="flex gap-1">
                    {Object.keys(problem.starter_code).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLang(lang)}
                        className={`rounded px-2 py-0.5 text-[10px] sm:text-xs font-medium transition-colors ${
                          selectedLang === lang
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {LANGUAGE_LABELS[lang] || lang}
                      </button>
                    ))}
                  </div>
                </div>
                <pre className="rounded-lg bg-gray-900 p-3 sm:p-4 overflow-x-auto">
                  <code className="text-[11px] sm:text-xs text-green-400 font-mono whitespace-pre">
                    {problem.starter_code[selectedLang] || problem.starter_code[Object.keys(problem.starter_code)[0]]}
                  </code>
                </pre>
              </div>

              {/* Hints (collapsible) */}
              {problem.hints && problem.hints.length > 0 && (
                <div className="p-4 sm:p-6">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-2 text-[11px] sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    {showHints ? "Hide Hints" : "Show Hints"} ({problem.hints.length})
                    <svg className={`h-3 w-3 transition-transform ${showHints ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {showHints && (
                    <div className="mt-3 space-y-2">
                      {problem.hints.map((hint, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-100 p-2.5 sm:p-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
                            {i + 1}
                          </span>
                          <p className="text-[11px] sm:text-sm text-amber-800">{hint}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Helper Text */}
            <p className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs text-gray-400">Katie will guide you through the problem via voice</p>

            {/* Bottom Spacing */}
            <div className="h-8 sm:h-12" />
          </div>
        </main>
      ) : null}
    </div>
  );
}
