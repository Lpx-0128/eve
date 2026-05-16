"use client";

import { Users, Star, CheckCircle, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import RecommendationCard from "@/components/RecommendationCard";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const stats = [
  { icon: Users, label: "Incoming Requests", value: 5, trend: { direction: "up" as const, text: "2 new" } },
  { icon: Star, label: "Expertise Areas", value: 4 },
  { icon: CheckCircle, label: "Connected Startups", value: 3 },
  { icon: Clock, label: "Pending Reviews", value: 2 },
];

const incomingRequests = [
  {
    id: "ir1",
    name: "PayFlow",
    type: "Startup",
    score: 0.91,
    confidence: "high" as const,
    explanation: "Cross-border payments startup perfectly aligned with your fintech expertise and regulatory knowledge.",
  },
  {
    id: "ir2",
    name: "GrowthKit",
    type: "Startup",
    score: 0.84,
    confidence: "high" as const,
    explanation: "B2B SaaS analytics tool at growth stage — your scaling experience from TechCorp is directly relevant.",
  },
  {
    id: "ir3",
    name: "MedAI Solutions",
    type: "Startup",
    score: 0.68,
    confidence: "medium" as const,
    explanation: "Healthcare AI company — moderate overlap with your data science background, lower domain fit.",
  },
];

const expertise = [
  "Fintech & Payments",
  "SaaS Scaling",
  "Product Strategy",
  "Go-to-Market",
];

const connectedStartups = [
  { id: "as1", name: "NeoBank Labs", stage: "Series A", status: "Active mentoring", lastInteraction: "2 days ago" },
  { id: "as2", name: "CloudPay", stage: "Seed", status: "Meeting next week", lastInteraction: "1 week ago" },
  { id: "as3", name: "DataVault", stage: "Pre-seed", status: "Completed", lastInteraction: "3 weeks ago" },
];

export default function MentorDashboard() {
  const handleAccept = (id: string) => console.log("Accept:", id);
  const handleDecline = (id: string) => console.log("Decline:", id);

  return (
    <div>
      <PageHeader
        title="Welcome back, Mentor"
        subtitle="Review incoming match requests and manage your startups."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Incoming Requests */}
        <div className="xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Incoming Match Requests
            </h2>
            {incomingRequests.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map((req, i) => (
                  <RecommendationCard key={req.id} {...req} onAccept={handleAccept} onDecline={handleDecline} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState title="No incoming requests" message="New match requests will appear here." />
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-2 space-y-8">
          {/* Expertise */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              My Expertise
            </h2>
            <div className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm">
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Accepted Startups */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Connected Startups
            </h2>
            <div className="space-y-3">
              {connectedStartups.map((s) => (
                <div key={s.id} className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white font-bold text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-heading font-semibold text-text-primary">{s.name}</p>
                      <p className="text-xs text-text-muted">{s.stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        s.status === "Active mentoring"
                          ? "bg-emerald-50 text-emerald-600"
                          : s.status === "Completed"
                          ? "bg-gray-100 text-text-muted"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-xs text-text-muted">{s.lastInteraction}</span>
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
