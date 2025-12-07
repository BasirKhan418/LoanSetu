"use client";
import React, { useState } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import Image from "next/image";
import Navbar from "../../../components/navbar";
import { Smartphone, Wifi, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StateAdminSignIn() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // OTP validation
  const validateOtp = (otp: string): boolean => {
    return otp.length === 6 && /^\d+$/.test(otp);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/adminauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          type: "login",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowOtpField(true);
        setSuccess("OTP sent successfully! Please check your email.");
        setError("");
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate OTP
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (!validateOtp(otp)) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/adminauth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in cookie/localStorage if needed
        if (data.token) {
          document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
        }
        
        setSuccess("Login successful! Redirecting...");
        setError("");
        
        // Redirect to admin dashboard
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 1000);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error validating OTP:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
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
                    Admin Sign In
                  </h2>
                  <p className="mt-1 text-xs text-neutral-600">
                    Use your registered email address to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Error Message */}
                  {error && (
                    <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="mb-3 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  <LabelInputContainer className="mb-3">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      placeholder="admin@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={showOtpField || loading}
                      required
                      autoComplete="email"
                    />
                  </LabelInputContainer>

                  {!showOtpField ? (
                    <button
                      onClick={handleSendOtp}
                      className="mb-3 h-10 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                      type="button"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
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
                          disabled={loading}
                          required
                          autoComplete="one-time-code"
                        />
                      </LabelInputContainer>

                      <button
                        className="mb-3 h-10 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Continue"
                        )}
                      </button>

                      <button
                        onClick={handleSendOtp}
                        className="mb-3 h-9 w-full rounded-lg bg-neutral-100 font-medium text-neutral-700 text-sm transition-all hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        type="button"
                        disabled={loading}
                      >
                        Resend OTP
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
                <FeatureChip icon={<Smartphone className="h-3.5 w-3.5" />} text="Secure email OTP login" />
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
