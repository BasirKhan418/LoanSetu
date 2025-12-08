"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import {
  IconLayoutDashboard,
  IconFileAnalytics,
  IconCreditCard,
  IconSettings,
  IconLogout,
  IconBuildingBank,
  IconFileDescription,
  IconUpload,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BankSidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bankData?: {
    name: string;
    branchName?: string;
    contactName?: string;
    contactEmail?: string;
    ifsc?: string;
  };
}

export function BankSidebar({ open, setOpen, bankData }: BankSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        router.push("/bank/signin");
      } else {
        console.error("Logout failed:", data.message);
        // Still redirect even if API call fails
        router.push("/bank/signin");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Redirect anyway to ensure user is logged out
      router.push("/bank/signin");
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "/bank/dashboard",
      icon: (
        <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Loan Products",
      href: "/bank/loan-details",
      icon: (
        <IconFileDescription className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Active Loans",
      href: "/bank/bulk-upload",
      icon: (
        <IconCreditCard className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Verification Reports",
      href: "/bank/reports",
      icon: (
        <IconFileAnalytics className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Bank Profile",
      href: "/bank/profile",
      icon: (
        <IconBuildingBank className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Settings",
      href: "/bank/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-4">
          {bankData && (
            <div className="px-2 py-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                  {bankData.contactName?.charAt(0).toUpperCase() || "B"}
                </div>
                {open && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-neutral-800 truncate">
                      {bankData.contactName || "Bank Officer"}
                    </span>
                    {bankData.branchName && (
                      <span className="text-xs text-neutral-500 truncate">
                        {bankData.branchName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left mt-2 hover:bg-neutral-100 rounded-lg px-2 transition-colors"
          >
            <IconLogout className="h-5 w-5 shrink-0 text-red-600" />
            <motion.span
              animate={{
                display: open ? "inline-block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="text-red-600 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
            >
              Logout
            </motion.span>
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const Logo = () => {
  return (
    <a
      href="/bank/dashboard"
      className="relative z-20 flex items-center space-x-3 py-1 text-sm font-normal"
    >
      <Image
        src="/logo.png"
        alt="LoanSetu Logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-xl whitespace-pre bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent"
      >
        LoanSetu
      </motion.span>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="/bank/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1"
    >
      <Image
        src="/logo.png"
        alt="LoanSetu Logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0"
      />
    </a>
  );
};
