"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { readReportEvents, reconnectDelay, type ReportStatus } from "@/lib/report-events";
import { discardFinalSubmission, readFinalSubmission, submitPendingCode, SubmissionError, type FinalSubmission } from "@/lib/pending-submission";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

interface CategoryScore {
  category: string;
  score: number;
  feedback: string;
}

interface QuestionAnswer {
  question: string;
  candidate_answer: string;
  score: number;
  feedback: string;
  ideal_answer: string;
}

interface ConfidenceAnalysis {
  overall_confidence: string;
  summary: string;
  nervous_moments: string[];
  strong_moments: string[];
  tips: string[];
}

interface SkillAssessment {
  skill: string;
  proficiency: string;
  score: number;
  evidence: string;
  gaps: string;
  recommendation: string;
}

interface CodeBug {
  location: string;
  issue: string;
  fix: string;
}

interface CodeImprovement {
  location: string;
  suggestion: string;
}

interface CodeReview {
  summary: string;
  bugs: CodeBug[];
  improvements: CodeImprovement[];
  good_practices: string[];
  complexity_analysis: {
    actual_time: string;
    actual_space: string;
    optimal_time: string;
    optimal_space: string;
    is_optimal: boolean;
    explanation: string;
  } | null;
  corrected_code: string | null;
  optimal_solution_explanation: string | null;
}

interface Report {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  detailed_feedback: string;
  recommendations: string[];
  question_answers: QuestionAnswer[];
  confidence_analysis: ConfidenceAnalysis | null;
  skill_assessment: SkillAssessment[];
  category_scores: CategoryScore[];
  code_review: CodeReview | null;
  created_at: string;
}

interface InterviewContext {
  role_type: string | null;
  level: string | null;
  years_of_experience: number | null;
  employment_type: string | null;
  company_name: string | null;
  interview_id: string;
  interview_mode: string | null;
  coding_language: string | null;
  coding_problem: Record<string, unknown> | null;
  final_code: string | null;
}

// --- SVG Donut Chart ---
function ScoreDonut({ score, size = 140, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#eab308" : "#ef4444";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={circumference - progress}
        strokeLinecap="round" className="transition-all duration-1000"
      />
    </svg>
  );
}

