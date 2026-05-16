"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Bell, Lock, Mail, ShieldAlert, LogOut, Check } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SettingsPage() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState({
    emailMatches: true,
    emailProgrammes: true,
    pushAlerts: false,
  });

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

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
        checked ? "bg-accent" : "bg-border-warm"
      }`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
        checked ? "translate-x-6" : "translate-x-0"
      }`} />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-base text-text-muted font-body">
          Manage your account and notification preferences.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Notifications Section */}
        <motion.section variants={itemVariants} className="bg-card-bg rounded-[2rem] p-6 md:p-8 border border-border-warm shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Bell size={20} />
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-sm">New Matches (Email)</h3>
                <p className="text-xs text-text-muted">Get notified when a strong RRI match is found</p>
              </div>
              <ToggleSwitch 
                checked={notifications.emailMatches} 
                onChange={() => setNotifications(prev => ({ ...prev, emailMatches: !prev.emailMatches }))} 
              />
            </div>
            <hr className="border-border-warm" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-sm">Programme Announcements</h3>
                <p className="text-xs text-text-muted">Updates from cohorts you are participating in</p>
              </div>
              <ToggleSwitch 
                checked={notifications.emailProgrammes} 
                onChange={() => setNotifications(prev => ({ ...prev, emailProgrammes: !prev.emailProgrammes }))} 
              />
            </div>
          </div>
        </motion.section>

        {/* Account Danger Zone */}
        <motion.section variants={itemVariants} className="bg-card-bg rounded-[2rem] p-6 md:p-8 border border-red-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <ShieldAlert size={20} />
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary">Account Access</h2>
          </div>
          
          <div className="space-y-4 relative z-10">
            <button 
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border-warm font-semibold text-sm text-text-primary hover:bg-bg-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} /> Sign Out of All Devices
            </button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
