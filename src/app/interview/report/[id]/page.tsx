"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
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
  created_at: string;
}

interface InterviewContext {
  role_type: string | null;
  level: string | null;
  years_of_experience: number | null;
  employment_type: string | null;
  company_name: string | null;
  interview_id: string;
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
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>;
  if (c.includes("communication"))
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
  if (c.includes("problem"))
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>;
  if (c.includes("experience") || c.includes("relevance"))
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
  if (c.includes("cultural") || c.includes("fit"))
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
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
  const [transcript, setTranscript] = useState<any[]>([]);
  const [expandedQA, setExpandedQA] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 60;

  // Section refs for scroll navigation
  const sectionRefs = {
    overview: useRef<HTMLDivElement>(null),
    categories: useRef<HTMLDivElement>(null),
    skills: useRef<HTMLDivElement>(null),
    strengths: useRef<HTMLDivElement>(null),
    confidence: useRef<HTMLDivElement>(null),
    qa: useRef<HTMLDivElement>(null),
    feedback: useRef<HTMLDivElement>(null),
    transcript: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }

    pollCountRef.current = 0;

    async function fetchReport() {
      try {
        pollCountRef.current += 1;
        const res = await apiFetch(`/api/interview/${id}/report`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.detail || "Failed to load report");
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }
        const data = await res.json();
        if (data.status === "ready") {
          setReport(data.report);
          setContext(data.context || null);
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (pollCountRef.current >= MAX_POLLS) {
          setError("Report generation is taking too long. Please try refreshing the page.");
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        setError("Failed to load report");
        setLoading(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }

    fetchReport();
    pollRef.current = setInterval(fetchReport, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, authUser, authLoading]);

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
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Report</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/dashboard")} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Back to Dashboard
              </button>
              <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition">
                Try Again
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Interview</h2>
            <p className="text-sm text-gray-500 mb-6">Our AI is reviewing your responses and generating detailed feedback...</p>
            <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-gray-400 mt-3">This usually takes 15-30 seconds</p>
          </div>
        ) : report ? (
          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 min-w-0 px-6 py-6 lg:px-10 lg:pr-[340px]">
              {/* Header */}
              <div className="mb-6">
                <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  Back to Dashboard
                </button>

                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Interview Report</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Generated on {new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Context Bar */}
                {context && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {context.role_type && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        {context.role_type}
                      </span>
                    )}
                    {context.company_name && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                        {context.company_name}
                      </span>
                    )}
                    {context.years_of_experience != null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {context.years_of_experience} {context.years_of_experience === 1 ? "year" : "years"} exp
                      </span>
                    )}
                    {context.employment_type && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                        {context.employment_type === "internship" ? "Internship" : "Full-Time"}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
                      ID: {id.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>

              {/* Score Overview Cards */}
              <div ref={sectionRefs.overview} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Overall Score */}
                <div className="md:col-span-1 rounded-xl bg-white p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Overall Score</p>
                  <div className="relative w-[120px] h-[120px]">
                    <ScoreDonut score={report.overall_score} size={120} strokeWidth={10} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreColor(report.overall_score)}`}>{report.overall_score}</span>
                      <span className="text-sm text-gray-400 ml-0.5">/10</span>
                    </div>
                  </div>
                </div>

                {/* Strongest Area */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Strongest</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{strongest?.category}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{strongest?.score}<span className="text-sm text-gray-400">/10</span></p>
                </div>

                {/* Needs Work */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Needs Work</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{weakest?.category}</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{weakest?.score}<span className="text-sm text-gray-400">/10</span></p>
                </div>

                {/* Questions Answered */}
                <div className="rounded-xl bg-white p-5 shadow-sm border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Questions</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{report.question_answers?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Questions answered</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div ref={sectionRefs.categories} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  Category Breakdown
                </h2>
                <div className="space-y-4">
                  {report.category_scores.map((cat) => (
                    <div key={cat.category} className="group">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.score >= 8 ? "bg-green-100 text-green-600" : cat.score >= 6 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                            <CategoryIcon category={cat.category} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 flex-1">{cat.category}</span>
                          <span className={`text-sm font-bold ${getScoreColor(cat.score)}`}>{cat.score}/10</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategory === cat.category ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </div>
                        <div className={`h-2 w-full rounded-full ${getBarBg(cat.score)}`}>
                          <div className={`h-2 rounded-full ${getBarColor(cat.score)} transition-all duration-500`} style={{ width: `${cat.score * 10}%` }} />
                        </div>
                      </button>
                      {expandedCategory === cat.category && (
                        <div className="mt-3 ml-11 p-3 rounded-lg bg-gray-50 text-sm text-gray-600 border border-gray-100">
                          {cat.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Assessment */}
              {report.skill_assessment && report.skill_assessment.length > 0 && (
                <div ref={sectionRefs.skills} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17l-5.1-3.572a1.333 1.333 0 010-2.196l5.1-3.572A1.333 1.333 0 0113.333 7v9.334a1.333 1.333 0 01-1.913 1.836zM20.087 15.17l-5.1-3.572a1.333 1.333 0 010-2.196l5.1-3.572a1.333 1.333 0 011.913 1.836v5.768" /></svg>
                    Skill Assessment
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.skill_assessment.map((skill, i) => (
                      <div key={i} className="rounded-lg border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">{skill.skill}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full ${getBarBg(skill.score)} mb-2`}>
                          <div className={`h-1.5 rounded-full ${getBarColor(skill.score)} transition-all duration-500`} style={{ width: `${skill.score * 10}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mb-1"><span className="font-medium text-gray-600">Evidence:</span> {skill.evidence}</p>
                        {skill.gaps && skill.gaps !== "None identified" && (
                          <p className="text-xs text-amber-600"><span className="font-medium">Gap:</span> {skill.gaps}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div ref={sectionRefs.strengths} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-green-200">
                  <h2 className="text-base font-semibold text-green-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Strengths
                  </h2>
                  <ul className="space-y-3">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm border border-amber-200">
                  <h2 className="text-base font-semibold text-amber-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    Areas for Improvement
                  </h2>
                  <ul className="space-y-3">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confidence Analysis */}
              {report.confidence_analysis && (
                <div ref={sectionRefs.confidence} className="rounded-xl bg-white p-6 shadow-sm border border-purple-200 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                      Confidence & Composure
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase border ${
                      report.confidence_analysis.overall_confidence === "high"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : report.confidence_analysis.overall_confidence === "medium"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {report.confidence_analysis.overall_confidence} confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">{report.confidence_analysis.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    {report.confidence_analysis.strong_moments.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                        <p className="text-xs font-semibold text-green-700 uppercase mb-2.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                          Strong Moments
                        </p>
                        <ul className="space-y-2">
                          {report.confidence_analysis.strong_moments.map((m, i) => (
                            <li key={i} className="text-sm text-green-900 flex gap-1.5">
                              <span className="text-green-500 shrink-0 mt-0.5">+</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.confidence_analysis.nervous_moments.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                        <p className="text-xs font-semibold text-amber-700 uppercase mb-2.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                          Nervous Moments
                        </p>
                        <ul className="space-y-2">
                          {report.confidence_analysis.nervous_moments.map((m, i) => (
                            <li key={i} className="text-sm text-amber-900 flex gap-1.5">
                              <span className="text-amber-500 shrink-0 mt-0.5">-</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {report.confidence_analysis.tips.length > 0 && (
                    <div className="rounded-lg bg-purple-50 border border-purple-100 p-4">
                      <p className="text-xs font-semibold text-purple-700 uppercase mb-2.5">Tips to Improve</p>
                      <ul className="space-y-2">
                        {report.confidence_analysis.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-purple-900 flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</span>
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
                <div ref={sectionRefs.qa} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                    Question & Answer Review
                  </h2>
                  <div className="space-y-3">
                    {report.question_answers.map((qa, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedQA(expandedQA === i ? null : i)}
                          className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition"
                        >
                          <span className="text-xs font-bold text-gray-400 w-7 shrink-0">Q{i + 1}</span>
                          <span className="text-sm font-medium text-gray-900 flex-1 line-clamp-1">{qa.question}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${getScoreBg(qa.score)}`}>
                            {qa.score}/10
                          </span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedQA === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>

                        {expandedQA === i && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Your Answer</p>
                              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed">
                                {qa.candidate_answer}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Feedback</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{qa.feedback}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-600 uppercase mb-1.5">Ideal Answer</p>
                              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900 leading-relaxed">
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
              <div ref={sectionRefs.feedback} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  Detailed Feedback
                </h2>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {report.detailed_feedback}
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-xl bg-white p-6 shadow-sm border border-blue-200 mb-6">
                <h2 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  Recommendations
                </h2>
                <ul className="space-y-3">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">{i + 1}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transcript */}
              <div ref={sectionRefs.transcript} className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-8 print:hidden">
                <button onClick={loadTranscript} className="w-full flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                    Full Transcript
                  </h2>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showTranscript ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>

                {showTranscript && (
                  <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
                    {mergedTranscript.length > 0 ? mergedTranscript.map((entry, i) => (
                      <div key={i} className={`flex gap-3 ${entry.role === "assistant" ? "" : "flex-row-reverse"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          entry.role === "assistant" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                        }`}>
                          {entry.role === "assistant" ? "AI" : "You"}
                        </div>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
                          entry.role === "assistant"
                            ? "bg-blue-50 text-gray-900 border border-blue-100"
                            : "bg-gray-50 text-gray-900 border border-gray-100"
                        }`}>
                          {entry.text}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center py-4">No transcript available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block fixed right-0 top-16 w-[320px] h-[calc(100vh-4rem)] border-l border-gray-200 bg-white overflow-y-auto p-5">
              {/* Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Report Overview</h3>
                <nav className="space-y-1">
                  {[
                    { key: "overview", label: "Score Overview", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
                    { key: "categories", label: "Category Breakdown", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
                    { key: "skills", label: "Skill Assessment", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
                    { key: "strengths", label: "Strengths & Weaknesses", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { key: "confidence", label: "Confidence", icon: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
                    { key: "qa", label: "Q&A Review", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
                    { key: "feedback", label: "Detailed Feedback", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
                    { key: "transcript", label: "Transcript", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => scrollToSection(item.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                        activeSection === item.key
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Score Distribution */}
              {scoreDistribution && (
                <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Score Distribution</h3>
                  <div className="flex items-center justify-center mb-3">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      {(() => {
                        const total = scoreDistribution.total || 1;
                        const r = 40;
                        const cx = 50, cy = 50;
                        const circumference = 2 * Math.PI * r;
                        const segments = [
                          { count: scoreDistribution.high, color: "#22c55e", label: "High" },
                          { count: scoreDistribution.mid, color: "#eab308", label: "Mid" },
                          { count: scoreDistribution.low, color: "#ef4444", label: "Low" },
                        ];
                        let offset = 0;
                        return segments.map((seg, i) => {
                          const pct = seg.count / total;
                          const dash = pct * circumference;
                          const el = (
                            <circle
                              key={i} cx={cx} cy={cy} r={r} fill="none"
                              stroke={seg.color} strokeWidth={16}
                              strokeDasharray={`${dash} ${circumference - dash}`}
                              strokeDashoffset={-offset}
                              transform="rotate(-90 50 50)"
                            />
                          );
                          offset += dash;
                          return el;
                        });
                      })()}
                      <text x="50" y="46" textAnchor="middle" className="text-lg font-bold" fill="#111827" fontSize="16">{report.category_scores.length}</text>
                      <text x="50" y="60" textAnchor="middle" fill="#9ca3af" fontSize="9">categories</text>
                    </svg>
                  </div>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> High ({scoreDistribution.high})</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Mid ({scoreDistribution.mid})</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Low ({scoreDistribution.low})</span>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(avgScore)}`}>{avgScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Questions</span>
                    <span className="text-sm font-bold text-gray-900">{report.question_answers?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skills Assessed</span>
                    <span className="text-sm font-bold text-gray-900">{report.skill_assessment?.length || 0}</span>
                  </div>
                  {report.confidence_analysis && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
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
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/interview/setup")}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
                >
                  Start New Interview
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
