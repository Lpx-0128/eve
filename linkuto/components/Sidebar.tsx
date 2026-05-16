"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Sparkles,
  GitBranch,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const navItems = [
  { label: "Programmes", icon: FolderKanban, href: "/programmes" },
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "My Profile", icon: User, href: "/profile" },
  { label: "Recommendations", icon: Sparkles, href: "/recommendations" },
  { label: "Graph", icon: GitBranch, href: "/graph" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = "firebase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user-role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ color: "#FFFFFF" }}>
      {/* Logo & Collapse Toggle */}
      <div className="flex items-center justify-between px-5 pt-7 pb-8">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-heading font-bold tracking-[0.25em]"
              style={{ color: "#FFFFFF" }}
            >
              LINKUTO
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.startsWith("/dashboard") &&
              pathname.startsWith("/dashboard") &&
              item.label === "Dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                collapsed ? "justify-center" : ""
              }`}
              style={{
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                borderLeft: isActive ? "3px solid #06B6D4" : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={20}
                className="flex-shrink-0"
                style={{ color: isActive ? "#06B6D4" : "rgba(255,255,255,0.7)" }}
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 pb-6 pt-4 mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #06B6D4, rgba(255,255,255,0.3))",
                color: "#FFFFFF",
              }}
            >
              D
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
                    Dev User
                  </p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Organiser
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout Button */}
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-red-500/20 hover:text-red-400 text-white/50 cursor-pointer"
                title="Sign out"
              >
                <LogOut size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl shadow-lg cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #736278, #00508B)",
          color: "#FFFFFF",
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[260px] lg:hidden sidebar-gradient"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-4 p-1 cursor-pointer"
                style={{ color: "rgba(255,255,255,0.7)" }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 sidebar-gradient"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
