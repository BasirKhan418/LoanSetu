"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../components/navbar";
import { Shield, Building2, UserCircle, ChevronRight, CheckCircle2 } from "lucide-react";

const roles = [
  {
    id: "admin",
    title: "Admin",
    description: "State administrators managing officers and tenants",
    icon: Shield,
    path: "/admin/signin",
    gradient: "from-orange-500 to-orange-600",
    bgGradient: "from-orange-50 to-orange-100/50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: "officer",
    title: "State Officer",
    description: "Field officers reviewing and approving submissions",
    icon: UserCircle,
    path: "/stateofficer/signin",
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100/50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "bank",
    title: "Bank Officer",
    description: "Banking officials managing loan verification",
    icon: Building2,
    path: "/bank/signin",
    gradient: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-50 to-purple-100/50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

export default function SignInSelector() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const handleRoleSelect = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <section className="px-4 mt-5 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 border border-orange-200 mb-4">
              <CheckCircle2 className="h-3 w-3" />
              LoanSetu · Secure Authentication
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
              Select Your Role
            </h1>
            
            <p className="text-neutral-600 text-sm md:text-base max-w-2xl mx-auto">
              Choose your role to access the LoanSetu platform. Each role has specific permissions and access levels.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {roles.map((role) => {
              const Icon = role.icon;
              const isHovered = hoveredRole === role.id;
              
              return (
                <div
                  key={role.id}
                  onMouseEnter={() => setHoveredRole(role.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  onClick={() => handleRoleSelect(role.path)}
                  className={`
                    relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300
                    ${isHovered 
                      ? 'border-transparent shadow-xl -translate-y-1 scale-[1.02]' 
                      : 'border-neutral-200 shadow-sm hover:border-neutral-300'
                    }
                  `}
                  style={{
                    background: isHovered 
                      ? `linear-gradient(to br, var(--tw-gradient-stops))` 
                      : 'white'
                  }}
                >
                  {/* Gradient Overlay when hovered */}
                  {isHovered && (
                    <div 
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.bgGradient} opacity-90 -z-10`}
                    />
                  )}
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`
                      inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-all
                      ${isHovered ? 'bg-white/90 shadow-lg' : role.iconBg}
                    `}>
                      <Icon className={`h-7 w-7 ${role.iconColor}`} />
                    </div>

                    {/* Title & Description */}
                    <h3 className={`
                      text-xl font-bold mb-2 transition-colors
                      ${isHovered ? 'text-neutral-900' : 'text-neutral-800'}
                    `}>
                      {role.title}
                    </h3>
                    
                    <p className={`
                      text-sm mb-4 transition-colors
                      ${isHovered ? 'text-neutral-700' : 'text-neutral-600'}
                    `}>
                      {role.description}
                    </p>

                    {/* Action Button */}
                    <div className={`
                      inline-flex items-center gap-2 text-sm font-medium transition-all
                      ${isHovered ? 'text-neutral-900' : role.iconColor}
                    `}>
                      <span>Continue</span>
                      <ChevronRight className={`
                        h-4 w-4 transition-transform
                        ${isHovered ? 'translate-x-1' : ''}
                      `} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
            <InfoCard 
              title="Secure Login"
              description="Email OTP-based authentication for maximum security"
            />
            <InfoCard 
              title="Role-Based Access"
              description="Each role has specific permissions and dashboards"
            />
            <InfoCard 
              title="24/7 Support"
              description="Get help anytime with our dedicated support team"
            />
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-xs text-neutral-500">
              Having trouble accessing your account?{" "}
              <a
                href="#support"
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const InfoCard = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-white border border-neutral-200">
      <h4 className="font-semibold text-neutral-800 text-sm mb-1">{title}</h4>
      <p className="text-xs text-neutral-600">{description}</p>
    </div>
  );
};
