"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiUpload } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

const ROLE_OPTIONS = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Scientist",
  "Data Engineer",
  "DevOps / SRE",
  "Product Manager",
  "Mobile Developer",
  "ML Engineer",
  "QA Engineer",
  "Other",
];

interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  tech_stack: string[];
  products: string[];
  culture_notes: string;
}

export default function InterviewSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser, loading: authLoading } = useAuth();

  // Resume state
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Company research state
  const [companyUrl, setCompanyUrl] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);

  // Role & level state
  const [roleType, setRoleType] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [level, setLevel] = useState<"entry" | "experienced">("entry");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [employmentType, setEmploymentType] = useState<
    "internship" | "full_time"
  >("full_time");
  const [roleSelected, setRoleSelected] = useState(false);
  const [employmentSelected, setEmploymentSelected] = useState(false);

  // Setup state
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState("");
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/login");
    }
  }, [authUser, authLoading, router]);

  // Load saved preferences on mount
  useEffect(() => {
    if (!authUser || prefsLoaded) return;
    async function loadPrefs() {
      try {
        const res = await apiFetch("/api/auth/me/preferences");
        if (!res.ok) return;
        const data = await res.json();
        if (data.resume_text) {
          setResumeText(data.resume_text);
          setResumeFileName(data.resume_file_name || "Resume.pdf");
        }
        if (data.role_type) {
          if (ROLE_OPTIONS.includes(data.role_type)) {
            setRoleType(data.role_type);
          } else {
            setRoleType("Other");
            setCustomRole(data.role_type);
          }
          setRoleSelected(true);
        }
        if (data.level) {
          setLevel(data.level as "entry" | "experienced");
        }
        if (data.years_of_experience != null) {
          setYearsOfExperience(data.years_of_experience);
        }
        if (data.employment_type) {
          setEmploymentType(data.employment_type as "internship" | "full_time");
          setEmploymentSelected(true);
        }
      } catch {
        // Silently ignore — just show empty form
      } finally {
        setPrefsLoaded(true);
      }
    }
    loadPrefs();
  }, [authUser, prefsLoaded]);

  if (authLoading || !authUser) return null;

  async function handleFileUpload(file: File) {
    setError("");
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiUpload("/api/resume/upload", formData);
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Upload failed");
        return;
      }
      const data = await res.json();
      setResumeText(data.resume_text);
      setResumeFileName(file.name);
    } catch {
      setError("Failed to upload resume");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleResearchCompany() {
    if (!companyUrl.trim()) return;
    setError("");
    setResearchLoading(true);
    try {
      const res = await apiFetch("/api/company/research", {
        method: "POST",
        body: JSON.stringify({ url: companyUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Company research failed");
        return;
      }
      const data = await res.json();
      setCompanyInfo(data);
    } catch {
      setError("Failed to research company");
    } finally {
      setResearchLoading(false);
    }
  }

  async function handleStartInterview() {
    if (!resumeText.trim()) {
      setError("Please upload your resume first");
      return;
    }
    setError("");
    setSetupLoading(true);
    const role = roleType === "Other" ? customRole : roleType;

    // Save role/experience preferences to user profile
    try {
      await apiFetch("/api/auth/me/preferences", {
        method: "PUT",
        body: JSON.stringify({
          role_type: role || null,
          level,
          years_of_experience: yearsOfExperience,
          employment_type: employmentType,
        }),
      });
    } catch {
      // Non-critical — continue with interview setup
    }

    try {
      const res = await apiFetch("/api/interview/setup", {
        method: "POST",
        body: JSON.stringify({
          resume_text: resumeText,
          company_info: companyInfo,
          role_type: role || null,
          level,
          years_of_experience: yearsOfExperience,
          employment_type: employmentType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Setup failed");
        return;
      }
      const data = await res.json();
      router.push(`/interview/plan/${data.interview_id}`);
    } catch {
      setError("Failed to start interview setup");
    } finally {
      setSetupLoading(false);
    }
  }

  const selectedRole = roleType === "Other" ? customRole : roleType;

  // Checklist items (5 items like the mockup)
  const checklist = [
    { label: "Resume uploaded", done: !!resumeText },
    { label: "Company researched", done: !!companyInfo },
    { label: "Role & experience added", done: roleSelected },
    { label: "Employment type selected", done: employmentSelected },
    { label: "Generate questions", done: false },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  // Steps for left sidebar
  const steps = [
    { id: 1, label: "Upload Resume", sub: "Add your resume", done: !!resumeText },
    { id: 2, label: "Target Company", sub: "Tell us where you're applying", done: !!companyInfo },
    { id: 3, label: "Role & Experience", sub: "Your role and background", done: roleSelected && employmentSelected },
    { id: 4, label: "Review & Generate", sub: "Review and generate questions", done: false },
  ];

  // Progress message
  function progressMessage() {
    if (progressPercent >= 80) return "Great start!";
    if (progressPercent >= 60) return "Almost there!";
    if (progressPercent >= 40) return "Good progress!";
    return "Let's get started!";
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Step Sidebar */}
        <aside className="hidden lg:flex w-48 shrink-0 flex-col border-r border-gray-200 bg-white py-6 px-4 overflow-y-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-3">
              {/* Vertical timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {step.done ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[30px] my-1 ${steps[idx].done ? "bg-green-200" : "bg-gray-200"}`} />
                )}
              </div>
              {/* Step icon + label */}
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                    {step.id === 1 && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    )}
                    {step.id === 2 && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                      </svg>
                    )}
                    {step.id === 3 && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    )}
                    {step.id === 4 && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-gray-900">{step.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{step.sub}</p>
              </div>
            </div>
          ))}
        </aside>

        {/* Center + Right Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 sm:px-8 lg:px-10 py-5">
            {/* Page Header + Top Progress */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Interview Setup</h1>
                <p className="mt-0.5 text-sm text-gray-500">Configure your practice session in a few simple steps.</p>
              </div>
              {/* Top Step Progress */}
              <div className="flex items-center gap-0">
                {[
                  { id: 1, label: "Resume" },
                  { id: 2, label: "Company" },
                  { id: 3, label: "Role" },
                  { id: 4, label: "Review" },
                ].map((step, idx) => {
                  const done = steps[idx].done;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                            done
                              ? "bg-green-500 text-white"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {done ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step.id
                          )}
                        </div>
                        <span className="mt-1 text-xs text-gray-500">{step.label}</span>
                      </div>
                      {idx < 3 && (
                        <div className={`w-10 sm:w-14 h-px mb-4 mx-1 ${done ? "bg-green-300" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-2.5 text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col xl:flex-row gap-5">
              {/* Center — All Form Sections Visible */}
              <div className="flex-1 space-y-4 min-w-0">
                {/* Section 1: Upload Resume */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <h2 className="text-[15px] font-semibold text-gray-900">Upload Resume</h2>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Upload Zone */}
                    <div className="flex-1">
                      {!resumeText ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-6 px-4 text-center hover:border-blue-400 hover:bg-blue-50/50 transition"
                        >
                          {uploadLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Uploading & parsing...
                            </div>
                          ) : (
                            <>
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-300 mb-2">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                              </div>
                              <p className="text-[13px] font-medium text-gray-700">Drag and drop your resume here</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">or</p>
                              <span className="mt-1.5 inline-flex rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-600 hover:bg-blue-100 transition">
                                Choose File
                              </span>
                              <p className="mt-2 text-[11px] text-gray-400">PDF up to 10MB</p>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-5 px-4 text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-300 mb-2">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                            </div>
                            <p className="text-[13px] text-gray-400">Resume uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recent Upload / File info */}
                    {resumeText && (
                      <div className="sm:w-56 shrink-0">
                        <p className="text-[13px] font-medium text-gray-500 mb-2">Recent upload</p>
                        <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50">
                            <span className="text-[10px] font-bold text-red-500">PDF</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-gray-900 truncate">{resumeFileName}</p>
                            <p className="text-[11px] text-gray-400">Uploaded just now</p>
                          </div>
                          <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <button
                          onClick={() => { setResumeText(""); setResumeFileName(""); }}
                          className="mt-2 flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                          </svg>
                          Replace Resume
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Target Company */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-[15px] font-semibold text-gray-900">Target Company</h2>
                      <p className="text-[13px] text-gray-500">Enter the company website to help us research</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="url"
                      placeholder="https://stripe.com"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    />
                    <button
                      onClick={handleResearchCompany}
                      disabled={researchLoading || !companyUrl.trim()}
                      className="rounded-lg bg-blue-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition"
                    >
                      {researchLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Researching...
                        </span>
                      ) : (
                        "Research"
                      )}
                    </button>
                  </div>

                  {companyInfo && (
                    <div className="mt-4 flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-600 font-medium">Company found</span>
                      <span className="text-sm text-gray-700 font-semibold">{companyInfo.name}</span>
                      <button
                        onClick={() => { setCompanyInfo(null); setCompanyUrl(""); }}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500 transition"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {companyInfo && (
                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2">
                      <p className="text-sm text-gray-600">{companyInfo.description}</p>
                      {companyInfo.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {companyInfo.tech_stack.map((tech) => (
                            <span key={tech} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 3: Role & Experience */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-[15px] font-semibold text-gray-900">Role & Experience</h2>
                      <p className="text-[13px] text-gray-500">Role you&apos;re applying for</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* Role dropdown */}
                    <select
                      value={roleType}
                      onChange={(e) => { setRoleType(e.target.value); setRoleSelected(true); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                    >
                      <option value="" disabled>Select a role...</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {roleType === "Other" && (
                      <input
                        type="text"
                        placeholder="Enter your role..."
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                      />
                    )}

                    {/* Experience Level + Years side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Experience Level</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setLevel("entry"); setYearsOfExperience(0); }}
                            className={`flex-1 rounded-lg border-2 px-2.5 py-2 text-center text-[13px] font-medium transition ${
                              level === "entry"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            Entry Level
                            <span className="block text-[11px] font-normal mt-0.5 opacity-70">0-2 years</span>
                          </button>
                          <button
                            onClick={() => { setLevel("experienced"); setYearsOfExperience(3); setEmploymentType("full_time"); }}
                            className={`flex-1 rounded-lg border-2 px-2.5 py-2 text-center text-[13px] font-medium transition ${
                              level === "experienced"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            Experienced
                            <span className="block text-[11px] font-normal mt-0.5 opacity-70">3+ years</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Years of Experience</label>
                        <select
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                        >
                          {level === "entry"
                            ? [0, 1, 2].map((y) => (
                                <option key={y} value={y}>{y} {y === 1 ? "year" : "years"}</option>
                              ))
                            : [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((y) => (
                                <option key={y} value={y}>{y === 15 ? "15+" : y} years</option>
                              ))}
                        </select>
                      </div>
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Employment Type</label>
                      <div className="flex gap-3">
                        {level === "entry" && (
                          <button
                            onClick={() => { setEmploymentType("internship"); setEmploymentSelected(true); }}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-[13px] font-medium transition ${
                              employmentType === "internship" && employmentSelected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                            </svg>
                            Internship
                          </button>
                        )}
                        <button
                          onClick={() => { setEmploymentType("full_time"); setEmploymentSelected(true); }}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-[13px] font-medium transition ${
                            employmentType === "full_time" && employmentSelected
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                          </svg>
                          Full Time
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Prep Summary Panel */}
              <div className="w-full xl:w-[300px] shrink-0">
                <div className="sticky top-5 space-y-3">
                  {/* Summary Card */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="text-[14px] font-bold text-gray-900 mb-3">Your Prep Summary</h3>

                    {/* Progress Circle + Message */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="relative h-18 w-18 shrink-0">
                        <svg className="h-18 w-18 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="7" />
                          <circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke={progressPercent >= 80 ? "#22c55e" : "#3b82f6"}
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-base font-bold text-gray-900">{progressPercent}%</span>
                          <span className="text-[9px] text-gray-400">Ready</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{progressMessage()}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          You&apos;re almost ready to generate your questions.
                        </p>
                        <p className="text-[11px] font-medium text-green-600 mt-1.5">
                          {completedCount} of {checklist.length} completed
                        </p>
                      </div>
                    </div>

                    {/* Your Selections */}
                    <div className="border-t border-gray-100 pt-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[13px] font-semibold text-gray-900">Your Selections</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                            </svg>
                            Company
                          </span>
                          <span className="font-medium text-gray-900">{companyInfo ? companyInfo.name : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                            </svg>
                            Role
                          </span>
                          <span className="font-medium text-gray-900">{selectedRole || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                            Experience
                          </span>
                          <span className="font-medium text-gray-900 capitalize">
                            {yearsOfExperience} years ({level === "entry" ? "Entry Level" : "Experienced"})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Employment Type
                          </span>
                          <span className="font-medium text-gray-900 capitalize">{employmentType.replace("_", " ")}</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            Resume
                          </span>
                          <span className="font-medium text-gray-900 flex items-center gap-1.5">
                            {resumeText ? (
                              <>
                                <span className="max-w-[120px] truncate">{resumeFileName}</span>
                                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </>
                            ) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Setup Checklist */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-[13px] font-semibold text-gray-900 mb-2">Setup Checklist</p>
                      <div className="space-y-2">
                        {checklist.map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-[12px]">
                            {item.done ? (
                              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-200" />
                            )}
                            <span className={item.done ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleStartInterview}
                    disabled={setupLoading || !resumeText.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-[13px] font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                  >
                    {setupLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating plan...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                        Generate Interview Questions
                      </>
                    )}
                  </button>

                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-400">
                      We&apos;ll use your info to tailor the best questions.
                    </p>
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Your data is private and secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
