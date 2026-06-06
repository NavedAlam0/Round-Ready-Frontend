"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

interface InterviewItem {
  id: string;
  status: string;
  role_type: string | null;
  level: string | null;
  employment_type: string | null;
  company_name: string | null;
  overall_score: number | null;
  created_at: string;
}

interface PracticeStreak {
  current_days: number;
  longest_days: number;
  active_weekdays: string[];
  last_practice_date: string | null;
  timezone: string;
}

interface SkillFocusItem {
  category: string;
  average_score: number;
  sample_count: number;
}

type StatusFilter = "all" | "setup" | "planned" | "in_progress" | "completed" | "evaluated";
type DateFilter = "all" | "7d" | "30d" | "90d";
type TrendRange = "all" | "30d" | "90d";

const WEEK_DAYS = [
  { label: "M", key: "mon" },
  { label: "T", key: "tue" },
  { label: "W", key: "wed" },
  { label: "T", key: "thu" },
  { label: "F", key: "fri" },
  { label: "S", key: "sat" },
  { label: "S", key: "sun" },
];

const EMPTY_STREAK: PracticeStreak = {
  current_days: 0,
  longest_days: 0,
  active_weekdays: [],
  last_practice_date: null,
  timezone: "UTC",
};

function statusLabel(status: string) {
  switch (status) {
    case "setup":
      return { text: "Setup", color: "bg-gray-100 text-gray-700" };
    case "planned":
      return { text: "Ready", color: "bg-blue-100 text-blue-700" };
    case "in_progress":
      return { text: "In Progress", color: "bg-amber-100 text-amber-700" };
    case "completed":
      return { text: "Completed", color: "bg-orange-100 text-orange-700" };
    case "evaluated":
      return { text: "Evaluated", color: "bg-green-100 text-green-700" };
    default:
      return { text: status, color: "bg-gray-100 text-gray-700" };
  }
}

function scoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-amber-600";
  return "text-rose-600";
}

function scoreTone(score: number) {
  if (score >= 8) return "Strong";
  if (score >= 6) return "On Track";
  return "Needs Improvement";
}

