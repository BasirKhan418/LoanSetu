"use client";
import React, { useState } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import Image from "next/image";
import Navbar from "../../../components/navbar";
import { Smartphone, Wifi, CheckCircle2 } from "lucide-react";

export default function StateAdminSignIn() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length === 10) {
      setShowOtpField(true);
      console.log("Sending OTP to:", mobileNumber);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted", { mobileNumber, otp });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <section className="px-4 mt-5 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-7xl">
          {/* Mobile: Sign-in card first, desktop: 2-column layout */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 items-center">
            
            {/* Right column (mobile first) - Sign-in Card */}
            <div className="order-1 lg:order-2 flex justify-start lg:justify-end">
              <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg border border-neutral-100 lg:p-6">
                {/* Logo and brand */}
                <div className="mb-4 flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="LoanSetu Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <span className="text-lg font-bold text-neutral-800">LoanSetu</span>
                </div>

                <div className="mb-5">
                  <h2 className="text-xl font-bold text-neutral-800">
                    Sign in to your account
                  </h2>
                  <p className="mt-1 text-xs text-neutral-600">
                    Use your registered mobile number to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <LabelInputContainer className="mb-3">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-700">
                        +91
                      </div>
                      <Input
                        id="mobile"
                        placeholder="9876543210"
                        type="tel"
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>
                  </LabelInputContainer>

                  {!showOtpField ? (
                    <button
                      onClick={handleSendOtp}
                      className="mb-3 h-10 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                      type="button"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <>
                      <LabelInputContainer className="mb-3">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          placeholder="6-digit OTP"
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          required
                        />
                      </LabelInputContainer>

                      <button
                        className="mb-3 h-10 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                        type="submit"
                      >
                        Continue
                      </button>
                    </>
                  )}

                  <p className="text-center text-xs text-neutral-500">
                    Having trouble?{" "}
                    <a
                      href="#support"
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      Contact support
                    </a>
                  </p>
                </form>

                <div className="mt-4 border-t border-neutral-200 pt-4">
                  <p className="text-center text-xs text-neutral-500">
                    For authorized beneficiaries and officers only
                  </p>
                </div>
              </div>
            </div>

            {/* Left column (mobile second) - Content + Visual */}
            <div className="order-2 lg:order-1 space-y-4">
              {/* Pill tag */}
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200">
                <CheckCircle2 className="h-3 w-3" />
                LoanSetu · GovTech Verified
              </div>

              {/* Heading */}
              <h1 className="text-2xl font-bold text-neutral-900 lg:text-3xl">
                Sign in to verify loan assets securely.
              </h1>

              {/* Description */}
              <div className="space-y-2 text-neutral-700">
                <p className="text-sm leading-relaxed">
                  LoanSetu helps State Agencies and Banks verify loan utilization with geo-tagged, time-stamped evidence validated by AI.
                </p>
                <p className="text-xs leading-relaxed text-neutral-600">
                  Eliminate costly field visits and reduce fraud with instant digital verification.
                </p>
              </div>

              {/* Mini feature chips */}
              <div className="flex flex-wrap gap-2">
                <FeatureChip icon={<Smartphone className="h-3.5 w-3.5" />} text="Mobile number login" />
                <FeatureChip icon={<Wifi className="h-3.5 w-3.5" />} text="Offline capture, later sync" />
                <FeatureChip icon={<CheckCircle2 className="h-3.5 w-3.5" />} text="Remote officer approval" />
              </div>

              {/* Abstract illustration area - smaller */}
              <div className="relative rounded-2xl bg-gradient-to-br from-orange-100/50 via-white to-orange-50 p-6 border border-orange-100/50">
                <div className="relative mx-auto max-w-[200px]">
                  {/* Phone mockup frame */}
                  <div className="relative aspect-[9/19] rounded-2xl border-[3px] border-neutral-200 bg-white shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white p-3">
                      {/* Simulated phone content */}
                      <div className="space-y-2">
                        <div className="h-6 rounded-lg bg-orange-200/50 w-3/4" />
                        <div className="h-16 rounded-lg bg-orange-100/50" />
                        <div className="space-y-1.5">
                          <div className="h-3 rounded bg-neutral-200/50 w-full" />
                          <div className="h-3 rounded bg-neutral-200/50 w-5/6" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-orange-200/30 blur-xl" />
                  <div className="absolute -bottom-3 -left-3 h-20 w-20 rounded-full bg-orange-300/20 blur-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const FeatureChip = ({ icon, text }: { icon: React.ReactNode; text: string }) => {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm border border-neutral-200">
      <span className="text-orange-600">{icon}</span>
      {text}
    </div>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
