import Image from 'next/image';
import Navbar from "../components/navbar";

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
    </main>
  );
}