// --- Category Icons ---
function CategoryIcon({ category }: { category: string }) {
  const c = category.toLowerCase();
  if (c.includes("technical") || c.includes("knowledge"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;
  if (c.includes("communication"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
  if (c.includes("problem"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>;
  if (c.includes("experience") || c.includes("relevance"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
  if (c.includes("cultural") || c.includes("fit"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
  // Coding-specific categories
  if (c.includes("correctness"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (c.includes("quality"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
  if (c.includes("algorithm") || c.includes("data struct"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" /></svg>;
  if (c.includes("time") || c.includes("space") || c.includes("complexity"))
    return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  return <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function getScoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBg(score: number) {
  if (score >= 8) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 6) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function getBarColor(score: number) {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-yellow-500";
  return "bg-red-500";
}

function getBarBg(score: number) {
  if (score >= 8) return "bg-green-100";
  if (score >= 6) return "bg-yellow-100";
  return "bg-red-100";
}

function getProficiencyColor(p: string) {
  if (p === "advanced") return "bg-green-50 text-green-700 border-green-200";
  if (p === "intermediate") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-orange-50 text-orange-700 border-orange-200";
}

export default function InterviewReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [context, setContext] = useState<InterviewContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [expandedQA, setExpandedQA] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [showFinalCode, setShowFinalCode] = useState(false);
  const [showCorrectedCode, setShowCorrectedCode] = useState(false);
  const [progress, setProgress] = useState<ReportStatus | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Report unavailable");
  const [connectionVersion, setConnectionVersion] = useState(0);
  const [hasPendingCode, setHasPendingCode] = useState(false);
  const [finalizingBackup, setFinalizingBackup] = useState(false);
  const [conflictingSubmission, setConflictingSubmission] = useState<FinalSubmission | null>(null);

  const isCoding = context?.interview_mode === "coding";

  // Intercept browser back button — go to dashboard, not back to the session
  useEffect(() => {
    // Push a duplicate entry so popstate fires on back press
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      router.replace("/dashboard");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  // Section refs for scroll navigation
  const overviewRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const codeReviewRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const strengthsRef = useRef<HTMLDivElement>(null);
  const confidenceRef = useRef<HTMLDivElement>(null);
  const qaRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    const userId = authUser.uid;

    let stopped = false;
    let finished = false;
    let generation = 0;
    let retryAttempt = 0;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    function showFailure(title: string, message: string) {
      finished = true;
      setErrorTitle(title);
      setError(message);
      setLoading(false);
    }

    async function connect() {
      if (stopped || finished) return;
      const currentGeneration = ++generation;
      controller?.abort();
      clearTimeout(retryTimer);
      clearTimeout(watchdog);
      const current = new AbortController();
      controller = current;
      const active = () => !stopped && currentGeneration === generation;
      let streamStarted = 0;
      const activity = () => {
        if (!active()) return;
        if (streamStarted && Date.now() - streamStarted > 15000) retryAttempt = 0;
        clearTimeout(watchdog);
        // The backend sends heartbeats even when the job has not changed.
        watchdog = setTimeout(() => current.abort(), 60000);
      };
      if (!navigator.onLine) {
        setConnectionMessage("You are offline. We will reconnect and submit any saved code when your connection returns.");
        return;
      }

      setError("");
      setConflictingSubmission(null);
      setLoading(true);
      setConnectionMessage("Connecting to report updates...");
      activity();
      let pending: FinalSubmission | null = null;
      try {
        let storage: Storage | null = null;
        try {
          storage = window.localStorage;
          pending = readFinalSubmission(storage, userId, id);
        } catch (cause) {
          if (cause instanceof SubmissionError) throw cause;
          // Some browsers block storage. Server-side reports still work; the
          // session page keeps unsent code visible if it cannot save locally.
        }
        setHasPendingCode(!!pending);
        if (pending && storage) {
          setConnectionMessage("Submitting your saved final code...");
          await submitPendingCode(apiFetch, storage, userId, id, current.signal);
          if (active()) setHasPendingCode(false);
        }
        if (!active()) return;
        const response = await apiFetch(`/api/interview/${id}/report/events`, {
          headers: { Accept: "text/event-stream" },
          cache: "no-store",
          signal: current.signal,
        });
        if (!active()) return;
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
            showFailure("Report unavailable", typeof body.detail === "string" ? body.detail : "This report could not be accessed.");
            return;
          }
          throw new Error("Report updates are temporarily unavailable.");
        }
        streamStarted = Date.now();
        await readReportEvents(response, async (update) => {
          if (!active()) return true;
          setProgress(update);
          setConnectionMessage("");
          if (update.status === "ready") {
            // Download the report only after the server announces it is ready.
            const result = await apiFetch(`/api/interview/${id}/report`, { cache: "no-store", signal: current.signal });
            const data = await result.json();
            if (!active()) return true;
            if (!result.ok || data.status !== "ready" || !data.report || typeof data.report !== "object" || Array.isArray(data.report)) {
              throw new Error("The completed report could not be downloaded yet.");
            }
            setReport(data.report);
            setContext(data.context || null);
            setLoading(false);
            finished = true;
            return true;
          }
          if (update.status === "failed" || update.status === "incomplete") {
            showFailure(
              update.status === "failed" ? "Report generation stopped" : "Not enough interview material",
              update.message || "The interview could not be evaluated. You can review your interview history or start another interview.",
            );
            return true;
          }
          return false;
        }, activity);
      } catch (cause) {
        if (!active()) return;
        if (cause instanceof SubmissionError && !cause.retryable) {
          if (cause.status === 409) setConflictingSubmission(pending);
          showFailure("Final code needs attention", cause.message);
          return;
        }
        setConnectionMessage(navigator.onLine
          ? "Connection interrupted. Reconnecting automatically; your saved progress is safe."
          : "You are offline. We will reconnect and submit any saved code when your connection returns.");
      } finally {
        current.abort();
        if (active()) {
          clearTimeout(watchdog);
          if (!finished && navigator.onLine) {
            retryTimer = setTimeout(connect, reconnectDelay(retryAttempt++));
          }
        }
      }
    }

    function onOffline() {
      generation += 1;
      controller?.abort();
      clearTimeout(retryTimer);
      clearTimeout(watchdog);
      if (!finished) setConnectionMessage("You are offline. We will reconnect when your connection returns.");
    }
    function onOnline() {
      retryAttempt = 0;
      void connect();
    }
    void connect();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      stopped = true;
      controller?.abort();
      clearTimeout(retryTimer);
      clearTimeout(watchdog);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [id, authUser, authLoading, router, connectionVersion]);

  function useAlreadySubmittedCode() {
    if (!authUser || !conflictingSubmission) return;
    try {
      const discarded = discardFinalSubmission(window.localStorage, authUser.uid, id, conflictingSubmission);
      if (!discarded) {
        setConflictingSubmission(null);
        setError("Another tab saved different code while this message was open. Check status again to review that submission.");
        return;
      }
      setHasPendingCode(false);
      setConflictingSubmission(null);
      setConnectionVersion((value) => value + 1);
    } catch {
      setError("The pending code could not be removed from this browser. Please allow browser storage and try again.");
    }
  }

  async function submitLastSavedCode() {
    setFinalizingBackup(true);
    try {
      const res = await apiFetch(`/api/interview/${id}/code-finalize`, { method: "POST", signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "The saved code could not be submitted.");
      setConnectionVersion((value) => value + 1);
    } catch (cause) {
      setConnectionMessage(cause instanceof Error ? cause.message : "The saved code could not be submitted. Reconnect and try again.");
    } finally {
      setFinalizingBackup(false);
    }
  }

  async function requestReport() {
    try {
      const res = await apiFetch(`/api/interview/${id}/evaluate`, { method: "POST", signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "The report could not be requested.");
      setConnectionVersion((value) => value + 1);
    } catch (cause) {
      setConnectionMessage(cause instanceof Error ? cause.message : "The report could not be requested. Reconnect and try again.");
    }
  }

  async function loadTranscript() {
    if (transcript.length === 0) {
      try {
        const res = await apiFetch(`/api/interview/${id}/transcript`);
        if (res.ok) {
          const data = await res.json();
          setTranscript(data.transcript || []);
        }
      } catch {}
    }
    setShowTranscript(!showTranscript);
  }

  function scrollToSection(key: string) {
    setActiveSection(key);
    const sectionRefs = {
      overview: overviewRef, categories: categoriesRef, codeReview: codeReviewRef,
      skills: skillsRef, strengths: strengthsRef, confidence: confidenceRef,
      qa: qaRef, feedback: feedbackRef, transcript: transcriptRef,
    };
    const ref = sectionRefs[key as keyof typeof sectionRefs];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Derived data
  const strongest = report?.category_scores?.reduce((a, b) => a.score > b.score ? a : b, report.category_scores[0]);
  const weakest = report?.category_scores?.reduce((a, b) => a.score < b.score ? a : b, report.category_scores[0]);
  const avgScore = report?.category_scores?.length
    ? (report.category_scores.reduce((s, c) => s + c.score, 0) / report.category_scores.length)
    : 0;

  // Score distribution for donut
  const scoreDistribution = report?.category_scores ? (() => {
    const high = report.category_scores.filter(c => c.score >= 8).length;
    const mid = report.category_scores.filter(c => c.score >= 6 && c.score < 8).length;
    const low = report.category_scores.filter(c => c.score < 6).length;
    return { high, mid, low, total: report.category_scores.length };
  })() : null;

  // Merge transcript entries for display
  const mergedTranscript = (() => {
    const merged: { role: string; text: string }[] = [];
    for (const entry of transcript) {
      const role = entry.role || "unknown";
      const text = (entry.text || "").trim();
      if (!text) continue;
      if (merged.length > 0 && merged[merged.length - 1].role === role) {
        merged[merged.length - 1].text += " " + text;
      } else {
        merged.push({ role, text });
      }
    }
    return merged;
  })();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-[15px] sm:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">{errorTitle}</h2>
            <p className="text-[11px] sm:text-sm text-gray-500 mb-4 sm:mb-6">{error}</p>
            {conflictingSubmission && (
              <div className="mb-5 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="mb-3 text-xs text-amber-900">Different code has already been submitted for this interview. Continuing will discard this browser&apos;s pending submission and show the report for the code already saved on the server.</p>
                <button onClick={useAlreadySubmittedCode} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Use already submitted code</button>
              </div>
            )}
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => router.push("/dashboard")} className="rounded-md sm:rounded-lg border border-gray-300 px-3 py-1.5 sm:px-5 sm:py-2 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Back to Dashboard
              </button>
              <button onClick={() => setConnectionVersion((value) => value + 1)} className="rounded-md sm:rounded-lg bg-blue-600 px-3 py-1.5 sm:px-5 sm:py-2 text-[11px] sm:text-sm font-medium text-white hover:bg-blue-500 transition">
                Check status
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <div className="relative mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div className="absolute inset-0 w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
            <h2 className="text-[15px] sm:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">{progress?.status === "retrying" ? "Retrying report generation" : progress?.status === "awaiting_submission" ? "Waiting for your final code" : "Preparing your report"}</h2>
            <p aria-live="polite" className="text-[11px] sm:text-sm text-gray-500 mb-4 sm:mb-6 text-center max-w-md">{connectionMessage || progress?.message || "Your interview is being saved. Report updates will appear here automatically."}</p>
            <div className="w-48 sm:w-64 h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3">You can return to this page later to see the saved result.</p>
            {progress?.status === "awaiting_submission" && !hasPendingCode && (
              <div className="mt-5 max-w-md text-center">
                <p className="mb-3 text-xs text-gray-600">Your final submission was not received. You can use the last code backup saved on the server; it may not include your most recent edits.</p>
                <button disabled={finalizingBackup} onClick={submitLastSavedCode} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {finalizingBackup ? "Submitting..." : "Submit last saved code"}
                </button>
              </div>
            )}
            {progress?.status === "not_started" && (
              <button onClick={requestReport} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Request report</button>
            )}
            <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm text-gray-600 underline">Back to Dashboard</button>
          </div>
        ) : report ? (
          <div className="mx-auto max-w-[1536px] flex">
            {/* Main Content */}
            <div className="flex-1 min-w-0 px-5 py-4 sm:px-6 sm:py-6 lg:px-10">
              {/* Header */}
              <div className="mb-4 sm:mb-6">
                <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm text-gray-500 hover:text-gray-700 mb-3 sm:mb-4 transition">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  Back to Dashboard
                </button>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{isCoding ? "Coding Report" : "Interview Report"}</h1>
                    <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">
                      Generated on {new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    <span className="hidden sm:inline">Download PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                </div>

                {/* Context Bar */}
                {context && (
                  <div className="mt-2 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                    {context.role_type && (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-blue-700 border border-blue-200">
                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        {context.role_type}
                      </span>
                    )}
                    {context.company_name && (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-purple-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-purple-700 border border-purple-200">
                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                        {context.company_name}
                      </span>
                    )}
                    {context.years_of_experience != null && (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-green-700 border border-green-200">
                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {context.years_of_experience} {context.years_of_experience === 1 ? "year" : "years"} exp
                      </span>
                    )}
                    {context.employment_type && (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-amber-700 border border-amber-200">
                        {context.employment_type === "internship" ? "Internship" : "Full-Time"}
                      </span>
                    )}
                    {isCoding && (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-indigo-700 border border-indigo-200">
                        <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                        Coding Round
                      </span>
                    )}
                    {context.coding_language && (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-emerald-700 border border-emerald-200">
                        {context.coding_language === "cpp" ? "C++" : context.coding_language === "javascript" ? "JavaScript" : context.coding_language.charAt(0).toUpperCase() + context.coding_language.slice(1)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-gray-500 border border-gray-200">
                      ID: {id.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>

              {/* Score Overview Cards */}
              <div ref={overviewRef} className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
                {/* Overall Score */}
                <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                  <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Overall Score</p>
                  {/* Mobile donut */}
                  <div className="relative w-[80px] h-[80px] sm:hidden">
                    <ScoreDonut score={report.overall_score} size={80} strokeWidth={7} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-bold ${getScoreColor(report.overall_score)}`}>{report.overall_score}</span>
                      <span className="text-[9px] text-gray-400 ml-0.5">/10</span>
                    </div>
                  </div>
                  {/* Desktop donut */}
                  <div className="relative w-[100px] h-[100px] hidden sm:block">
                    <ScoreDonut score={report.overall_score} size={100} strokeWidth={10} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(report.overall_score)}`}>{report.overall_score}</span>
                      <span className="text-xs text-gray-400 ml-0.5">/10</span>
                    </div>
                  </div>
                </div>

                {/* Strongest Area */}
                <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-green-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase">Strongest</span>
                  </div>
                  <p className="text-[12px] sm:text-sm font-semibold text-gray-900 leading-snug">{strongest?.category}</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">{strongest?.score}<span className="text-[10px] sm:text-xs text-gray-400">/10</span></p>
                </div>

                {/* Needs Work */}
                <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-amber-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase">Needs Work</span>
                  </div>
                  <p className="text-[12px] sm:text-sm font-semibold text-gray-900 leading-snug">{weakest?.category}</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1">{weakest?.score}<span className="text-[10px] sm:text-xs text-gray-400">/10</span></p>
                </div>

                {/* Questions / Interactions */}
                <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm border border-blue-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase">{isCoding ? "Interactions" : "Questions"}</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">{report.question_answers?.length || 0}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{isCoding ? "Key interactions" : "Questions answered"}</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div ref={categoriesRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6">
                <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  Category Breakdown
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {report.category_scores.map((cat) => (
                    <div key={cat.category} className="group">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center ${cat.score >= 8 ? "bg-green-100 text-green-600" : cat.score >= 6 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                            <CategoryIcon category={cat.category} />
                          </div>
                          <span className="text-[11px] sm:text-sm font-medium text-gray-900 flex-1">{cat.category}</span>
                          <span className={`text-[11px] sm:text-sm font-bold ${getScoreColor(cat.score)}`}>{cat.score}/10</span>
                          <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform ${expandedCategory === cat.category ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </div>
                        <div className={`h-1.5 sm:h-2 w-full rounded-full ${getBarBg(cat.score)}`}>
                          <div className={`h-1.5 sm:h-2 rounded-full ${getBarColor(cat.score)} transition-all duration-500`} style={{ width: `${cat.score * 10}%` }} />
                        </div>
                      </button>
                      {expandedCategory === cat.category && (
                        <div className="mt-2 sm:mt-3 ml-8 sm:ml-11 p-2 sm:p-3 rounded-lg bg-gray-50 text-[11px] sm:text-sm text-gray-600 border border-gray-100">
                          {cat.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Review (coding mode only) */}
              {isCoding && report.code_review && (
                <div ref={codeReviewRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6">
                  <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                    Code Review
                  </h2>

                  {/* Summary */}
                  <p className="text-[11px] sm:text-sm text-gray-700 leading-relaxed mb-4">{report.code_review.summary}</p>

                  {/* Complexity Analysis */}
                  {report.code_review.complexity_analysis && (
                    <div className="rounded-md sm:rounded-lg bg-gray-50 border border-gray-100 p-3 sm:p-4 mb-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase mb-2">Complexity Analysis</p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
                        <div className="rounded-md bg-white border border-gray-200 p-2 sm:p-3">
                          <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase">Your Solution</p>
                          <p className="text-[11px] sm:text-sm font-semibold text-gray-900 mt-0.5">Time: {report.code_review.complexity_analysis.actual_time}</p>
                          <p className="text-[11px] sm:text-sm font-semibold text-gray-900">Space: {report.code_review.complexity_analysis.actual_space}</p>
                        </div>
                        <div className="rounded-md bg-white border border-gray-200 p-2 sm:p-3">
                          <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase">Optimal</p>
                          <p className="text-[11px] sm:text-sm font-semibold text-green-700 mt-0.5">Time: {report.code_review.complexity_analysis.optimal_time}</p>
                          <p className="text-[11px] sm:text-sm font-semibold text-green-700">Space: {report.code_review.complexity_analysis.optimal_space}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-medium ${report.code_review.complexity_analysis.is_optimal ? "text-green-600" : "text-amber-600"}`}>
                        {report.code_review.complexity_analysis.is_optimal ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                        )}
                        {report.code_review.complexity_analysis.is_optimal ? "Your solution is optimal!" : "Room for optimization"}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 leading-relaxed">{report.code_review.complexity_analysis.explanation}</p>
                    </div>
                  )}

                  {/* Bugs Found */}
                  {report.code_review.bugs && report.code_review.bugs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0115.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 00-.575-1.752M4.921 6a24.048 24.048 0 00-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 01-5.223 1.082" /></svg>
                        Bugs Found ({report.code_review.bugs.length})
                      </p>
                      <div className="space-y-2">
                        {report.code_review.bugs.map((bug, i) => (
                          <div key={i} className="rounded-md sm:rounded-lg bg-red-50 border border-red-100 p-2.5 sm:p-3">
                            <p className="text-[10px] sm:text-xs font-medium text-red-800 mb-1">{bug.location}</p>
                            <p className="text-[11px] sm:text-sm text-red-700 mb-1.5">{bug.issue}</p>
                            <p className="text-[10px] sm:text-xs text-red-600"><span className="font-semibold">Fix:</span> {bug.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {report.code_review.improvements && report.code_review.improvements.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                        Suggested Improvements ({report.code_review.improvements.length})
                      </p>
                      <div className="space-y-2">
                        {report.code_review.improvements.map((imp, i) => (
                          <div key={i} className="rounded-md sm:rounded-lg bg-amber-50 border border-amber-100 p-2.5 sm:p-3">
                            <p className="text-[10px] sm:text-xs font-medium text-amber-800 mb-1">{imp.location}</p>
                            <p className="text-[11px] sm:text-sm text-amber-700">{imp.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Good Practices */}
                  {report.code_review.good_practices && report.code_review.good_practices.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase mb-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.038 4.245 9.75 5.25 9.75h.904" /></svg>
                        What You Did Well
                      </p>
                      <ul className="space-y-1.5">
                        {report.code_review.good_practices.map((p, i) => (
                          <li key={i} className="flex gap-1.5 text-[11px] sm:text-sm text-green-800">
                            <span className="text-green-500 shrink-0 mt-0.5">+</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Your Submitted Code */}
                  {context?.final_code && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowFinalCode(!showFinalCode)}
                        className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase mb-2 hover:text-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                        Your Submitted Code
                        <svg className={`w-3 h-3 transition-transform ${showFinalCode ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      {showFinalCode && (
                        <pre className="rounded-lg bg-gray-900 p-3 sm:p-4 overflow-x-auto">
                          <code className="text-[11px] sm:text-xs text-green-400 font-mono whitespace-pre">{context.final_code}</code>
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Corrected Code */}
                  {report.code_review.corrected_code && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowCorrectedCode(!showCorrectedCode)}
                        className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-blue-600 uppercase mb-2 hover:text-blue-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Corrected Code
                        <svg className={`w-3 h-3 transition-transform ${showCorrectedCode ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      {showCorrectedCode && (
                        <pre className="rounded-lg bg-gray-900 p-3 sm:p-4 overflow-x-auto border-2 border-blue-500/30">
                          <code className="text-[11px] sm:text-xs text-blue-400 font-mono whitespace-pre">{report.code_review.corrected_code}</code>
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Optimal Solution Explanation */}
                  {report.code_review.optimal_solution_explanation && (
                    <div className="rounded-md sm:rounded-lg bg-blue-50 border border-blue-100 p-2.5 sm:p-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase mb-1.5">Optimal Approach</p>
                      <p className="text-[11px] sm:text-sm text-blue-900 leading-relaxed">{report.code_review.optimal_solution_explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skill Assessment */}
              {report.skill_assessment && report.skill_assessment.length > 0 && (
                <div ref={skillsRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6">
                  <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17l-5.1-3.572a1.333 1.333 0 010-2.196l5.1-3.572A1.333 1.333 0 0113.333 7v9.334a1.333 1.333 0 01-1.913 1.836zM20.087 15.17l-5.1-3.572a1.333 1.333 0 010-2.196l5.1-3.572a1.333 1.333 0 011.913 1.836v5.768" /></svg>
                    Skill Assessment
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                    {report.skill_assessment.map((skill, i) => (
                      <div key={i} className="rounded-md sm:rounded-lg border border-gray-100 p-2.5 sm:p-4">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <span className="text-[11px] sm:text-sm font-semibold text-gray-900">{skill.skill}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full ${getBarBg(skill.score)} mb-2`}>
                          <div className={`h-1.5 rounded-full ${getBarColor(skill.score)} transition-all duration-500`} style={{ width: `${skill.score * 10}%` }} />
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1"><span className="font-medium text-gray-600">Evidence:</span> {skill.evidence}</p>
                        {skill.gaps && skill.gaps !== "None identified" && (
                          <p className="text-[10px] sm:text-xs text-amber-600"><span className="font-medium">Gap:</span> {skill.gaps}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div ref={strengthsRef} className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-green-200">
                  <h2 className="text-[12px] sm:text-base font-semibold text-green-700 mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Strengths
                  </h2>
                  <ul className="space-y-2 sm:space-y-3">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 sm:gap-2.5 text-[11px] sm:text-sm text-gray-700">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-[9px] sm:text-xs font-bold mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-amber-200">
                  <h2 className="text-[12px] sm:text-base font-semibold text-amber-700 mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    Areas for Improvement
                  </h2>
                  <ul className="space-y-2 sm:space-y-3">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-2 sm:gap-2.5 text-[11px] sm:text-sm text-gray-700">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-[9px] sm:text-xs font-bold mt-0.5">{i + 1}</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confidence Analysis */}
              {report.confidence_analysis && (
                <div ref={confidenceRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-purple-200 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                    <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                      Confidence & Composure
                    </h2>
                    <span className={`rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-bold uppercase border ${
                      report.confidence_analysis.overall_confidence === "high"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : report.confidence_analysis.overall_confidence === "medium"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {report.confidence_analysis.overall_confidence} confidence
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-gray-600 mb-3 sm:mb-5 leading-relaxed">{report.confidence_analysis.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-5">
                    {report.confidence_analysis.strong_moments.length > 0 && (
                      <div className="rounded-md sm:rounded-lg bg-green-50 border border-green-100 p-2.5 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-semibold text-green-700 uppercase mb-1.5 sm:mb-2.5 flex items-center gap-1 sm:gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                          Strong Moments
                        </p>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {report.confidence_analysis.strong_moments.map((m, i) => (
                            <li key={i} className="text-[11px] sm:text-sm text-green-900 flex gap-1.5">
                              <span className="text-green-500 shrink-0 mt-0.5">+</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.confidence_analysis.nervous_moments.length > 0 && (
                      <div className="rounded-md sm:rounded-lg bg-amber-50 border border-amber-100 p-2.5 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-semibold text-amber-700 uppercase mb-1.5 sm:mb-2.5 flex items-center gap-1 sm:gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                          Nervous Moments
                        </p>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {report.confidence_analysis.nervous_moments.map((m, i) => (
                            <li key={i} className="text-[11px] sm:text-sm text-amber-900 flex gap-1.5">
                              <span className="text-amber-500 shrink-0 mt-0.5">-</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {report.confidence_analysis.tips.length > 0 && (
                    <div className="rounded-md sm:rounded-lg bg-purple-50 border border-purple-100 p-2.5 sm:p-4">
                      <p className="text-[10px] sm:text-xs font-semibold text-purple-700 uppercase mb-1.5 sm:mb-2.5">Tips to Improve</p>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {report.confidence_analysis.tips.map((tip, i) => (
                          <li key={i} className="text-[11px] sm:text-sm text-purple-900 flex gap-1.5 sm:gap-2">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center shrink-0 text-[9px] sm:text-[10px] font-bold">{i + 1}</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Q&A Review */}
              {report.question_answers && report.question_answers.length > 0 && (
                <div ref={qaRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6">
                  <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-5 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                    Question & Answer Review
                  </h2>
                  <div className="space-y-2 sm:space-y-3">
                    {report.question_answers.map((qa, i) => (
                      <div key={i} className="border border-gray-100 rounded-md sm:rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedQA(expandedQA === i ? null : i)}
                          className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 text-left hover:bg-gray-50 transition"
                        >
                          <span className="text-[10px] sm:text-xs font-bold text-gray-400 w-5 sm:w-7 shrink-0">Q{i + 1}</span>
                          <span className="text-[11px] sm:text-sm font-medium text-gray-900 flex-1 line-clamp-1">{qa.question}</span>
                          <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border shrink-0 ${getScoreBg(qa.score)}`}>
                            {qa.score}/10
                          </span>
                          <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform shrink-0 ${expandedQA === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>

                        {expandedQA === i && (
                          <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4 space-y-2 sm:space-y-3 border-t border-gray-100 pt-2 sm:pt-3">
                            <div>
                              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase mb-1 sm:mb-1.5">Your Answer</p>
                              <div className="rounded-md sm:rounded-lg bg-gray-50 p-2 sm:p-3 text-[11px] sm:text-sm text-gray-700 leading-relaxed">
                                {qa.candidate_answer}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase mb-1 sm:mb-1.5">Feedback</p>
                              <p className="text-[11px] sm:text-sm text-gray-600 leading-relaxed">{qa.feedback}</p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase mb-1 sm:mb-1.5">Ideal Answer</p>
                              <div className="rounded-md sm:rounded-lg bg-blue-50 border border-blue-100 p-2 sm:p-3 text-[11px] sm:text-sm text-blue-900 leading-relaxed">
                                {qa.ideal_answer}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Feedback */}
              <div ref={feedbackRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-200 mb-4 sm:mb-6">
                <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  Detailed Feedback
                </h2>
                <div className="text-[11px] sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {report.detailed_feedback}
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-blue-200 mb-4 sm:mb-6">
                <h2 className="text-[13px] sm:text-lg font-semibold text-blue-700 mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  Recommendations
                </h2>
                <ul className="space-y-2 sm:space-y-3">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 sm:gap-3 text-[11px] sm:text-sm text-gray-700">
                      <span className="w-4 h-4 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[9px] sm:text-xs font-bold">{i + 1}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transcript */}
              <div ref={transcriptRef} className="rounded-lg sm:rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-200 mb-6 sm:mb-8 print:hidden">
                <button onClick={loadTranscript} className="w-full flex items-center justify-between">
                  <h2 className="text-[13px] sm:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                    Full Transcript
                  </h2>
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${showTranscript ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>

                {showTranscript && (
                  <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    {mergedTranscript.length > 0 ? mergedTranscript.map((entry, i) => (
                      <div key={i} className={`flex gap-2 sm:gap-3 ${entry.role === "assistant" ? "" : "flex-row-reverse"}`}>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-bold ${
                          entry.role === "assistant" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                        }`}>
                          {entry.role === "assistant" ? "AI" : "You"}
                        </div>
                        <div className={`max-w-[80%] rounded-md sm:rounded-lg p-2 sm:p-3 text-[11px] sm:text-sm leading-relaxed ${
                          entry.role === "assistant"
                            ? "bg-blue-50 text-gray-900 border border-blue-100"
                            : "bg-gray-50 text-gray-900 border border-gray-100"
                        }`}>
                          {entry.text}
                        </div>
                      </div>
                    )) : (
                      <p className="text-[11px] sm:text-sm text-gray-500 text-center py-3 sm:py-4">No transcript available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block w-[280px] shrink-0 py-6 pr-6">
              <div className="space-y-4">
                {/* Navigation Card */}
                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Jump to</h3>
                  <nav className="space-y-0.5">
                    {[
                      { key: "overview", label: "Score Overview", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
                      { key: "categories", label: "Category Breakdown", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
                      ...(isCoding && report.code_review ? [{ key: "codeReview", label: "Code Review", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" }] : []),
                      { key: "skills", label: "Skill Assessment", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
                      { key: "strengths", label: "Strengths & Weaknesses", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                      { key: "confidence", label: "Confidence", icon: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
                      { key: "qa", label: isCoding ? "Interactions" : "Q&A Review", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
                      { key: "feedback", label: "Detailed Feedback", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
                      { key: "transcript", label: "Transcript", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => scrollToSection(item.key)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition ${
                          activeSection === item.key
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Stats Card */}
                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Quick Stats</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500">Avg Score</span>
                      <span className={`text-[13px] font-bold ${getScoreColor(avgScore)}`}>{avgScore.toFixed(1)}/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500">{isCoding ? "Interactions" : "Questions"}</span>
                      <span className="text-[13px] font-bold text-gray-900">{report.question_answers?.length || 0}</span>
                    </div>
                    {isCoding && report.code_review?.complexity_analysis && (
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">Optimal?</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          report.code_review.complexity_analysis.is_optimal
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {report.code_review.complexity_analysis.is_optimal ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500">Skills</span>
                      <span className="text-[13px] font-bold text-gray-900">{report.skill_assessment?.length || 0}</span>
                    </div>
                    {report.confidence_analysis && (
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">Confidence</span>
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          report.confidence_analysis.overall_confidence === "high"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : report.confidence_analysis.overall_confidence === "medium"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {report.confidence_analysis.overall_confidence}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Score Distribution Mini */}
                  {scoreDistribution && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden flex">
                          {scoreDistribution.high > 0 && <div className="h-full bg-green-500" style={{ width: `${(scoreDistribution.high / (scoreDistribution.total || 1)) * 100}%` }} />}
                          {scoreDistribution.mid > 0 && <div className="h-full bg-yellow-400" style={{ width: `${(scoreDistribution.mid / (scoreDistribution.total || 1)) * 100}%` }} />}
                          {scoreDistribution.low > 0 && <div className="h-full bg-red-400" style={{ width: `${(scoreDistribution.low / (scoreDistribution.total || 1)) * 100}%` }} />}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{scoreDistribution.high} high</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{scoreDistribution.mid} mid</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{scoreDistribution.low} low</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/interview/setup")}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                  >
                    Start New Interview
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
