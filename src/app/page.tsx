"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Image src="/RoundReady logo.png" alt="RoundReady" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
            <span className="text-[15px] sm:text-lg font-bold text-gray-900">RoundReady</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-blue-500 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== STEP 1: Hero Section ========== */}
      <section className="relative overflow-hidden bg-white px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <p className="flex items-center justify-center lg:justify-start gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI-Powered Interview Practice
              </p>
              <h1 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-4xl lg:text-[44px]">
                Practice every
                <br />
                interview round
                <br />
                <span className="text-blue-600">before it counts</span>
              </h1>
              <p className="mt-5 mx-auto max-w-md text-[15px] leading-relaxed text-gray-600 lg:mx-0">
                RoundReady uses AI to generate role-specific questions from your
                resume, conduct real-time voice interviews, and deliver detailed
                feedback with scores and model answers.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5 sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2 sm:px-6 sm:py-3 text-[13px] sm:text-sm font-semibold text-white shadow-lg hover:bg-[#1e293b] transition-all"
                >
                  Start practicing free
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link
                  href="#sample-report"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 sm:px-6 sm:py-3 text-[13px] sm:text-sm font-semibold text-gray-700 shadow hover:bg-gray-50 transition-all"
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  See sample report
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Resume-based questions
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                  Real-time voice
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Detailed scoring
                </span>
              </div>
            </div>

            {/* Right: Product Screenshots */}
            <div className="relative hidden min-h-[520px] lg:block">
              {/* Interview Session Card */}
              <div className="w-[340px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <span className="text-[13px] font-bold text-gray-900">Interview Session</span>
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                      <span className="h-1 w-1 rounded-full bg-green-500" />
                      In progress
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-gray-400">04:12</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  AI Interviewer
                </div>

                {/* Wave orb - small circle */}
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500">
                    <div className="flex h-6 items-center gap-[2px]">
                      {[5, 9, 14, 18, 22, 18, 14, 9, 5].map((h, i) => (
                        <span key={i} className="w-[2.5px] rounded-full bg-white" style={{ height: h }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[11px] leading-[1.6] text-gray-600">
                  You built inbound and outbound AI voice agents using Pipecat, Deepgram for STT, Azure OpenAI for LLMs, and ElevenLabs for TTS. Walk me through the full pipeline of a single patient call — from the phone ringing to the AI responding — and explain what happens at each stage?
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Listening...
                </div>

                {/* Audio waveform visualization */}
                <div className="mt-2 flex items-center gap-[1.5px]">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const heights = [4,8,12,6,14,10,16,8,12,18,10,6,14,20,8,12,6,16,10,8,14,6,10,18,8,12,6,14,10,16,8,4,12,6,10,8,6,4,3,2];
                    return (
                      <span key={i} className="w-[2px] rounded-full bg-blue-400/70" style={{ height: heights[i] || 4 }} />
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-medium text-gray-500">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                    </svg>
                    Mute
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] font-medium text-gray-500">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </button>
                  <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-[10px] font-semibold text-white">
                    End Interview
                  </button>
                </div>
              </div>

              {/* Floating Score Card - positioned top right, overlapping */}
              <div className="absolute right-0 top-0 w-[190px] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                <p className="text-[10px] font-medium text-gray-400 italic">Overall Score</p>
                <div className="mt-3 flex items-center justify-center">
                  <div className="relative flex h-[72px] w-[72px] items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="32" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                      <circle cx="36" cy="36" r="32" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${81 * 2.01} ${100 * 2.01}`} strokeLinecap="round" />
                    </svg>
                    <span className="text-[18px] font-bold text-green-600">8.1<span className="text-[10px] text-gray-400">/10</span></span>
                  </div>
                </div>
                <p className="mt-1 text-center text-[10px] font-semibold text-green-500">Great job!</p>
                <p className="mt-3 text-center text-[9px] font-medium text-gray-400 italic">Great job!</p>
                <div className="mt-2 space-y-2.5">
                  {[
                    { label: "Technical Knowledge", score: "8.0/10", color: "bg-blue-500", w: "80%" },
                    { label: "Communication", score: "7.0/10", color: "bg-orange-400", w: "70%" },
                    { label: "Problem Solving", score: "7.0/10", color: "bg-orange-400", w: "70%" },
                    { label: "Experience Relevance", score: "9.1/10", color: "bg-green-500", w: "91%" },
                    { label: "Cultural Fit", score: "8.0/10", color: "bg-green-500", w: "80%" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-500">{item.label}</span>
                        <span className="text-[9px] font-semibold text-gray-700">{item.score}</span>
                      </div>
                      <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: item.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Transcript Card - positioned bottom, overlapping both cards */}
              <div className="absolute bottom-0 left-[120px] w-[320px] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                <p className="text-[13px] font-bold text-gray-800">Live Transcript</p>
                <div className="mt-3 space-y-3">
                  {[
                    { who: "AI", text: "Can you explain how your system handled emergency calls with sub-2 second detection?", time: "00:18" },
                    { who: "You", text: "We used a bi-directional streaming layer over FastAPI WebSockets with a sub-200ms first-token response...", time: "00:26" },
                    { who: "AI", text: "Great. What challenges did you face with Twilio call routing and how did you solve them?", time: "00:34" },
                  ].map((msg, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${msg.who === "AI" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                        {msg.who}
                      </span>
                      <p className="min-w-0 flex-1 text-[10px] leading-[1.5] text-gray-600">{msg.text}</p>
                      <span className="shrink-0 pt-0.5 text-[9px] text-gray-300">{msg.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STEP 2: Trust Badges Row ========== */}
      <section className="border-y border-gray-100 bg-gray-50/50 px-4 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:gap-6">
          {[
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              ),
              number: "15",
              text: "Personalized questions\nper session",
            },
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              ),
              number: "5",
              text: "Scoring categories\nin every report",
            },
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              ),
              number: "30s",
              text: "Report ready in\nunder 30 seconds",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center sm:flex-row sm:justify-center sm:text-left sm:gap-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                {item.icon}
              </div>
              <div className="mt-1.5 sm:mt-0">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">{item.number}</span>
                <p className="text-[10px] sm:text-xs leading-[1.3] sm:leading-4 text-gray-500 whitespace-pre-line">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== STEP 3: How It Works ========== */}
      <section className="px-4 py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How it works</h2>
            <p className="mt-2 text-sm text-gray-500">Three simple steps to ace your next interview.</p>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
            {[
              {
                step: "1",
                title: "Upload your resume",
                desc: "Upload your resume and tell us your target role and experience level.",
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Practice with AI",
                desc: "Answer personalized questions in a real-time voice interview with our AI interviewer.",
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Review your report",
                desc: "Get detailed feedback, scores across key categories, model answers, and actionable tips.",
                icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="relative flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 sm:flex-col sm:items-stretch sm:gap-0 sm:p-5">
                <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-0">
                  <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-blue-600 text-[10px] sm:text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <div className="flex h-8 w-8 sm:hidden items-center justify-center rounded-lg bg-blue-50 text-blue-600 [&>svg]:h-4 [&>svg]:w-4">
                    {item.icon}
                  </div>
                </div>
                <div className="min-w-0 sm:contents">
                  <div className="hidden sm:flex sm:mt-6 h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {item.icon}
                  </div>
                  <h3 className="text-[13px] sm:text-sm font-bold text-gray-900 sm:mt-4">{item.title}</h3>
                  <p className="mt-0.5 sm:mt-1.5 text-[11px] sm:text-xs leading-relaxed text-gray-500">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="absolute -right-4 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-blue-300 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STEP 4: Why RoundReady ========== */}
      <section className="px-4 py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Why RoundReady?</h2>
            <p className="mt-2 text-sm text-gray-500">Built to make your interview prep smarter, not harder.</p>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {/* Feature 1: Personalized Questions */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="mt-2.5 sm:mt-4 text-[13px] sm:text-sm font-bold text-gray-900">Personalized Questions</h3>
              <p className="mt-1 sm:mt-1.5 flex-1 text-[11px] sm:text-xs leading-relaxed text-gray-500">
                Generated from your resume, skills, and target role — not generic templates.
              </p>
              <div className="mt-3 sm:mt-4 hidden sm:block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] font-medium text-gray-400">Sample Question</p>
                <div className="mt-1 h-1.5 w-3/4 rounded bg-gray-200" />
                <div className="mt-1 h-1.5 w-1/2 rounded bg-gray-200" />
                <p className="mt-2 flex items-center gap-1 text-[9px] text-blue-500">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Role: Software Engineer
                </p>
              </div>
            </div>

            {/* Feature 2: Real-Time Voice */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-50 text-green-500">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mt-2.5 sm:mt-4 text-[13px] sm:text-sm font-bold text-gray-900">Real-Time Voice</h3>
              <p className="mt-1 sm:mt-1.5 flex-1 text-[11px] sm:text-xs leading-relaxed text-gray-500">
                A natural voice conversation that feels like a real interview.
              </p>
              <div className="mt-3 sm:mt-4 hidden sm:block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-medium text-gray-500">Listening...</span>
                  </div>
                  <span className="text-[10px] text-gray-400">00:28</span>
                </div>
                <div className="mt-2 flex items-center gap-[2px]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-blue-400"
                      style={{ height: Math.max(3, Math.random() * 16) }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 3: Emotion-Aware */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <h3 className="mt-2.5 sm:mt-4 text-[13px] sm:text-sm font-bold text-gray-900">Emotion-Aware</h3>
              <p className="mt-1 sm:mt-1.5 flex-1 text-[11px] sm:text-xs leading-relaxed text-gray-500">
                AI adapts to your tone and confidence to keep you on track.
              </p>
              <div className="mt-3 sm:mt-4 hidden sm:block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] font-medium text-gray-400">Confidence</p>
                <svg className="mt-2 h-8 w-full" viewBox="0 0 200 40" fill="none">
                  <path d="M0 30 Q25 28 50 24 T100 18 T150 12 T200 8" stroke="#22c55e" strokeWidth="2" fill="none" />
                </svg>
                <p className="mt-1 text-right text-[10px] font-semibold text-green-500">Good</p>
              </div>
            </div>

            {/* Feature 4: Detailed Feedback */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3 className="mt-2.5 sm:mt-4 text-[13px] sm:text-sm font-bold text-gray-900">Detailed Feedback</h3>
              <p className="mt-1 sm:mt-1.5 flex-1 text-[11px] sm:text-xs leading-relaxed text-gray-500">
                Scores, strengths, weaknesses, model answers & tips.
              </p>
              <div className="mt-3 sm:mt-4 hidden sm:block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-500">Technical Knowledge</span>
                  <span className="text-[10px] font-bold text-blue-600">8.0/10</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full w-4/5 rounded-full bg-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STEP 5: Sample Report Preview ========== */}
      <section id="sample-report" className="px-4 py-12 sm:py-16 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sample Report Preview</h2>
            <p className="mt-2 text-sm text-gray-500">See the kind of insights you&apos;ll get after every session.</p>
          </div>

          <div className="mt-6 sm:mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-8">
            {/* Mobile: compact stacked layout | Desktop: 3-column grid */}
            <div className="hidden lg:grid gap-8 lg:grid-cols-[200px_1fr_1fr]">
              {/* Overall Score - Desktop */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Score</p>
                <div className="relative mt-4 flex h-28 w-28 items-center justify-center rounded-full border-[5px] border-green-500">
                  <div>
                    <span className="text-3xl font-bold text-green-600">8.1</span>
                    <span className="text-sm text-gray-400">/10</span>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-green-600">Great job!</p>
                <div className="mt-4 w-full space-y-1.5 text-[11px] text-gray-500">
                  <div className="flex justify-between gap-2"><span>Role</span><span className="font-medium text-gray-700">Software Engineer</span></div>
                  <div className="flex justify-between gap-2"><span>Company</span><span className="font-medium text-gray-700">RoundReady</span></div>
                  <div className="flex justify-between gap-2"><span>Experience</span><span className="font-medium text-gray-700 text-right">0 years (Entry Level)</span></div>
                  <div className="flex justify-between gap-2"><span>Date</span><span className="font-medium text-gray-700">Jun 2, 2026</span></div>
                </div>
              </div>

              {/* Category Breakdown - Desktop */}
              <div>
                <h3 className="text-sm font-bold text-gray-900">Category Breakdown</h3>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Technical Knowledge", score: "8.0/10", color: "bg-blue-500", w: "80%" },
                    { label: "Communication", score: "7.0/10", color: "bg-orange-400", w: "70%" },
                    { label: "Problem Solving", score: "8.0/10", color: "bg-red-400", w: "80%" },
                    { label: "Experience Relevance", score: "9.1/10", color: "bg-green-500", w: "91%" },
                    { label: "Cultural Fit", score: "8.0/10", color: "bg-green-500", w: "80%" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-800">{item.score}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: item.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements - Desktop */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-green-600">Strengths</h3>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      "Strong hands-on experience with AI voice stack and real-time systems",
                      "Quantified impact with meaningful metrics and outcomes",
                      "Clear problem-solving approach with practical examples",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-gray-600">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0L3.296 9.22a1 1 0 111.414-1.414l4.034 4.034 6.543-6.543a1 1 0 011.417-.006z" clipRule="evenodd" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-500">Areas for Improvement</h3>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      "Provide more structured answers with signposts",
                      "Depth in system design trade-offs can be improved",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-gray-600">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="lg:hidden space-y-4">
              {/* Score + metadata row */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-green-500">
                  <div>
                    <span className="text-lg font-bold text-green-600">8.1</span>
                    <span className="text-[10px] text-gray-400">/10</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Overall Score</p>
                  <p className="text-xs font-semibold text-green-600">Great job!</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500">
                    <span>Software Engineer</span>
                    <span>Entry Level</span>
                    <span>Jun 2, 2026</span>
                  </div>
                </div>
              </div>

              {/* Category bars */}
              <div>
                <h3 className="text-[13px] font-bold text-gray-900">Category Breakdown</h3>
                <div className="mt-2.5 space-y-2">
                  {[
                    { label: "Technical", score: "8.0", color: "bg-blue-500", w: "80%" },
                    { label: "Communication", score: "7.0", color: "bg-orange-400", w: "70%" },
                    { label: "Problem Solving", score: "8.0", color: "bg-red-400", w: "80%" },
                    { label: "Experience", score: "9.1", color: "bg-green-500", w: "91%" },
                    { label: "Cultural Fit", score: "8.0", color: "bg-green-500", w: "80%" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-800">{item.score}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: item.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-[11px] font-bold text-green-600">Strengths</h3>
                  <ul className="mt-1.5 space-y-1">
                    {[
                      "Strong AI voice stack experience",
                      "Quantified impact with metrics",
                      "Clear problem-solving approach",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] leading-[1.4] text-gray-600">
                        <svg className="mt-0.5 h-3 w-3 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0L3.296 9.22a1 1 0 111.414-1.414l4.034 4.034 6.543-6.543a1 1 0 011.417-.006z" clipRule="evenodd" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-orange-500">Improvements</h3>
                  <ul className="mt-1.5 space-y-1">
                    {[
                      "More structured answers",
                      "Deeper system design trade-offs",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] leading-[1.4] text-gray-600">
                        <svg className="mt-0.5 h-3 w-3 shrink-0 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STEP 6: CTA Banner ========== */}
      <section className="bg-gradient-to-br from-gray-50 to-white px-4 py-8 sm:py-14">
          <div className="mx-auto flex flex-col items-center">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-blue-100">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-900 text-center sm:text-2xl">
              Ready to ace your next interview?
            </h2>
            <p className="mt-2 sm:mt-3 text-center text-[13px] sm:text-sm leading-relaxed text-gray-500">
              Join thousands of candidates who practice smarter with RoundReady.
            </p>
            <Link
              href="/register"
              className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-[13px] sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
            >
              Get Started for Free
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
      </section>

      {/* ========== STEP 7: Full Footer ========== */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-4 lg:grid-cols-5">
            {/* Brand */}
            <div className="sm:col-span-4 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Image src="/RoundReady logo.png" alt="RoundReady" width={32} height={32} className="h-8 w-8 rounded-full" />
                <span className="text-lg font-bold text-gray-900">RoundReady</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                AI-powered interview practice that helps you get hired.
              </p>
              <div className="mt-4 flex gap-3">
                {/* LinkedIn */}
                <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                {/* Twitter/X */}
                <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* GitHub */}
                <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-900">Product</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Features</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">How it works</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Reports</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Pricing</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-900">Resources</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Blog</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Interview Tips</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Help Center</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-900">Company</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">About Us</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Careers</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-6 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} RoundReady, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
