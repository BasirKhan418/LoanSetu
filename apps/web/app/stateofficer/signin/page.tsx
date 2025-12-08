"use client";
import React, { useState, useRef, useEffect } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import Image from "next/image";
import Navbar from "../../../components/navbar";
import { Smartphone, Wifi, CheckCircle2, Loader2, Mail, Shield, ArrowLeft, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StateOfficerSignIn() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateOtp = (otpArray: string[]): boolean => {
    const otpString = otpArray.join("");
    return otpString.length === 6 && /^\d+$/.test(otpString);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    otpRefs.current[focusIndex]?.focus();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      const response = await fetch("/api/stateofficerauth", {
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
        setResendTimer(60);
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
    
    // If OTP field is not shown, trigger Send OTP instead
    if (!showOtpField) {
      handleSendOtp(e);
      return;
    }
    
    setError("");
    setSuccess("");

    const otpString = otp.join("");
    if (!otpString.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (!validateOtp(otp)) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/stateofficerauth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpString.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.token) {
          document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
        
        setSuccess("Login successful! Verifying credentials...");
        setError("");
        
        try {
          const verifyResponse = await fetch("/api/verify", {
            method: "GET",
            credentials: "include",
          });
          
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success && verifyData.type === "stateofficer") {
            if (!verifyData.data.isVerified) {
              setError("Your account is not verified. Please contact your administrator.");
              setLoading(false);
              return;
            }
            
            if (!verifyData.data.isActive) {
              setError("Your account is inactive. Please contact your administrator.");
              setLoading(false);
              return;
            }
            
            setTimeout(() => {
              router.push("/stateofficer/dashboard");
            }, 500);
          } else {
            setError("Authentication verification failed. Please try again.");
            setLoading(false);
            return;
          }
        } catch (verifyErr) {
          console.error("Error verifying token:", verifyErr);
          setError("Verification failed. Please try again.");
          setLoading(false);
          return;
        }
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Error validating OTP:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowOtpField(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccess("");
    setResendTimer(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <section className="px-4 mt-5 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 items-center">
            
            <div className="order-1 lg:order-2 flex justify-start lg:justify-end">
              <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg border border-neutral-100 lg:p-6">
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
                  {showOtpField && (
                    <button
                      onClick={handleBack}
                      className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200">
                      {showOtpField ? (
                        <Shield className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Mail className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-800">
                        {showOtpField ? "Verify OTP" : "State Officer Sign In"}
                      </h2>
                      <p className="text-xs text-neutral-600">
                        {showOtpField 
                          ? `Code sent to ${email}`
                          : "Use your registered email address"}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 font-bold">✕</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  {!showOtpField ? (
                    <>
                      <LabelInputContainer className="mb-4">
                        <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          placeholder="officer@example.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          required
                          autoComplete="email"
                          className="h-11"
                        />
                      </LabelInputContainer>

                      <button
                        onClick={handleSendOtp}
                        className="mb-4 h-11 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        type="button"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="h-5 w-5" />
                            <span>Send OTP</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mb-5">
                        <Label htmlFor="otp-0" className="text-sm font-medium text-neutral-700 mb-3 block">
                          Enter the 6-digit OTP
                        </Label>
                        <div className="flex gap-2 justify-between">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => {
                                otpRefs.current[index] = el;
                              }}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              onPaste={index === 0 ? handleOtpPaste : undefined}
                              disabled={loading}
                              className="w-12 h-14 text-center text-xl font-semibold border-2 border-neutral-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                              autoComplete="off"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        className="mb-3 h-11 w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        type="submit"
                        disabled={loading || !validateOtp(otp)}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-5 w-5" />
                            <span>Submit</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSendOtp}
                        className="mb-3 h-10 w-full rounded-lg bg-white border border-neutral-300 font-medium text-neutral-700 text-sm transition-all hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        type="button"
                        disabled={loading || resendTimer > 0}
                      >
                        {resendTimer > 0 ? (
                          <span>Resend OTP in {resendTimer}s</span>
                        ) : (
                          <span>Resend OTP</span>
                        )}
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
                    For verified state officers only
                  </p>
                </div>
              </div>
            </div>

            <div className="order-2 lg:order-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200">
                <UserCircle className="h-3 w-3" />
                State Officer Portal
              </div>

              <h1 className="text-2xl font-bold text-neutral-900 lg:text-3xl">
                Review and approve loan submissions securely.
              </h1>

              <div className="space-y-2 text-neutral-700">
                <p className="text-sm leading-relaxed">
                  Access the state officer dashboard to review loan applications, verify submitted evidence, and approve or reject submissions.
                </p>
                <p className="text-xs leading-relaxed text-neutral-600">
                  Streamlined workflow with geo-tagged verification and AI-powered validation.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <FeatureChip icon={<Shield className="h-3.5 w-3.5" />} text="Secure OTP login" />
                <FeatureChip icon={<CheckCircle2 className="h-3.5 w-3.5" />} text="Quick approval workflow" />
                <FeatureChip icon={<Smartphone className="h-3.5 w-3.5" />} text="Mobile-friendly interface" />
              </div>

              <div className="relative rounded-2xl bg-gradient-to-br from-orange-100/50 via-white to-orange-50 p-6 border border-orange-100/50">
                <div className="relative mx-auto max-w-[200px]">
                  <div className="relative aspect-[9/19] rounded-2xl border-[3px] border-neutral-200 bg-white shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white p-3">
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
