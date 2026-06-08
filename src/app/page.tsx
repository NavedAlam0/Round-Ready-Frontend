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
        <div className="mx-auto flex max-w-7xl items-center justify-between">
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

      {/* ========== HERO SECTION ========== */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heroGlow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes heroPulse1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.5; }
          50% { transform: translate(40px, -30px); opacity: 0.8; }
        }
        @keyframes heroPulse2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(-30px, 25px); opacity: 0.7; }
        }
        .hero-grid {
          background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
          background-size: 28px 28px;
        }
        @keyframes voiceRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes voiceBars {
          0%, 100% { height: var(--h-min); }
          50% { height: var(--h-max); }
        }
      `}} />
      <section className="relative overflow-hidden bg-white px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        {/* Animated background — dot grid + glowing orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Dot grid */}
          <div className="hero-grid absolute inset-0 opacity-[0.35]" />
          {/* Fade edges so grid doesn't look harsh */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, white 75%)" }} />
          {/* Animated glow orbs */}
          <div
            className="absolute rounded-full"
            style={{ width: 500, height: 500, top: "10%", left: "5%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", animation: "heroPulse1 8s ease-in-out infinite" }}
          />
          <div
            className="absolute rounded-full"
            style={{ width: 450, height: 450, top: "20%", right: "0%", background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)", animation: "heroPulse2 10s ease-in-out infinite" }}
          />
          <div
            className="absolute rounded-full"
            style={{ width: 300, height: 300, bottom: "5%", left: "35%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", animation: "heroPulse1 12s ease-in-out infinite 2s" }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <p className="flex items-center justify-center lg:justify-start gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI Interview Practice Platform
              </p>
              <h1 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-4xl lg:text-[44px] xl:text-[50px]">
                Practice voice
                <br />
                interviews and
                <br />
                live coding rounds
                <br />
                <span className="text-blue-600">before it counts</span>
              </h1>
              <p className="mt-5 mx-auto max-w-md xl:max-w-lg text-[15px] xl:text-base leading-relaxed text-gray-600 lg:mx-0">
                Train with a live voice AI agent that asks questions, watches your code as you type, reacts to your reasoning, and gives a detailed performance report.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5 sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2.5 sm:px-6 sm:py-3 text-[13px] sm:text-sm font-semibold text-white shadow-lg hover:bg-[#1e293b] transition-all"
                >
                  Start practicing free
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link
                  href="#sample-report"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 sm:px-6 sm:py-3 text-[13px] sm:text-sm font-semibold text-gray-700 shadow hover:bg-gray-50 transition-all"
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  View sample report
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center lg:justify-start sm:gap-x-6 sm:gap-y-3 text-xs text-gray-500">
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
                  Real-time voice agent
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  Live code observation
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  Interactive coding feedback
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Detailed scoring
                </span>
              </div>
            </div>

            {/* Right: Two overlapping product cards */}
            <div className="relative hidden lg:block">
              <div className="relative h-[360px] xl:h-[400px]">
                {/* Card 1: Voice Interview (back, slightly left) */}
                <div className="absolute top-0 left-0 w-[280px] xl:w-[300px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-gray-900">Voice Interview</span>
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="p-4">
                    {/* Animated Voice Orb */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative flex h-16 w-16 items-center justify-center">
                        {/* Pulsing rings */}
                        <div className="absolute inset-0 rounded-full bg-blue-500/20" style={{ animation: "voiceRing 2s ease-out infinite" }} />
                        <div className="absolute inset-0 rounded-full bg-blue-500/15" style={{ animation: "voiceRing 2s ease-out infinite 0.6s" }} />
                        <div className="absolute inset-0 rounded-full bg-blue-500/10" style={{ animation: "voiceRing 2s ease-out infinite 1.2s" }} />
                        {/* Core orb */}
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30">
                          <div className="flex items-center gap-[2px]" style={{ height: 26 }}>
                            {[
                              { min: 4, max: 10, delay: 0 },
                              { min: 6, max: 16, delay: 0.15 },
                              { min: 8, max: 20, delay: 0.3 },
                              { min: 10, max: 24, delay: 0.1 },
                              { min: 12, max: 26, delay: 0.25 },
                              { min: 10, max: 24, delay: 0.05 },
                              { min: 8, max: 20, delay: 0.2 },
                              { min: 6, max: 16, delay: 0.35 },
                              { min: 4, max: 10, delay: 0.15 },
                            ].map((bar, i) => (
                              <span
                                key={i}
                                className="w-[2.5px] rounded-full bg-white"
                                style={{
                                  ["--h-min" as string]: `${bar.min}px`,
                                  ["--h-max" as string]: `${bar.max}px`,
                                  height: bar.min,
                                  animation: `voiceBars 0.8s ease-in-out infinite ${bar.delay}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Animated Waveform */}
                    <div className="flex items-end justify-center gap-[1.5px] mb-4" style={{ height: 22 }}>
                      {Array.from({ length: 28 }).map((_, i) => {
                        const mins = [3,4,5,3,6,4,7,4,5,6,4,3,6,7,4,5,3,7,4,3,6,3,4,6,4,5,3,6];
                        const maxs = [6,10,14,8,16,12,18,10,14,20,12,8,16,22,10,14,8,18,12,10,16,8,12,20,10,14,8,16];
                        const delays = i * 0.06;
                        return (
                          <span
                            key={i}
                            className="w-[2px] rounded-full bg-blue-400/60"
                            style={{
                              ["--h-min" as string]: `${mins[i]}px`,
                              ["--h-max" as string]: `${maxs[i]}px`,
                              height: mins[i],
                              animation: `voiceBars 1s ease-in-out infinite ${delays}s`,
                            }}
                          />
                        );
                      })}
                    </div>
                    {/* Transcript */}
                    <div className="space-y-2">
                      {[
                        { who: "AI", text: "Tell me about a time you optimized a slow API." },
                        { who: "You", text: "Our search endpoint was taking ~2s per request..." },
                        { who: "AI", text: "What metrics did you track?" },
                      ].map((msg, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${msg.who === "AI" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                            {msg.who}
                          </span>
                          <p className="text-[10px] leading-[1.4] text-gray-600">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 2: Coding Round with Voice Agent (front, overlapping right) */}
                <div className="absolute top-10 left-[180px] xl:left-[200px] w-[300px] xl:w-[320px] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-10">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
                        <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-900">Coding Round</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600">
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                        Voice Agent
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500">Python</span>
                    </div>
                  </div>
                  {/* Code Editor */}
                  <div className="bg-[#1e1e2e] px-4 py-3 font-mono text-[10px] leading-[1.8] text-gray-300">
                    <div><span className="text-gray-500">1</span>  <span className="text-purple-400">def</span> <span className="text-blue-300">two_sum</span>(nums, target):</div>
                    <div><span className="text-gray-500">2</span>      seen = {"{}"}</div>
                    <div><span className="text-gray-500">3</span>      <span className="text-purple-400">for</span> i, num <span className="text-purple-400">in</span> <span className="text-yellow-300">enumerate</span>(nums):</div>
                    <div><span className="text-gray-500">4</span>          complement = target - num</div>
                    <div><span className="text-gray-500">5</span>          <span className="text-purple-400">if</span> complement <span className="text-purple-400">in</span> seen:</div>
                    <div className="bg-blue-500/20 -mx-4 px-4 rounded"><span className="text-gray-500">6</span>              <span className="text-purple-400">return</span> [seen[complement], i]</div>
                    <div><span className="text-gray-500">7</span>          seen[num] = i</div>
                  </div>
                  {/* AI watching + speaking bar */}
                  <div className="border-t border-gray-700 bg-[#1e1e2e] px-4 py-2 flex items-center justify-between text-[9px]">
                    <span className="flex items-center gap-1.5 text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      AI watching your code
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      Agent speaking...
                    </span>
                  </div>
                  {/* Agent voice feedback */}
                  <div className="p-3 space-y-2">
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5 flex items-start gap-2">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500">
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] leading-[1.4] text-gray-700">&quot;Walk me through why you chose a hash map here — what&apos;s the time complexity?&quot;</p>
                        <div className="mt-1.5 flex items-end gap-[1.5px]" style={{ height: 14 }}>
                          {Array.from({ length: 18 }).map((_, i) => {
                            const mins = [2,3,5,3,6,4,7,3,5,4,6,3,4,7,3,5,3,4];
                            const maxs = [5,8,12,7,14,10,16,8,12,10,14,7,11,16,9,12,8,10];
                            return (
                              <span
                                key={i}
                                className="w-[2px] rounded-full bg-blue-400/70"
                                style={{
                                  ["--h-min" as string]: `${mins[i]}px`,
                                  ["--h-max" as string]: `${maxs[i]}px`,
                                  height: mins[i],
                                  animation: `voiceBars 0.9s ease-in-out infinite ${i * 0.07}s`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-green-600">Tests: 8/10 passed</span>
                      <div className="flex-1 h-1.5 rounded bg-gray-200"><div className="h-1.5 rounded bg-green-500" style={{ width: "80%" }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUST BADGES ========== */}
      <section className="border-y border-gray-100 bg-gray-50/50 px-4 py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {[
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              ),
              number: "2",
              text: "Interview modes\nVoice & Coding",
            },
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              ),
              number: "Live",
              text: "Voice agent\nspeaks and listens",
            },
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              ),
              number: "8",
              text: "Coding signals tracked\nDeep insights",
            },
            {
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              ),
              number: "30s",
              text: "Report ready\nUnder 30 seconds",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center sm:flex-row sm:justify-center sm:text-left sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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

      {/* ========== HOW IT WORKS ========== */}
      <section className="px-4 py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How it works</h2>
            <p className="mt-2 text-sm text-gray-500">Four simple steps to ace every interview round.</p>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-5">
            {[
              {
                step: "1",
                title: "Upload resume",
                desc: "We analyze your resume and role to generate personalized questions.",
                icons: [
                  <svg key="doc" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>,
                ],
              },
              {
                step: "2",
                title: "Choose voice or coding",
                desc: "Pick the mode you want to practice or do both in a single session.",
                icons: [
                  <svg key="mic" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>,
                  <svg key="code" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>,
                ],
              },
              {
                step: "3",
                title: "Code while the AI agent watches and speaks",
                desc: "The agent sees your code in real time, asks follow-ups, and reacts to your thinking.",
                icons: [
                  <svg key="agent" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>,
                ],
              },
              {
                step: "4",
                title: "Review your report",
                desc: "Get detailed scores, feedback, model answers, and tips to improve your performance.",
                icons: [
                  <svg key="report" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>,
                ],
              },
            ].map((item, i) => (
              <div key={i} className="relative rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                  {item.step}
                </span>
                <div className="mt-4 flex items-center gap-2">
                  {item.icons.map((icon, j) => (
                    <div key={j} className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {icon}
                    </div>
                  ))}
                </div>
                <h3 className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-[11px] sm:text-xs leading-relaxed text-gray-500">{item.desc}</p>
                {i < 3 && (
                  <div className="absolute -right-3.5 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-blue-300 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY ROUNDREADY ========== */}
      <section className="px-4 py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Why RoundReady?</h2>
            <p className="mt-2 text-sm text-gray-500">Everything you need to master voice interviews and live coding rounds.</p>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 sm:gap-5">
            {/* 1: Live Voice Interview */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900">Live Voice Interview</h3>
              <div className="mt-3 flex-1 rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] text-rose-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Listening...
                </div>
                <div className="flex items-center gap-[1px]">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="w-[2px] rounded-full bg-blue-400/60" style={{ height: [4,8,12,6,14,10,16,8,12,18,10,6,14,8,12,6,10,8,6,4][i] }} />
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex items-start gap-1">
                    <span className="rounded px-1 py-0.5 text-[7px] font-bold bg-blue-100 text-blue-600">AI</span>
                    <p className="text-[8px] text-gray-600">How do you prioritize tasks?</p>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="rounded px-1 py-0.5 text-[7px] font-bold bg-green-100 text-green-600">You</span>
                    <p className="text-[8px] text-gray-600">I look at impact and urgency...</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[10px] sm:text-[11px] leading-relaxed text-gray-500">Natural conversations with real-time transcription and voice clarity.</p>
            </div>

            {/* 2: Voice Agent Coding Round */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <h3 className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900">Voice Agent Coding Round</h3>
              <div className="mt-3 flex-1 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <div className="font-mono text-[8px] leading-[1.6] text-gray-600 space-y-0.5">
                  <div><span className="text-purple-500">def</span> two_sum(nums, target):</div>
                  <div>    seen = {"{}"}</div>
                  <div>    <span className="text-purple-500">for</span> i, num <span className="text-purple-500">in</span> enumerate(nums):</div>
                  <div>        complement = target - num</div>
                  <div>        <span className="text-purple-500">if</span> complement <span className="text-purple-500">in</span> seen:</div>
                  <div>            <span className="text-purple-500">return</span> [seen[complement], i]</div>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[8px] text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Agent speaking
                </div>
              </div>
              <p className="mt-3 text-[10px] sm:text-[11px] leading-relaxed text-gray-500">Code in a real editor while the AI agent watches your code and talks with you.</p>
            </div>

            {/* 3: Real-Time Code Review */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <h3 className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900">Real-Time Code Review</h3>
              <div className="mt-3 flex-1 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <p className="text-[9px] font-bold text-gray-700 mb-1.5">Code Quality</p>
                {[
                  { label: "Time Complexity", grade: "O(n)", status: "Good", color: "text-green-600" },
                  { label: "Space Complexity", grade: "O(n)", status: "Good", color: "text-green-600" },
                  { label: "Readability", grade: "", status: "Good", color: "text-green-600" },
                  { label: "Best Practices", grade: "", status: "Improve", color: "text-amber-600" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-0.5 text-[8px]">
                    <span className="text-gray-500">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.grade && <span className="text-gray-700 font-medium">{item.grade}</span>}
                      <span className={`font-semibold ${item.color}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] sm:text-[11px] leading-relaxed text-gray-500">Instant feedback on complexity, best practices, and potential improvements.</p>
            </div>

            {/* 4: Agent Follow-up Questions */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900">Agent Follow-up Questions</h3>
              <div className="mt-3 flex-1 rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-1.5">
                <div className="flex items-start gap-1">
                  <span className="rounded px-1 py-0.5 text-[7px] font-bold bg-blue-100 text-blue-600">AI</span>
                  <p className="text-[8px] text-gray-600">Why did you choose a hash map here instead of sorting?</p>
                </div>
                <div className="flex items-start gap-1">
                  <span className="rounded px-1 py-0.5 text-[7px] font-bold bg-green-100 text-green-600">You</span>
                  <p className="text-[8px] text-gray-600">It gives O(n) time and handles duplicates efficiently.</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] sm:text-[11px] leading-relaxed text-gray-500">The agent dives deeper to test your understanding and problem-solving skills.</p>
            </div>

            {/* 5: Detailed Feedback & Scores */}
            <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900">Detailed Feedback & Scores</h3>
              <div className="mt-3 flex-1 rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-1.5">
                {[
                  { label: "Communication", score: "8.5/10", w: "85%" },
                  { label: "Problem Solving", score: "8.7/10", w: "87%" },
                  { label: "Code Quality", score: "8.9/10", w: "89%" },
                  { label: "Debugging", score: "8.2/10", w: "82%" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[8px]">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-semibold text-gray-700">{item.score}</span>
                    </div>
                    <div className="mt-0.5 h-[3px] rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: item.w }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] sm:text-[11px] leading-relaxed text-gray-500">Comprehensive report with scores, strengths, weaknesses, and actionable tips.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SAMPLE REPORT PREVIEW ========== */}
      <section id="sample-report" className="px-4 py-12 sm:py-16 bg-gray-50/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sample Report Preview</h2>
            <p className="mt-2 text-sm text-gray-500">A comprehensive view of your performance across voice and coding.</p>
          </div>

          <div className="mt-8 sm:mt-10 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {/* Overall Score */}
              <div className="p-5 sm:p-8 flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Overall Score</p>
                <div className="mt-4 relative flex h-[100px] w-[100px] items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray={`${87 * 2.764} ${100 * 2.764}`} strokeLinecap="round" />
                  </svg>
                  <span className="text-3xl font-bold text-green-600">8.7<span className="text-sm text-gray-400">/10</span></span>
                </div>
                <p className="mt-2 text-sm font-semibold text-green-500">Great job!</p>
                <div className="mt-5 w-full space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between"><span>Role</span><span className="font-medium text-gray-700">Backend Engineer</span></div>
                  <div className="flex justify-between"><span>Company</span><span className="font-medium text-gray-700">Acme Inc.</span></div>
                  <div className="flex justify-between"><span>Experience</span><span className="font-medium text-gray-700">5+ years</span></div>
                  <div className="flex justify-between"><span>Session</span><span className="font-medium text-gray-700">Voice + Coding</span></div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-5 sm:p-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Category Breakdown</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Communication", score: "8.5/10", w: "85%" },
                    { label: "Problem Solving", score: "8.7/10", w: "87%" },
                    { label: "Code Quality", score: "8.9/10", w: "89%" },
                    { label: "Debugging", score: "8.2/10", w: "82%" },
                    { label: "Technical Knowledge", score: "8.6/10", w: "86%" },
                    { label: "Cultural Fit", score: "8.0/10", w: "80%" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-bold text-gray-800">{item.score}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: item.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="p-5 sm:p-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Strengths</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Clear and structured communication",
                    "Strong problem-solving approach",
                    "Good code quality and readability",
                    "Handles edge cases well",
                    "Explains trade-offs effectively",
                  ].map((s) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-xs font-bold text-rose-400 uppercase tracking-wide italic">Areas for Improvement</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Optimize for space complexity",
                    "Add more test cases for robustness",
                    "Improve explanation of trade-offs",
                  ].map((s) => (
                    <li key={s} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-blue-600 px-6 py-10 sm:px-12 sm:py-14 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Ready to ace every interview round?</h2>
                <p className="mt-1.5 text-sm text-blue-100">Join thousands of candidates who practice smarter with RoundReady.</p>
              </div>
            </div>
            <Link
              href="/register"
              className="mt-6 sm:mt-0 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-lg hover:bg-gray-50 transition-all"
            >
              Get Started for Free
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12">
        <div className="mx-auto max-w-7xl">
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
                <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-900">Product</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Voice Interview</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Live Coding Round</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Reports</Link></li>
                <li><Link href="/pricing" className="text-xs text-gray-500 hover:text-gray-700 transition">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-900">Resources</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Blog</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Interview Tips</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Help Center</Link></li>
                <li><Link href="/register" className="text-xs text-gray-500 hover:text-gray-700 transition">Privacy Policy</Link></li>
              </ul>
            </div>

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
