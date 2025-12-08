"use client";
import Image from 'next/image';
import Navbar from "../components/navbar";
import { FeatureCard } from "../components/ui/feature-card";
import { BackgroundGradient } from "../components/ui/background-gradient";
import { PixelatedCanvas } from "../components/ui/pixelated-canvas";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-24 px-4 sm:px-6 lg:px-6">
        <div className="relative max-w-7xl mx-auto mb-10">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-600 via-orange-600 to-orange-500 ring-1 ring-white/60 shadow-[0_15px_40px_rgba(0,0,0,0.15)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-[8%] top-[10%] h-[540px] w-[540px] rounded-full border border-white/15" />
              <div className="absolute right-[15%] top-[16%] h-[420px] w-[420px] rounded-full border border-white/10" />
              <div className="absolute right-[22%] top-[22%] h-[300px] w-[300px] rounded-full border border-white/10" />
            </div>

            <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center px-6 sm:px-10 lg:px-14 pt-10 sm:pt-14 lg:pt-16 pb-28 sm:pb-36 lg:pb-44 min-h-[420px] sm:min-h-[600px] lg:min-h-[680px]">
              <div className="z-10">
                <h1 className="text-white font-extrabold leading-tight tracking-tight text-[36px] sm:text-[52px] lg:text-[60px] xl:text-[50px]">
                  Verify loan assets without costly field visits.
                </h1>
                <p className="mt-6 max-w-xl text-white/90 text-sm sm:text-base lg:text-lg">
                  Field verification of loan utilization is expensive, slow, and error-prone. LoanSetu enables beneficiaries to upload geo‑tagged, time‑stamped proof of purchased assets, validated instantly by AI to reduce delay and fraud.
                </p>

                <div className="mt-8 flex mb-12 flex-wrap mb-1 items-center gap-3">
                  <button aria-label="go" className="h-14 w-14 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-md hover:scale-105 transition-transform flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                  <a href="#demo" className="inline-flex items-center  justify-center rounded-full bg-white px-7 py-3.5 text-sm sm:text-base font-extrabold text-gray-900 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap">
                    TRY LOANSETU DEMO
                  </a>
                </div>
              </div>

              <div className="relative flex items-end justify-center lg:justify-end">
                <div className="relative h-[380px] sm:h-[460px] lg:h-[520px] w-[380px] sm:w-[460px] lg:w-[520px] max-w-full">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400/30 to-white/10" />
                  <Image
                    src="/img1.png"
                    alt="LoanSetu verification visual"
                    fill
                    priority
                    className="object-contain object-bottom select-none pointer-events-none"
                  />
                </div>

                <div className="absolute right-6 lg:right-10 bottom-24 hidden md:block">
                  <svg className="spin-slower" width="140" height="140" viewBox="0 0 140 140" fill="none">
                    <defs>
                      <path id="circlePath" d="M70,70 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
                    </defs>
                    <circle cx="70" cy="70" r="56" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
                    <text fill="#fff" fontSize="12" fontWeight="700" letterSpacing="2">
                      <textPath href="#circlePath"> VERIFY • LOAN • VERIFY • LOAN • </textPath>
                    </text>
                    <circle cx="70" cy="70" r="6" fill="#fff" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="absolute left-6 sm:left-8 bottom-6 sm:bottom-8 hidden md:block">
              <div className="rounded-2xl bg-black/90 text-white p-5 sm:p-6 shadow-xl border border-white/10 w-[260px]">
                <p className="text-xl font-extrabold leading-snug">Remote Loan Utilization
                  <br />Proof Capture
                </p>
                <a href="#demo" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-gray-900">
                  REQUEST DEMO
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4">
              FEATURES
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              AI-Powered Verification at Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform manual loan verification into an automated, fraud-proof system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-200 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Mobile Capture</h3>
                <p className="text-gray-600 leading-relaxed">
                  One-tap photo upload with automatic GPS tagging and timestamp verification. Works offline for rural areas.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-200 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">8 AI Fraud Checks</h3>
                <p className="text-gray-600 leading-relaxed">
                  Detect tampering, deepfakes, duplicate images, fake GPS, and more in under 5 seconds per submission.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-green-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-200 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Instant Auto-Approval</h3>
                <p className="text-gray-600 leading-relaxed">
                  Low-risk submissions approved automatically. Officers only review edge cases, reducing workload by 70%.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-200 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Tamper-Proof Ledger</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every action recorded in an immutable audit trail. Complete transparency prevents corruption.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 to-pink-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-200 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Multi-State Ready</h3>
                <p className="text-gray-600 leading-relaxed">
                  Configurable rules per state and scheme. Scale to millions of beneficiaries with multi-tenant architecture.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-200 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Banks and state officers track utilization, fraud patterns, and approval rates with live dashboards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50 opacity-50" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Simple 3-Step Process
            </h2>
            <p className="text-xl text-gray-600">
              From upload to approval in minutes, not weeks
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -right-4 -top-4 text-[120px] font-black text-orange-100">1</div>
                <div className="relative">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Capture Proof</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Beneficiary opens the app and clicks one button. Camera auto-captures GPS location, timestamp, and uploads securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -right-4 -top-4 text-[120px] font-black text-blue-100">2</div>
                <div className="relative">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Validates</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our AI runs 8 fraud checks in under 5 seconds. GPS, tampering, deepfakes, duplicates—all verified instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -right-4 -top-4 text-[120px] font-black text-green-100">3</div>
                <div className="relative">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Auto-Approved</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Low-risk submissions get instant approval. High-risk cases flagged for officer review. Banks see real-time updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl font-bold">70% reduction in officer workload</span>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section with Gradient Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4">
              TECHNOLOGY
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Built for Government Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade infrastructure designed for millions of transactions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BackgroundGradient className="rounded-[22px] p-6 bg-white">
              <div className="flex flex-col h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile-First Design</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Intuitive interface works on low-end devices. Offline sync ensures connectivity in remote areas.
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs font-semibold text-orange-600">React Native + Progressive Web App</span>
                </div>
              </div>
            </BackgroundGradient>

            <BackgroundGradient className="rounded-[22px] p-6 bg-white">
              <div className="flex flex-col h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Security</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Deep learning models detect fraud patterns. Continuous learning from new submission data.
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs font-semibold text-blue-600">TensorFlow + Python FastAPI</span>
                </div>
              </div>
            </BackgroundGradient>

            <BackgroundGradient className="rounded-[22px] p-6 bg-white">
              <div className="flex flex-col h-full">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Blockchain Ledger</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Immutable audit trail with cryptographic verification. Every action is permanently recorded.
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs font-semibold text-green-600">PostgreSQL + Hash Chain</span>
                </div>
              </div>
            </BackgroundGradient>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section with PixelatedCanvas */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4">
              INTERACTIVE DEMO
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              See AI Verification in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hover over the image to see our intelligent analysis system at work
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl bg-black">
              <PixelatedCanvas 
                src="/img1.png"
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time Image Analysis</h3>
                  <p className="text-gray-600">
                    Our AI instantly processes geo-tagged photos to verify asset authenticity and detect tampering
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Metadata Verification</h3>
                  <p className="text-gray-600">
                    Timestamp, location, and device information are cross-referenced for comprehensive validation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Instant Fraud Detection</h3>
                  <p className="text-gray-600">
                    Pattern recognition identifies suspicious submissions before they reach human reviewers
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button className="px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  Try Interactive Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Section */}
      <section id="innovation" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              What Makes Us Unique
            </h2>
            <p className="text-xl text-gray-600">
              Features not available in ANY existing government system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced Fraud Detection</h3>
              <p className="text-gray-700">AI doesn't just classify assets - it detects sophisticated fraud patterns and tampering attempts</p>
            </div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cryptographic Ledger</h3>
              <p className="text-gray-700">Tamper-proof blockchain-style ledger ensures complete transparency and prevents corruption</p>
            </div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">State-wise RuleSets</h3>
              <p className="text-gray-700">Configurable rules per scheme and state without code changes, adapting to local requirements</p>
            </div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Behavior Monitoring</h3>
              <p className="text-gray-700">Officer behavior analytics detect bribery patterns and suspicious approval/rejection trends</p>
            </div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200">
              <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Appeal Workflow</h3>
              <p className="text-gray-700">Citizens can appeal rejections with automatic conflict detection between AI and officers</p>
            </div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-white flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Audit Trail</h3>
              <p className="text-gray-700">Every loan update tracked with who, what, when, and why for complete accountability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-12">
            Measurable Impact
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <div className="text-5xl font-extrabold mb-2">70-90%</div>
              <div className="text-xl font-semibold">Fraud Reduction</div>
            </div>
            <div className="p-8 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <div className="text-5xl font-extrabold mb-2">60%</div>
              <div className="text-xl font-semibold">Cost Savings</div>
            </div>
            <div className="p-8 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20">
              <div className="text-5xl font-extrabold mb-2">3x</div>
              <div className="text-xl font-semibold">Faster Disbursement</div>
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div className="flex gap-4">
              <svg className="h-8 w-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-bold text-lg mb-1">Transparency Increases</h3>
                <p className="text-white/90">Every action tracked and auditable</p>
              </div>
            </div>
            <div className="flex gap-4">
              <svg className="h-8 w-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-bold text-lg mb-1">Corruption Becomes Traceable</h3>
                <p className="text-white/90">Immutable records prevent tampering</p>
              </div>
            </div>
            <div className="flex gap-4">
              <svg className="h-8 w-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-bold text-lg mb-1">Citizen Trust Grows</h3>
                <p className="text-white/90">Fair, fast, and transparent process</p>
              </div>
            </div>
          </div>

          <p className="mt-12 text-2xl font-semibold">
            This directly impacts <span className="text-yellow-200">millions of beneficiaries</span> across India
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">
            Ready to Transform Loan Verification?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Our solution is not a prototype - it's a deployable system that can save crores of rupees, reduce corruption, and improve governance efficiency using AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#demo" className="inline-flex items-center justify-center rounded-full bg-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-orange-600 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Try Live Demo
            </a>
            <a href="#contact" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-bold text-gray-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}