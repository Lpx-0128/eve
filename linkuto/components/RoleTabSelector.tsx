"use client";

import { motion } from "framer-motion";
import { Rocket, GraduationCap, Building2, LayoutGrid } from "lucide-react";

export type RoleType = "participant" | "mentor" | "sponsor" | "organiser";

interface RoleTabSelectorProps {
  activeRole: RoleType;
  onRoleChange: (role: RoleType) => void;
}

const roles = [
  { id: "participant", label: "Startup", icon: Rocket },
  { id: "mentor", label: "Mentor", icon: GraduationCap },
  { id: "sponsor", label: "Sponsor", icon: Building2 },
  { id: "organiser", label: "Organiser", icon: LayoutGrid },
] as const;

export default function RoleTabSelector({ activeRole, onRoleChange }: RoleTabSelectorProps) {
  return (
    <div className="flex w-full space-x-1 rounded-xl bg-gray-100/50 p-1 mb-8 overflow-x-auto">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = activeRole === role.id;

        return (
          <button
            key={role.id}
            onClick={() => onRoleChange(role.id)}
            className={`
              relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none
              ${isActive ? "text-accent" : "text-text-muted hover:text-text-primary hover:bg-gray-100"}
            `}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              <motion.div
                layoutId="active-role-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm border border-gray-200"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              <Icon size={16} className={isActive ? "text-accent" : "text-text-muted"} />
              {role.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
