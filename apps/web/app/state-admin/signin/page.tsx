"use client";
import React, { useState } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import Image from "next/image";

export default function StateAdminSignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted", formData);
    // Handle sign in logic here
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="pt-12 px-4 sm:px-6 lg:px-6">
        <div className="relative max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-600 via-orange-600 to-orange-500 ring-1 ring-white/60 shadow-[0_15px_40px_rgba(0,0,0,0.15)]">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-[8%] top-[10%] h-[540px] w-[540px] rounded-full border border-white/15" />
              <div className="absolute right-[15%] top-[16%] h-[420px] w-[420px] rounded-full border border-white/10" />
              <div className="absolute right-[22%] top-[22%] h-[300px] w-[300px] rounded-full border border-white/10" />
            </div>

            <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center px-6 sm:px-10 lg:px-14 pt-10 sm:pt-14 lg:pt-16 pb-28 sm:pb-36 lg:pb-44 min-h-[420px] sm:min-h-[600px] lg:min-h-[680px]">
              {/* Left side - Sign in form */}
              <div className="z-10 flex items-center justify-center lg:justify-start">
                <div className="shadow-input w-full max-w-md rounded-2xl bg-white p-6 md:p-8 dark:bg-black">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">
                      State Admin Sign In
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      Access your dashboard to manage loan verifications
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <LabelInputContainer className="mb-4">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        placeholder="admin@state.gov"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </LabelInputContainer>

                    <LabelInputContainer className="mb-6">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </LabelInputContainer>

                    <div className="mb-6 flex items-center justify-between text-sm">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-neutral-600 dark:text-neutral-300">
                          Remember me
                        </span>
                      </label>
                      <a
                        href="#"
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <button
                      className="group/btn relative block h-12 w-full rounded-full bg-gradient-to-br from-orange-600 to-orange-500 font-extrabold text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      type="submit"
                    >
                      Sign In
                      <BottomGradient />
                    </button>

                    <div className="my-6 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                    <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                      Don&apos;t have an account?{" "}
                      <a
                        href="#"
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                      >
                        Contact your administrator
                      </a>
                    </p>
                  </form>
                </div>
              </div>

              {/* Right side - Visual element */}
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

                {/* Spinning badge */}
                <div className="absolute right-6 lg:right-10 bottom-24 hidden md:block">
                  <svg
                    className="spin-slower"
                    width="140"
                    height="140"
                    viewBox="0 0 140 140"
                    fill="none"
                  >
                    <defs>
                      <path
                        id="circlePath"
                        d="M70,70 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"
                      />
                    </defs>
                    <circle
                      cx="70"
                      cy="70"
                      r="56"
                      stroke="white"
                      strokeOpacity="0.25"
                      strokeWidth="2"
                    />
                    <text
                      fill="#fff"
                      fontSize="12"
                      fontWeight="700"
                      letterSpacing="2"
                    >
                      <textPath href="#circlePath">
                        {" "}
                        ADMIN • SECURE • ADMIN • SECURE •{" "}
                      </textPath>
                    </text>
                    <circle cx="70" cy="70" r="6" fill="#fff" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom left card */}
            <div className="absolute left-6 sm:left-8 bottom-6 sm:bottom-8 hidden md:block">
              <div className="rounded-2xl bg-black/90 text-white p-5 sm:p-6 shadow-xl border border-white/10 w-[260px]">
                <p className="text-xl font-extrabold leading-snug">
                  Secure Access
                  <br />
                  Control Panel
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-gray-900">
                  PROTECTED LOGIN
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-900"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
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
