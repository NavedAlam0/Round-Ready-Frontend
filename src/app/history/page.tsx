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
  interview_mode: string | null;
  coding_language: string | null;
  coding_problem_title: string | null;
}

type StatusFilter = "all" | "setup" | "planned" | "in_progress" | "completed" | "evaluated";
type DateFilter = "all" | "7d" | "30d" | "90d";
type TypeFilter = "all" | "coding" | "voice";

function statusLabel(status: string) {
  switch (status) {
    case "setup": return { text: "Setup", color: "bg-gray-100 text-gray-700" };
    case "planned": return { text: "Ready", color: "bg-blue-100 text-blue-700" };
    case "in_progress": return { text: "In Progress", color: "bg-amber-100 text-amber-700" };
    case "completed": return { text: "Completed", color: "bg-orange-100 text-orange-700" };
    case "evaluated": return { text: "Evaluated", color: "bg-green-100 text-green-700" };
    default: return { text: status, color: "bg-gray-100 text-gray-700" };
  }
}

function scoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-amber-600";
  return "text-rose-600";
}

function interviewLink(iv: InterviewItem) {
  const isCoding = iv.interview_mode === "coding";
  if (iv.status === "evaluated" || iv.status === "completed") return `/interview/report/${iv.id}`;
  if (iv.status === "in_progress") return isCoding ? `/interview/coding/${iv.id}` : `/interview/session/${iv.id}`;
  if (iv.status === "planned") return isCoding ? `/interview/coding-plan/${iv.id}` : `/interview/plan/${iv.id}`;
  return "/interview/setup";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function levelLabel(level: string | null) {
  if (!level) return "Entry";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function initials(name: string | null) {
  return (name || "Practice").trim().charAt(0).toUpperCase();
}

function dateCutoff(filter: DateFilter) {
  if (filter === "all") return null;
  const days = filter === "7d" ? 7 : filter === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  return cutoff;
}

function matchesDateFilter(value: string, filter: DateFilter) {
  const cutoff = dateCutoff(filter);
  if (!cutoff) return true;
  return new Date(value) >= cutoff;
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await apiFetch("/api/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (e) {
      console.error("Failed to fetch interviews:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) { router.replace("/login"); return; }
    void fetchInterviews();
  }, [authUser, authLoading, fetchInterviews, router]);

  const filteredInterviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return interviews.filter((iv) => {
      const searchableText = [iv.company_name, iv.role_type, iv.level, iv.employment_type, iv.interview_mode, iv.coding_problem_title, iv.coding_language].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesStatus = statusFilter === "all" || iv.status === statusFilter;
      const matchesDate = matchesDateFilter(iv.created_at, dateFilter);
      const matchesType = typeFilter === "all" || (typeFilter === "coding" ? iv.interview_mode === "coding" : iv.interview_mode !== "coding");
      return matchesSearch && matchesStatus && matchesDate && matchesType;
    });
  }, [dateFilter, interviews, searchQuery, statusFilter, typeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, dateFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInterviews.length / perPage));
  const paginatedInterviews = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredInterviews.slice(start, start + perPage);
  }, [filteredInterviews, currentPage]);

  const stats = useMemo(() => {
    const total = interviews.length;
    const coding = interviews.filter((iv) => iv.interview_mode === "coding").length;
    const voice = total - coding;
    const evaluated = interviews.filter((iv) => iv.status === "evaluated" || iv.status === "completed").length;
    const scored = interviews.filter((iv) => iv.overall_score !== null);
    const avg = scored.length > 0 ? scored.reduce((s, iv) => s + (iv.overall_score || 0), 0) / scored.length : null;
    return { total, coding, voice, evaluated, avg };
  }, [interviews]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this interview?")) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/interview/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete interview:", e);
    } finally {
      setDeleting(null);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setTypeFilter("all");
  }

  function handleExport() {
    if (filteredInterviews.length === 0) return;
    const headers = ["Company", "Type", "Role", "Level", "Employment Type", "Date", "Status", "Score"];
    const rows = filteredInterviews.map((iv) => [
      iv.company_name || "Practice Interview",
      iv.interview_mode === "coding" ? "Coding" : "Voice",
      iv.interview_mode === "coding" ? (iv.coding_problem_title || iv.role_type || "") : (iv.role_type || ""),
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

  if (authLoading || !authUser) return null;

  return (
    <div className="min-h-screen bg-[#f8fafd]">
      <Navbar />
      <main className="mx-auto max-w-[1536px] px-5 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-2 inline-flex items-center gap-1 text-[11px] sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Interview History</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">View and manage all your past interviews</p>
          </div>
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Interview
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Coding", value: stats.coding, color: "text-indigo-600" },
            { label: "Voice", value: stats.voice, color: "text-blue-600" },
            { label: "Avg Score", value: stats.avg !== null ? `${stats.avg.toFixed(1)}/10` : "--", color: stats.avg && stats.avg >= 6 ? "text-green-600" : "text-gray-900" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
              <p className="text-[11px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${s.color} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-2 sm:gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">All Interviews</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-gray-500">{filteredInterviews.length}</span>
            </div>
            <div className="grid w-full grid-cols-2 gap-1.5 sm:gap-2 lg:max-w-[720px] lg:grid-cols-[minmax(160px,1fr)_100px_100px_100px_80px]">
              <div className="relative col-span-2 lg:col-span-1">
                <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                </svg>
                <input
                  className="h-8 w-full rounded-md border border-gray-200 pl-8 pr-3 text-xs outline-none focus:border-blue-400"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <FilterSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as TypeFilter)}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "coding", label: "Coding" },
                  { value: "voice", label: "Voice" },
                ]}
              />
              <FilterSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
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
                onChange={(v) => setDateFilter(v as DateFilter)}
                options={[
                  { value: "all", label: "All Time" },
                  { value: "7d", label: "7 Days" },
                  { value: "30d", label: "30 Days" },
                  { value: "90d", label: "90 Days" },
                ]}
              />
              <button
                onClick={handleExport}
                disabled={filteredInterviews.length === 0}
                className="col-span-2 lg:col-span-1 inline-flex h-8 items-center justify-center gap-1 rounded-md border border-gray-200 px-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="px-4 py-16 sm:py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-bold text-gray-900">No interviews yet</h3>
              <p className="mt-1.5 text-sm text-gray-500">Start your first practice interview and your history will show here.</p>
              <Link href="/interview/setup" className="mt-5 inline-flex h-10 items-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Start First Interview
              </Link>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="px-4 py-16 sm:py-20 text-center">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">No matching interviews</h3>
              <p className="mt-1.5 text-sm text-gray-500">Try a different search, status, or date range.</p>
              <button onClick={clearFilters} className="mt-5 inline-flex h-10 items-center rounded-lg border border-gray-200 px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="px-5 py-3">Company</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Level</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedInterviews.map((iv) => {
                      const status = statusLabel(iv.status);
                      return (
                        <tr key={iv.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#06112f] text-sm font-bold text-white">
                                {initials(iv.company_name)}
                              </span>
                              <span className="font-semibold text-gray-900">{iv.company_name || "Practice Interview"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {iv.interview_mode === "coding" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                                Coding
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                                Voice
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-700">{iv.interview_mode === "coding" ? (iv.coding_problem_title || iv.role_type || "Coding Round") : (iv.role_type || "Interview Practice")}</td>
                          <td className="px-5 py-4 text-gray-700">{levelLabel(iv.level)}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-gray-700">{formatDate(iv.created_at)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.text}</span>
                          </td>
                          <td className="px-5 py-4">
                            {iv.overall_score !== null ? (
                              <div>
                                <span className={`text-lg font-bold ${scoreColor(iv.overall_score)}`}>{iv.overall_score}</span>
                                <span className="text-sm text-gray-500">/10</span>
                                <span className={`ml-2 inline-block h-2.5 w-2.5 rounded-full ${iv.overall_score >= 6 ? "bg-green-500" : "bg-rose-600"}`} />
                              </div>
                            ) : (
                              <span className="text-gray-300">--</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={interviewLink(iv)}
                                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-100 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16l4-4 3 3 5-7M7 16V9M14 15V9M19 8v8" />
                                </svg>
                                {iv.overall_score !== null ? "View Report" : "Continue"}
                              </Link>
                              <button
                                onClick={() => handleDelete(iv.id)}
                                disabled={deleting === iv.id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 transition-colors"
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
              <div className="sm:hidden divide-y divide-gray-100">
                {paginatedInterviews.map((iv) => {
                  const status = statusLabel(iv.status);
                  return (
                    <div key={iv.id} className="px-3 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#06112f] text-[10px] font-bold text-white">
                            {initials(iv.company_name)}
                          </span>
                          <span className="truncate text-[12px] font-semibold text-gray-900">{iv.company_name || "Practice Interview"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {iv.overall_score !== null ? (
                            <span className={`text-[13px] font-bold ${scoreColor(iv.overall_score)}`}>
                              {iv.overall_score}<span className="text-[10px] font-normal text-gray-400">/10</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-300">--</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-gray-500">
                        {iv.interview_mode === "coding" ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                            Coding
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">Voice</span>
                        )}
                        <span>{iv.interview_mode === "coding" ? (iv.coding_problem_title || iv.role_type || "Coding") : (iv.role_type || "Practice")}</span>
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
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
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

              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                <span>
                  Showing {Math.min((currentPage - 1) * perPage + 1, filteredInterviews.length)}–{Math.min(currentPage * perPage, filteredInterviews.length)} of {filteredInterviews.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Previous page"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.17 10l3.6 3.71a.75.75 0 11-1.08 1.04l-4.1-4.25a.75.75 0 010-1.04l4.1-4.25a.75.75 0 011.1.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1]) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-gray-300">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`h-8 min-w-[2rem] rounded-md text-xs font-semibold transition ${
                            currentPage === p
                              ? "bg-blue-600 text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Next page"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06l3.6-3.71-3.6-3.71a.75.75 0 111.08-1.04l4.1 4.25a.75.75 0 010 1.04l-4.1 4.25a.75.75 0 01-1.1-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-md border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-700 outline-none hover:bg-gray-50 focus:border-blue-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </label>
  );
}
