"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import {
  IconLayoutDashboard,
  IconClipboardCheck,
  IconFileCheck,
  IconSettings,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface StateOfficerSidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  officerData?: {
    name: string;
    email: string;
    img?: string;
    state?: string;
    designation?: string;
  };
}

export function StateOfficerSidebar({ open, setOpen, officerData }: StateOfficerSidebarProps) {
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
        router.push("/stateofficer/signin");
      } else {
        console.error("Logout failed:", data.message);
        // Still redirect even if API call fails
        router.push("/stateofficer/signin");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Redirect anyway to ensure user is logged out
      router.push("/stateofficer/signin");
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "/stateofficer/dashboard",
      icon: (
        <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Submissions",
      href: "/stateofficer/submissions",
      icon: (
        <IconClipboardCheck className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Approved",
      href: "/stateofficer/approved",
      icon: (
        <IconFileCheck className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Profile",
      href: "/stateofficer/profile",
      icon: (
        <IconUser className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Settings",
      href: "/stateofficer/settings",
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
          {officerData && (
            <SidebarLink
              link={{
                label: officerData.name || "Officer",
                href: "#",
                icon: officerData.img ? (
                  <Image
                    src={officerData.img}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                    width={28}
                    height={28}
                    alt={officerData.name}
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                    {officerData.name?.charAt(0).toUpperCase() || "O"}
                  </div>
                ),
              }}
            />
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
      href="/stateofficer/dashboard"
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
      href="/stateofficer/dashboard"
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