function interviewLink(iv: InterviewItem) {
  if (iv.status === "evaluated" || iv.status === "completed") {
    return `/interview/report/${iv.id}`;
  }
  if (iv.status === "in_progress") return `/interview/session/${iv.id}`;
  if (iv.status === "planned") return `/interview/plan/${iv.id}`;
  return "/interview/setup";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function levelLabel(level: string | null) {
  if (!level) return "Entry";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function initials(name: string | null) {
  return (name || "Practice").trim().charAt(0).toUpperCase();
}

function dateCutoff(filter: DateFilter | TrendRange) {
  if (filter === "all") return null;
  const days = filter === "7d" ? 7 : filter === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  return cutoff;
}

function matchesDateFilter(value: string, filter: DateFilter | TrendRange) {
  const cutoff = dateCutoff(filter);
  if (!cutoff) return true;
  return new Date(value) >= cutoff;
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function Icon({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "rose" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <span className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${colors[tone]}`}>
      {children}
    </span>
  );
}

function MiniSparkline() {
  return (
    <svg className="h-8 w-[82px]" viewBox="0 0 88 44" fill="none" aria-hidden="true">
      <path d="M4 34L15 27L25 30L36 21L47 27L58 16L70 20L84 6" stroke="#2563eb" strokeOpacity="0.10" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 34L15 27L25 30L36 21L47 27L58 16L70 20L84 6" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WaveOrb() {
  return (
    <div className="relative flex h-[64px] w-[92px] shrink-0 items-center justify-center sm:h-[72px] sm:w-[100px]">
      <div className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-[#c9dcff]" />
      <div className="absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2 bg-[#d8e5ff]" />
      <div className="absolute left-1/2 top-1/2 h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#c4d8ff] sm:h-[66px] sm:w-[66px]" />
      <span className="absolute left-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#b8d0ff]" />
      <span className="absolute right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#b8d0ff]" />
      <span className="absolute left-[17px] top-[22px] h-1 w-1 rounded-full bg-[#b8d0ff] sm:left-[19px] sm:top-[26px]" />
      <span className="absolute right-[17px] top-[22px] h-1 w-1 rounded-full bg-[#b8d0ff] sm:right-[19px] sm:top-[26px]" />
      <div className="absolute h-[44px] w-[44px] rounded-full bg-[#eef4ff] shadow-[0_0_28px_rgba(37,99,235,0.20)] sm:h-[50px] sm:w-[50px]" />
      <div className="absolute h-[36px] w-[36px] rounded-full border border-[#c3d7ff] bg-white/80 shadow-[0_8px_20px_rgba(37,99,235,0.16)] sm:h-[42px] sm:w-[42px]" />
      <div className="absolute h-[28px] w-[28px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.34)_0%,rgba(37,99,235,0.17)_52%,rgba(255,255,255,0.78)_76%)] blur-[1px] shadow-[0_0_16px_rgba(37,99,235,0.32)] sm:h-[32px] sm:w-[32px]" />
      <div className="relative z-10 flex h-5 items-center gap-[2px] text-[#2563eb]" aria-hidden="true">
        {[5, 8, 12, 16, 20, 16, 12, 8, 5].map((height, index) => (
          <span
            key={index}
            className="w-[2px] rounded-full bg-current shadow-[0_0_5px_rgba(37,99,235,0.42)]"
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

function skillStatus(score: number) {
  if (score >= 8) return "Strong";
  if (score >= 5) return "Fair";
  return "Needs improvement";
}

function skillTone(score: number) {
  if (score >= 8) {
    return {
      bar: "bg-green-500",
      text: "text-green-600",
      icon: "bg-blue-50 text-blue-600",
    };
  }
  if (score >= 5) {
    return {
      bar: "bg-blue-600",
      text: "text-blue-600",
      icon: "bg-blue-50 text-blue-600",
    };
  }
  return {
    bar: "bg-orange-500",
    text: "text-orange-600",
    icon: "bg-blue-50 text-blue-600",
  };
}

function coachingSuggestion(category: string, index: number) {
  const normalized = category.toLowerCase();
  if (normalized.includes("communication")) {
    return {
      title: "Answer structure",
      description: "Practice clear answers with context, action, result, and concise takeaways.",
    };
  }
  if (normalized.includes("technical") || normalized.includes("knowledge")) {
    return {
      title: "Technical explanation depth",
      description: "Explain concepts with trade-offs, implementation detail, and reasoning.",
    };
  }
  if (normalized.includes("problem") || normalized.includes("solving")) {
    return {
      title: "Problem-solving approach",
      description: "Clarify assumptions, break problems down, and compare practical options.",
    };
  }
  if (normalized.includes("experience") || normalized.includes("relevance")) {
    return {
      title: "Experience relevance",
      description: "Connect your past work directly to the role, company, and expected impact.",
    };
  }
  if (normalized.includes("culture") || normalized.includes("fit")) {
    return {
      title: "Collaboration signals",
      description: "Show ownership, teamwork, decision-making, and learning from feedback.",
    };
  }
  return {
    title: index === 0 ? "Focused improvement" : `${category} practice`,
    description: `Use your next practice round to raise your ${category.toLowerCase()} score.`,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [practiceStreak, setPracticeStreak] = useState<PracticeStreak>(EMPTY_STREAK);
  const [skillFocus, setSkillFocus] = useState<SkillFocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [trendRange, setTrendRange] = useState<TrendRange>("all");
  const [skillFocusExpanded, setSkillFocusExpanded] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const [interviewsRes, streakRes, skillFocusRes] = await Promise.all([
        apiFetch("/api/interviews"),
        apiFetch(`/api/dashboard/streak?timezone=${encodeURIComponent(timezone)}`),
        apiFetch("/api/dashboard/skill-focus?limit=20"),
      ]);

      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        setInterviews(data.interviews || []);
      }

      if (streakRes.ok) {
        const data = await streakRes.json();
        setPracticeStreak({
          current_days: data.current_days ?? 0,
          longest_days: data.longest_days ?? 0,
          active_weekdays: data.active_weekdays ?? [],
          last_practice_date: data.last_practice_date ?? null,
          timezone: data.timezone ?? timezone,
        });
      }

      if (skillFocusRes.ok) {
        const data = await skillFocusRes.json();
        setSkillFocus(data.skills || []);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    void Promise.resolve().then(fetchDashboardData);
  }, [authUser, authLoading, fetchDashboardData, router]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this interview?")) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/interview/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInterviews((prev) => prev.filter((iv) => iv.id !== id));
        void fetchDashboardData();
      }
    } catch (e) {
      console.error("Failed to delete interview:", e);
    } finally {
      setDeleting(null);
    }
  }

  const user = {
    full_name: authUser?.displayName || authUser?.email?.split("@")[0] || "User",
  };

  const stats = useMemo(() => {
    const scored = interviews.filter((iv) => iv.overall_score !== null);
    const evaluated = interviews.filter((iv) => iv.status === "completed" || iv.status === "evaluated");
    const avg =
      scored.length > 0
        ? scored.reduce((sum, iv) => sum + (iv.overall_score || 0), 0) / scored.length
        : null;
    const best = scored.length > 0 ? Math.max(...scored.map((iv) => iv.overall_score || 0)) : null;
    const completionRate = interviews.length > 0 ? Math.round((evaluated.length / interviews.length) * 100) : 0;
    const latest = [...scored].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0] || null;

    return {
      scored,
      evaluated,
      avg,
      best,
      completionRate,
      latest,
    };
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return interviews.filter((iv) => {
      const searchableText = [
        iv.company_name,
        iv.role_type,
        iv.level,
        iv.employment_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesStatus = statusFilter === "all" || iv.status === statusFilter;
      const matchesDate = matchesDateFilter(iv.created_at, dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, interviews, searchQuery, statusFilter]);

  const trendInterviews = useMemo(() => {
    return stats.scored
      .filter((iv) => matchesDateFilter(iv.created_at, trendRange))
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  }, [stats.scored, trendRange]);

  const trendPoints = useMemo(() => {
    const count = trendInterviews.length;
    return trendInterviews.map((iv, index) => {
      const score = iv.overall_score || 0;
      return {
        id: iv.id,
        x: count === 1 ? 50 : (index / (count - 1)) * 100,
        y: 100 - score * 10,
        score,
        date: formatDate(iv.created_at),
        label: formatShortDate(iv.created_at),
      };
    });
  }, [trendInterviews]);

  const trendLatest = trendInterviews[trendInterviews.length - 1] || null;

  const trendDateLabels = useMemo(() => {
    if (trendPoints.length <= 5) return trendPoints;

    const indexes = new Set<number>();
    const lastIndex = trendPoints.length - 1;
    for (let i = 0; i < 5; i += 1) {
      indexes.add(Math.round((i / 4) * lastIndex));
    }

    return trendPoints.filter((_, index) => indexes.has(index));
  }, [trendPoints]);

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
  }

  function handleExport() {
    if (filteredInterviews.length === 0) return;

    const headers = ["Company", "Role", "Level", "Employment Type", "Date", "Status", "Score"];
    const rows = filteredInterviews.map((iv) => [
      iv.company_name || "Practice Interview",
      iv.role_type || "",
      levelLabel(iv.level),
      iv.employment_type || "",
      formatDate(iv.created_at),
      statusLabel(iv.status).text,
      iv.overall_score !== null ? `${iv.overall_score}/10` : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "roundready-interviews.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading || !authUser)
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-[1560px] px-6 py-8 sm:px-8 lg:px-10 animate-pulse">
          {/* Header skeleton */}
          <div className="h-7 w-40 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 rounded bg-gray-100" />

          {/* Welcome banner skeleton */}
          <div className="mt-6 h-[120px] rounded-2xl bg-gray-100" />

          {/* Stat cards skeleton */}
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[120px] rounded-2xl bg-gray-100" />
            ))}
          </div>

          {/* Chart + sidebar skeleton */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
            <div className="h-[300px] rounded-2xl bg-gray-100" />
            <div className="space-y-4">
              <div className="h-[160px] rounded-2xl bg-gray-100" />
              <div className="h-[120px] rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      </>
    );

  const latestScore = trendLatest?.overall_score ?? null;
  const trendLine = trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const trendDirection =
    trendInterviews.length > 1
      ? (trendInterviews[trendInterviews.length - 1].overall_score || 0) -
        (trendInterviews[trendInterviews.length - 2].overall_score || 0)
      : 0;
  const latestReportHref = stats.latest ? `/interview/report/${stats.latest.id}` : "/interview/setup";
  const topSkillFocus = skillFocus[0] || null;
  const visibleSkillFocus = skillFocusExpanded ? skillFocus : skillFocus.slice(0, 3);
  const coachingPlan = skillFocus.slice(0, 3).map((skill, index) => ({
    ...skill,
    ...coachingSuggestion(skill.category, index),
  }));

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-[1536px] px-5 py-4 sm:px-6 lg:px-8">
        <div className="mb-3">
          <h1 className="text-lg sm:text-[22px] font-bold leading-tight tracking-normal text-[#0f172a]">Dashboard</h1>
          <p className="mt-0.5 text-[12px] sm:text-[13px] leading-5 text-[#64748b]">
            Track your interview practice and improve with every session.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.05fr)_minmax(380px,0.95fr)]">
          <section className="min-w-0 space-y-3">
            <div className="overflow-hidden rounded-lg border border-[#c9daf8] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="relative flex flex-col gap-2 sm:gap-3 px-3 py-2.5 sm:px-6 sm:py-5 lg:min-h-[96px] lg:flex-row lg:items-center lg:justify-between">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_42%,rgba(37,99,235,0.13),transparent_30%),linear-gradient(90deg,rgba(239,246,255,0.95),rgba(255,255,255,0.98))]" />
                <div className="relative flex min-w-0 items-center gap-2.5 sm:gap-4">
                  <div className="shrink-0 scale-[0.55] sm:scale-100 origin-left -mr-5 sm:mr-0">
                    <WaveOrb />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[13px] sm:text-[17px] font-bold leading-tight text-[#0f172a]">
                      Welcome back, {user.full_name}
                    </h2>
                    <p className="mt-0.5 sm:mt-1 max-w-md text-[10px] sm:text-[13px] leading-[1.4] sm:leading-5 text-[#64748b]">
                      Keep practicing to build confidence and ace your next interview.
                    </p>
                  </div>
                </div>
                <div className="relative grid w-full grid-cols-2 gap-1.5 sm:gap-2.5 lg:w-[220px] lg:grid-cols-1">
                  <Link
                    href="/interview/setup"
                    className="inline-flex h-7 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-md bg-[#2563eb] px-2.5 sm:px-5 text-[11px] sm:text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)] transition hover:bg-[#1d4ed8]"
                  >
                    <svg className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New Interview
                  </Link>
                  <Link
                    href={latestReportHref}
                    className="inline-flex h-7 sm:h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-md border border-[#dbe6f5] bg-white px-2.5 sm:px-5 text-[11px] sm:text-[13px] font-semibold text-[#334155] transition hover:bg-[#f8fbff]"
                  >
                    <svg className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h6l4 4v12H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4v5h5M9 14h6M9 17h4" />
                    </svg>
                    Review Report
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
              <StatCard
                title="Total Interviews"
                value={interviews.length.toString()}
                subtitle="All time"
                icon="briefcase"
                sparkline
              />
              <StatCard
                title="Average Score"
                value={stats.avg !== null ? `${stats.avg.toFixed(1)}/10` : "--"}
                subtitle={stats.avg !== null ? `Based on ${stats.evaluated.length} interviews` : "No scores yet"}
                icon="trend"
                sparkline
              />
              <StatCard
                title="Best Score"
                value={stats.best !== null ? `${stats.best}/10` : "--"}
                subtitle={stats.latest ? `Achieved on ${formatDate(stats.latest.created_at)}` : "No score recorded"}
                icon="star"
                sparkline
              />
              <StatCard
                title="Completion Rate"
                value={`${stats.completionRate}%`}
                subtitle={`${stats.evaluated.length} / ${interviews.length || 0} completed`}
                icon="target"
                progress={stats.completionRate}
              />
            </div>

            <div className="overflow-hidden rounded-[10px] border border-[#dbe6f5] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-4 sm:h-[56px]">
                <h2 className="text-[13px] sm:text-[15px] font-bold leading-5 text-[#0f172a]">Score Trend</h2>
                <div className="w-[120px] sm:w-[160px]">
                  <FilterSelect
                    value={trendRange}
                    onChange={(value) => setTrendRange(value as TrendRange)}
                    options={[
                      { value: "all", label: "All Time" },
                      { value: "30d", label: "Last 30 Days" },
                      { value: "90d", label: "Last 90 Days" },
                    ]}
                  />
                </div>
              </div>
              <div className="grid min-h-0 sm:min-h-[280px] gap-0 border-t border-[#edf2f8] px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative h-[150px] sm:h-[230px] bg-white pr-3 sm:pr-5">
                  {[10, 5, 0].map((tick) => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 border-t border-dashed border-[#dbe6f5] sm:hidden"
                      style={{ top: `${((10 - tick) / 10) * 78 + 5}%` }}
                    >
                      <span className="absolute -top-2.5 left-0 bg-white pr-2 text-[10px] leading-3 text-[#64748b]">
                        {tick}
                      </span>
                    </div>
                  ))}
                  {[10, 7.5, 5, 2.5, 0].map((tick) => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 border-t border-dashed border-[#dbe6f5] hidden sm:block"
                      style={{ top: `${((10 - tick) / 10) * 78 + 5}%` }}
                    >
                      <span className="absolute -top-3 left-0 bg-white pr-3 text-xs leading-4 text-[#64748b]">
                        {tick}
                      </span>
                    </div>
                  ))}
                  <div className="absolute bottom-0 left-8 sm:left-14 right-2 sm:right-4 h-5 sm:h-7 text-[9px] sm:text-xs leading-3 sm:leading-4 text-[#64748b]">
                    {trendDateLabels.length > 0 ? (
                      trendDateLabels.map((point) => (
                        <span
                          key={`${point.id}-label`}
                          className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
                          style={{ left: `${point.x}%` }}
                        >
                          {point.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Interview dates</span>
                    )}
                  </div>
                  {trendPoints.length > 0 ? (
                    <>
                      {trendPoints.length > 1 && (
                        <div className="absolute bottom-8 sm:bottom-12 left-8 sm:left-14 right-2 sm:right-4 top-3 sm:top-5">
                          <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            <polyline points={trendLine} fill="none" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute bottom-8 sm:bottom-12 left-8 sm:left-14 right-2 sm:right-4 top-3 sm:top-5">
                        {trendPoints.map((point) => (
                          <span
                            key={point.id}
                            className="absolute block h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2563eb] shadow-[0_4px_10px_rgba(37,99,235,0.25)]"
                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                            title={`${point.score}/10 on ${point.date}`}
                          >
                            {trendPoints.length <= 6 && (
                              <span className="absolute -top-5 sm:-top-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-semibold leading-3 sm:leading-4 text-[#334155]">
                                {point.score}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-sm font-medium text-slate-400">
                      Scores will appear after your first evaluated interview.
                    </div>
                  )}
                </div>
                <div className="mt-3 border-t border-[#edf2f8] pt-3 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div className="flex items-center gap-3 sm:block">
                    <div>
                      <p className="text-[11px] sm:text-[13px] font-medium leading-4 text-[#64748b]">Latest Score</p>
                      <p className="mt-0.5 sm:mt-2 text-[22px] sm:text-[36px] font-bold leading-none tracking-normal text-[#2563eb]">
                        {latestScore !== null ? latestScore : "--"}<span className="text-[11px] sm:text-lg font-semibold text-[#64748b]">/10</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:block">
                      {latestScore !== null && (
                        <span className="sm:mt-3 inline-flex items-center gap-1 rounded-md bg-[#dcfce7] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[13px] font-semibold text-[#16a34a]">
                          <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                          </svg>
                          {scoreTone(latestScore)}
                        </span>
                      )}
                      {trendInterviews.length > 1 && (
                        <div className="sm:mt-3">
                          <p className={`text-[11px] sm:text-[15px] font-bold leading-4 sm:leading-5 ${trendDirection >= 0 ? "text-[#16a34a]" : "text-rose-600"}`}>
                            {trendDirection >= 0 ? "Up" : "Down"} {Math.abs(trendDirection).toFixed(1)}
                            <span className="font-normal text-[#64748b] sm:hidden"> from prev</span>
                          </p>
                          <p className="hidden sm:block mt-0.5 text-[13px] leading-4 text-[#64748b]">from previous interview</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 break-words text-[10px] sm:text-[11px] leading-3 sm:leading-4 text-[#64748b]">
                    {trendLatest
                      ? `${formatDate(trendLatest.created_at)}${trendLatest.company_name ? ` · ${trendLatest.company_name}` : ""}`
                      : "No interviews yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#dde7f5] bg-white p-3 sm:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[15px] font-bold text-[#0f172a]">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
                  </svg>
                  AI Agent Coaching Plan
                </h2>
                <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-blue-600">
                  Personalized for you
                </span>
              </div>
              <div className="mt-2 sm:mt-3 grid gap-0 md:grid-cols-3">
                {(coachingPlan.length > 0 ? coachingPlan : [
                  {
                    category: "First interview",
                    average_score: 0,
                    sample_count: 0,
                    title: "Start with one round",
                    description: "Complete an interview to unlock your personalized coaching plan.",
                  },
                ]).map((item, index) => (
                  <div
                    key={`${item.category}-${index}`}
                    className="min-w-0 border-t border-[#edf2f8] py-2.5 sm:py-5 md:border-l md:border-t-0 md:px-8 md:py-0 first:md:border-l-0 first:md:pl-0 last:md:pr-0"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="flex h-5 w-5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#1557ff] text-[10px] sm:text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-[12px] sm:text-sm font-bold leading-4 sm:leading-5 text-slate-950">{item.title}</h3>
                        <p className="mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs leading-4 sm:leading-5 text-slate-600">{item.description}</p>
                        <div className="mt-1.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                          <span className={`rounded-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold ${index === 0 ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                            {index === 0 ? "Next" : "Suggested"}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-600">
                            5 min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#dde7f5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-2 sm:gap-3 border-b border-[#edf2f8] px-3 py-2.5 sm:px-4 sm:py-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-[14px] sm:text-[18px] font-bold text-[#0f172a]">Interview History</h2>
                <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:max-w-[660px] lg:grid-cols-[minmax(180px,1fr)_118px_118px_88px]">
                  <div className="relative col-span-2 sm:col-span-1">
                    <svg className="absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                    </svg>
                    <input
                      className="h-7 sm:h-8 w-full rounded-md border border-[#d7e0ee] pl-8 sm:pl-9 pr-2 sm:pr-3 text-[11px] sm:text-xs outline-none focus:border-blue-400"
                      placeholder="Search by company or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <FilterSelect
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "evaluated", label: "Evaluated" },
                      { value: "completed", label: "Completed" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "planned", label: "Ready" },
                      { value: "setup", label: "Setup" },
                    ]}
                  />
                  <FilterSelect
                    value={dateFilter}
                    onChange={(value) => setDateFilter(value as DateFilter)}
                    options={[
                      { value: "all", label: "All Time" },
                      { value: "7d", label: "Last 7 Days" },
                      { value: "30d", label: "Last 30 Days" },
                      { value: "90d", label: "Last 90 Days" },
                    ]}
                    icon="calendar"
                  />
                  <button
                    onClick={handleExport}
                    disabled={filteredInterviews.length === 0}
                    className="col-span-2 sm:col-span-1 inline-flex h-7 sm:h-8 items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-md border border-[#d7e0ee] px-2 text-[11px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2 p-3 sm:space-y-3 sm:p-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 sm:h-16 animate-pulse rounded-md bg-slate-100" />
                  ))}
                </div>
              ) : interviews.length === 0 ? (
                <div className="px-4 py-8 sm:px-5 sm:py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg className="h-5 w-5 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-[13px] sm:text-base font-bold text-slate-950">No interviews yet</h3>
                  <p className="mt-1 text-[11px] sm:text-sm text-slate-500">Start your first practice interview and your history will show here.</p>
                  <Link href="/interview/setup" className="mt-4 inline-flex h-8 sm:h-10 items-center rounded-md bg-blue-600 px-4 sm:px-5 text-[12px] sm:text-sm font-semibold text-white hover:bg-blue-700">
                    Start First Interview
                  </Link>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="px-4 py-8 sm:px-5 sm:py-12 text-center">
                  <h3 className="text-[13px] sm:text-base font-bold text-slate-950">No matching interviews</h3>
                  <p className="mt-1 text-[11px] sm:text-sm text-slate-500">Try a different search, status, or date range.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 inline-flex h-8 sm:h-10 items-center rounded-md border border-slate-200 px-4 sm:px-5 text-[12px] sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-[#edf2f8] bg-[#fbfdff] text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                        <tr>
                          <th className="px-4 py-2.5">Company</th>
                          <th className="px-4 py-2.5">Role</th>
                          <th className="px-4 py-2.5">Level</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Score</th>
                          <th className="px-4 py-2.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2f8]">
                        {filteredInterviews.map((iv) => {
                          const status = statusLabel(iv.status);
                          return (
                            <tr key={iv.id} className="hover:bg-[#fbfdff]">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06112f] text-xs font-bold text-white">
                                    {initials(iv.company_name)}
                                  </span>
                                  <span className="font-semibold text-slate-900">{iv.company_name || "Practice Interview"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{iv.role_type || "Interview Practice"}</td>
                              <td className="px-4 py-3 text-slate-700">{levelLabel(iv.level)}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(iv.created_at)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${status.color}`}>{status.text}</span>
                              </td>
                              <td className="px-4 py-3">
                                {iv.overall_score !== null ? (
                                  <div>
                                    <span className={`text-base font-bold ${scoreColor(iv.overall_score)}`}>{iv.overall_score}</span>
                                    <span className="text-xs text-slate-500">/10</span>
                                    <span className={`ml-2 inline-block h-2 w-2 rounded-full ${iv.overall_score >= 6 ? "bg-green-500" : "bg-rose-600"}`} />
                                  </div>
                                ) : (
                                  <span className="text-slate-300">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={interviewLink(iv)}
                                    className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-100 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16l4-4 3 3 5-7M7 16V9M14 15V9M19 8v8" />
                                    </svg>
                                    {iv.overall_score !== null ? "View Report" : "Continue"}
                                  </Link>
                                  <button
                                    onClick={() => handleDelete(iv.id)}
                                    disabled={deleting === iv.id}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                                    title="Delete interview"
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M8 7l1 12h6l1-12" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-[#edf2f8]">
                    {filteredInterviews.map((iv) => {
                      const status = statusLabel(iv.status);
                      return (
                        <div key={iv.id} className="px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#06112f] text-[10px] font-bold text-white">
                                {initials(iv.company_name)}
                              </span>
                              <span className="truncate text-[12px] font-semibold text-slate-900">{iv.company_name || "Practice Interview"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {iv.overall_score !== null ? (
                                <span className={`text-[13px] font-bold ${scoreColor(iv.overall_score)}`}>
                                  {iv.overall_score}<span className="text-[10px] font-normal text-slate-400">/10</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-300">--</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                            <span>{iv.role_type || "Practice"}</span>
                            <span>{levelLabel(iv.level)}</span>
                            <span>{formatDate(iv.created_at)}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${status.color}`}>{status.text}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Link
                              href={interviewLink(iv)}
                              className="inline-flex h-6 items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              {iv.overall_score !== null ? "View Report" : "Continue"}
                            </Link>
                            <button
                              onClick={() => handleDelete(iv.id)}
                              disabled={deleting === iv.id}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              title="Delete"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M8 7l1 12h6l1-12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs text-slate-500">
                    <span>{filteredInterviews.length} of {interviews.length}</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button className="inline-flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-slate-200 text-slate-400" aria-label="Previous page">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.17 10l3.6 3.71a.75.75 0 11-1.08 1.04l-4.1-4.25a.75.75 0 010-1.04l4.1-4.25a.75.75 0 011.1.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="h-6 w-6 sm:h-9 sm:w-9 rounded-md bg-blue-600 text-[10px] sm:text-xs font-semibold text-white">1</button>
                      <button className="inline-flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-slate-200 text-slate-400" aria-label="Next page">
                        <svg className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06l3.6-3.71-3.6-3.71a.75.75 0 111.08-1.04l4.1 4.25a.75.75 0 010 1.04l-4.1 4.25a.75.75 0 01-1.1-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <aside className="space-y-2.5">
            <Panel>
              <div className="flex items-start gap-2 sm:gap-3">
                <Icon tone="blue">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 22h4M8.5 14.5a6 6 0 117 0c-.8.6-1.5 1.4-1.8 2.5h-3.4c-.3-1.1-1-1.9-1.8-2.5z" />
                  </svg>
                </Icon>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-[12px] sm:text-sm font-bold text-slate-950">Next Best Step</h3>
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide text-blue-600">
                      AI Recommended
                    </span>
                  </div>
                  {topSkillFocus ? (
                    <>
                      <p className="mt-1 sm:mt-1.5 break-words text-[12px] sm:text-sm font-bold text-slate-950">
                        Focus on {topSkillFocus.category}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-slate-600">
                        Your {topSkillFocus.category.toLowerCase()} score is the lowest. Improving this area will have the biggest impact.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1.5 text-[12px] sm:text-sm font-bold text-slate-950">
                        Start your first interview
                      </p>
                      <p className="mt-1 text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-slate-600">
                        Your weakest skills will appear here after evaluation.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Link href="/interview/setup" className="mt-2 sm:mt-3 inline-flex min-h-7 sm:min-h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#1557ff] px-3 sm:px-4 text-center text-[11px] sm:text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(21,87,255,0.22)] hover:bg-[#0f49df]">
                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 4.75v10.5L15 10 6 4.75z" />
                </svg>
                Start focused practice
              </Link>
              <p className="mt-1.5 sm:mt-2 text-center text-[9px] sm:text-[10px] text-slate-500">Recommended by AI Agent</p>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] sm:text-sm font-bold text-slate-950">Skill Focus</h3>
                {skillFocus.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setSkillFocusExpanded((expanded) => !expanded)}
                    className="text-[10px] sm:text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {skillFocusExpanded ? "View less" : "View full report"}
                  </button>
                )}
              </div>
              {skillFocus.length > 0 ? (
                visibleSkillFocus.map((skill) => (
                  <SkillRow
                    key={skill.category}
                    label={skill.category}
                    score={skill.average_score}
                    sampleCount={skill.sample_count}
                  />
                ))
              ) : (
                <p className="mt-3 text-[13px] text-slate-500">
                  Complete an evaluated interview to see the skills that need the most attention.
                </p>
              )}
            </Panel>

            <Panel>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Icon tone="blue">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 007-7c0-4-3-7-3-11-2.5 1.5-4 4-4 6-1.5-.8-2-2-2-3-2 1.6-4 4.2-4 8a7 7 0 007 7z" />
                    </svg>
                  </Icon>
                  <div>
                    <h3 className="text-[12px] sm:text-sm font-bold text-slate-950">Practice Streak</h3>
                    <p className="mt-0.5 text-[15px] sm:text-lg font-bold text-slate-950 leading-tight">{practiceStreak.current_days}</p>
                    <p className="text-[10px] sm:text-xs text-slate-600">
                      {practiceStreak.current_days === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[9px] sm:text-[11px] text-slate-500">
                  {WEEK_DAYS.map((day) => {
                    const active = practiceStreak.active_weekdays.includes(day.key);
                    return (
                      <div key={day.key}>
                        <div>{day.label}</div>
                        <div
                          className={`mx-auto mt-1 sm:mt-1.5 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 rounded-full border ${
                            active
                              ? "border-green-500 bg-green-500"
                              : "border-slate-300"
                          }`}
                          title={active ? "Practiced" : "No practice"}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500">
                {practiceStreak.current_days > 0
                  ? "Keep it going! Consistency builds confidence."
                  : stats.evaluated.length > 0
                    ? "Practice today to restart your streak."
                    : "Complete your first interview to start."}
              </p>
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500">
                Longest streak:{" "}
                <span className="font-semibold text-slate-700">
                  {practiceStreak.longest_days} {practiceStreak.longest_days === 1 ? "day" : "days"}
                </span>
              </p>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] sm:text-sm font-bold text-slate-950">Getting Started Checklist</h3>
                <span className="text-[10px] sm:text-xs font-semibold text-green-600">
                  {interviews.length > 0 ? "4 of 4" : "0 of 4"}
                </span>
              </div>
              <ChecklistItem done={interviews.length > 0} label="Upload your resume" />
              <ChecklistItem done={interviews.length > 0} label="Choose target company" />
              <ChecklistItem done={interviews.length > 0} label="Complete your first interview" />
              <ChecklistItem done={stats.latest !== null} label="Review your feedback" />
            </Panel>

            <Panel>
              <div className="flex items-center gap-2 sm:gap-3">
                <Icon tone="blue">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-5" />
                  </svg>
                </Icon>
                <div className="min-w-0">
                  <h3 className="text-[12px] sm:text-sm font-bold text-slate-950">Private & Secure</h3>
                  <p className="mt-0.5 text-[10px] sm:text-[12px] leading-3 sm:leading-4 text-slate-600">
                    Your interview data is protected and only used for your reports.
                  </p>
                </div>
              </div>
            </Panel>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  sparkline,
  progress,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: "briefcase" | "trend" | "star" | "target";
  sparkline?: boolean;
  progress?: number;
}) {
  return (
    <div className="relative h-[80px] sm:h-[120px] min-w-0 overflow-hidden rounded-[10px] border border-[#dbe6f5] bg-white px-2.5 py-2 sm:px-4 sm:py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex min-w-0 items-start gap-1.5 sm:gap-2.5">
        <span className="flex h-7 w-7 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#eff6ff] text-[#2563eb]">
          {icon === "briefcase" && (
            <svg className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V6a2 2 0 012-2h2a2 2 0 012 2v1M5 7h14v12H5V7zM5 12h14" />
            </svg>
          )}
          {icon === "trend" && (
            <svg className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 18l5-5 4 4 7-9M16 8h4v4" />
            </svg>
          )}
          {icon === "star" && (
            <svg className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.85 6.75 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z" />
            </svg>
          )}
          {icon === "target" && (
            <svg className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16zM12 16a4 4 0 100-8 4 4 0 000 8zM12 13a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] sm:text-[12px] font-semibold leading-3 sm:leading-4 text-[#42526e]">{title}</p>
          <p className="mt-0.5 sm:mt-1 truncate text-[15px] sm:text-[22px] font-bold leading-none tracking-normal text-[#0f172a]">{value}</p>
        </div>
      </div>
      {sparkline && (
        <div className="absolute right-2 sm:right-4 top-[34px] sm:top-[54px] scale-[0.55] sm:scale-100 origin-top-right">
          <MiniSparkline />
        </div>
      )}
      {typeof progress === "number" && (
        <div className="absolute bottom-[22px] sm:bottom-[38px] left-2.5 sm:left-4 right-2.5 sm:right-4 h-1 sm:h-1.5 overflow-hidden rounded-full bg-[#e8eef7]">
          <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="absolute bottom-1.5 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 truncate text-[9px] sm:text-[12px] leading-3 sm:leading-4 text-[#64748b]">{subtitle}</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  icon?: "calendar";
}) {
  return (
    <label className="relative block">
      {icon === "calendar" && (
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 012 2v12H4V7a2 2 0 012-2z" />
        </svg>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 w-full appearance-none rounded-md border border-[#d7e0ee] bg-white px-3 pr-8 text-[12px] font-medium text-slate-700 outline-none hover:bg-slate-50 focus:border-blue-400 ${icon === "calendar" ? "pl-9" : ""}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </label>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#dde7f5] bg-white p-3 sm:p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      {children}
    </div>
  );
}

function skillIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes("communication")) {
    // Chat bubble
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
      </svg>
    );
  }
  if (lower.includes("problem")) {
    // Puzzle piece
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 3.2 3.5.5-2.5 2.5.6 3.5L12 11l-3.1 1.7.6-3.5L7 6.7l3.5-.5L12 3zM5 19h14" />
      </svg>
    );
  }
  if (lower.includes("technical") || lower.includes("coding")) {
    // Code brackets </>
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    );
  }
  if (lower.includes("experience") || lower.includes("relevance")) {
    // Briefcase
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    );
  }
  if (lower.includes("cultur")) {
    // People/group
    return (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    );
  }
  // Default: document icon
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h7M7 16h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  );
}

function SkillRow({
  label,
  score,
  sampleCount,
}: {
  label: string;
  score: number;
  sampleCount: number;
}) {
  const tone = skillTone(score);
  const status = skillStatus(score);

  return (
    <div className="mt-2 sm:mt-3">
      <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
        <span className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg ${tone.icon}`}>
          {skillIcon(label)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2 text-[11px] sm:text-[13px]">
            <span className="min-w-0 break-words font-semibold leading-4 sm:leading-5 text-[#334155]">{label}</span>
            <span className={`shrink-0 whitespace-nowrap text-[11px] sm:text-[13px] font-bold ${tone.text}`}>{score.toFixed(1)}<span className="text-[10px] sm:text-[11px] text-slate-500">/10</span></span>
          </div>
          <div className="mt-1 sm:mt-1.5 flex flex-col gap-1 sm:gap-1.5 sm:flex-row sm:items-center">
            <div className="h-1 sm:h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e8eef7]">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(8, score * 10)}%` }} />
            </div>
            <span className="text-left text-[9px] sm:text-[10px] leading-3 text-slate-500 sm:w-24 sm:text-right">
              {status}
            </span>
          </div>
          <p className="mt-0.5 text-[9px] sm:text-[10px] leading-3 text-slate-400">
            Based on {sampleCount} {sampleCount === 1 ? "interview" : "interviews"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="mt-2 sm:mt-2.5 flex min-w-0 items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] text-slate-700">
      <span className={`flex h-4 w-4 sm:h-[18px] sm:w-[18px] items-center justify-center rounded-full border ${done ? "border-green-500 bg-green-500 text-white" : "border-slate-300 text-transparent"}`}>
        <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0L3.296 9.22a1 1 0 111.414-1.414l4.034 4.034 6.543-6.543a1 1 0 011.417-.006z" clipRule="evenodd" />
        </svg>
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}
