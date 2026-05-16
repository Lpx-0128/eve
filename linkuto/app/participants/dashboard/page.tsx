"use client";

import { CheckCircle, GraduationCap, FolderKanban, Handshake } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import RecommendationCard from "@/components/RecommendationCard";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const stats = [
  { icon: CheckCircle, label: "Profile Completion", value: "75%" },
  { icon: GraduationCap, label: "Mentor Matches", value: 3, trend: { direction: "up" as const, text: "New" } },
  { icon: FolderKanban, label: "Programmes", value: 2 },
  { icon: Handshake, label: "Accepted Matches", value: 1 },
];

const recommendedMentors = [
  {
    id: "rm1",
    name: "Dr. Emily Park",
    type: "Mentor",
    score: 0.94,
    confidence: "high" as const,
    explanation: "PhD in machine learning with 8 years advising early-stage AI startups on product-market fit.",
  },
  {
    id: "rm2",
    name: "James Worthington",
    type: "Mentor",
    score: 0.87,
    confidence: "high" as const,
    explanation: "Serial entrepreneur with two successful B2B SaaS exits. Strong network in enterprise sales.",
  },
  {
    id: "rm3",
    name: "Priya Sharma",
    type: "Mentor",
    score: 0.76,
    confidence: "medium" as const,
    explanation: "VC partner focused on Southeast Asian markets. Can help with regional expansion strategy.",
  },
];

const recommendedProgrammes = [
  { id: "rp1", name: "Fintech Accelerator Q2", fit: 92, description: "12-week accelerator for payment and banking startups." },
  { id: "rp2", name: "AI Founders Bootcamp", fit: 85, description: "Intensive 4-week programme for AI-first companies." },
  { id: "rp3", name: "Global Scale-Up Track", fit: 71, description: "Cross-border expansion support for Series A+ startups." },
];

const acceptedMatches = [
  { id: "am1", name: "Sarah Chen", role: "Mentor", status: "Meeting scheduled", date: "May 20, 2026" },
];

import { useProfile } from "@/lib/useProfile";

export default function ParticipantDashboard() {
  const handleAccept = (id: string) => console.log("Accept:", id);
  const handleDecline = (id: string) => console.log("Decline:", id);
  const { profileName, loading } = useProfile();

  return (
    <div>
      <PageHeader
        title={loading ? "Welcome back..." : `Welcome back, ${profileName || "Startup"}`}
        subtitle="Your ecosystem connections and recommended matches."
      />

      {/* Profile Completion Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-heading font-semibold text-text-primary">Profile Completion</p>
          <span className="text-sm font-heading font-bold text-accent">75%</span>
        </div>
        <div className="w-full h-2.5 bg-bg-base rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "75%" }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-accent to-gradient-end rounded-full"
          />
        </div>
        <p className="text-xs text-text-muted mt-2">Complete your profile to improve match quality.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Recommended Mentors */}
        <div className="xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Recommended Mentors
            </h2>
            <div className="space-y-4">
              {recommendedMentors.map((m, i) => (
                <RecommendationCard key={m.id} {...m} onAccept={handleAccept} onDecline={handleDecline} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-2 space-y-8">
          {/* Recommended Programmes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Recommended Programmes
            </h2>
            <div className="space-y-3">
              {recommendedProgrammes.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-semibold text-text-primary text-sm">{prog.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                      {prog.fit}% fit
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{prog.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Accepted Matches */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Accepted Matches
            </h2>
            {acceptedMatches.length > 0 ? (
              <div className="space-y-3">
                {acceptedMatches.map((am) => (
                  <div key={am.id} className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white font-bold text-sm">
                      {am.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-semibold text-text-primary">{am.name}</p>
                      <p className="text-xs text-text-muted">{am.role} · {am.status}</p>
                    </div>
                    <span className="text-xs text-accent font-medium">{am.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No accepted matches" message="Accept a recommendation to get started." />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
