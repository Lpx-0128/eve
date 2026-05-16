"use client";

import { Users, GraduationCap, Building2, TrendingUp, Zap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import RecommendationCard from "@/components/RecommendationCard";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

// Mock data for demo
const stats = [
  { icon: Users, label: "Participants", value: 42, trend: { direction: "up" as const, text: "12%" } },
  { icon: GraduationCap, label: "Mentors", value: 18, trend: { direction: "up" as const, text: "8%" } },
  { icon: Building2, label: "Sponsors", value: 7 },
  { icon: TrendingUp, label: "Match Rate", value: "86%", trend: { direction: "up" as const, text: "5%" } },
];

const pendingMatches = [
  {
    id: "m1",
    name: "Sarah Chen",
    type: "Mentor → Startup",
    score: 0.92,
    confidence: "high" as const,
    explanation: "Deep expertise in fintech payments directly aligns with PayFlow's Series A focus on cross-border payment infrastructure.",
  },
  {
    id: "m2",
    name: "Marcus Rodriguez",
    type: "Mentor → Startup",
    score: 0.85,
    confidence: "high" as const,
    explanation: "10+ years of SaaS scaling experience matches GrowthKit's current growth stage and GTM challenges.",
  },
  {
    id: "m3",
    name: "Aiko Tanaka",
    type: "Sponsor → Programme",
    score: 0.78,
    confidence: "medium" as const,
    explanation: "Corporate innovation mandate aligns with the Healthcare AI programme's sustainability goals.",
  },
];

const programmes = [
  { id: "p1", name: "Fintech Accelerator Q2", participants: 24, mentors: 8, status: "active" },
  { id: "p2", name: "Healthcare AI Cohort", participants: 18, mentors: 6, status: "active" },
  { id: "p3", name: "Climate Tech Sprint", participants: 12, mentors: 4, status: "draft" },
];

export default function OrganiserDashboard() {
  const handleAccept = (id: string) => {
    console.log("Accept match:", id);
  };

  const handleDecline = (id: string) => {
    console.log("Decline match:", id);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <PageHeader
        title={`${greeting()}, Organiser`}
        subtitle="Here's an overview of your ecosystem today."
        action={
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 shadow-md transition-opacity cursor-pointer">
            <Zap size={16} />
            Generate Matches
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Pending Matches */}
        <div className="xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Pending Matches
            </h2>
            {pendingMatches.length > 0 ? (
              <div className="space-y-4">
                {pendingMatches.map((match, i) => (
                  <RecommendationCard
                    key={match.id}
                    {...match}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No pending matches"
                message="Click 'Generate Matches' to create new recommendations."
              />
            )}
          </motion.div>
        </div>

        {/* Active Programmes */}
        <div className="xl:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Active Programmes
            </h2>
            <div className="space-y-3">
              {programmes.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold text-text-primary text-sm">
                      {prog.name}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        prog.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-text-muted"
                      }`}
                    >
                      {prog.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {prog.participants} participants
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap size={12} /> {prog.mentors} mentors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
