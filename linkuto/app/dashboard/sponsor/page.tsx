"use client";

import { Building2, Rocket, MessageSquare, Handshake } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import RecommendationCard from "@/components/RecommendationCard";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const stats = [
  { icon: Rocket, label: "Startup Matches", value: 6, trend: { direction: "up" as const, text: "3 new" } },
  { icon: MessageSquare, label: "Feedback Items", value: 4 },
  { icon: Handshake, label: "Active Partnerships", value: 2 },
  { icon: Building2, label: "Programmes Joined", value: 1 },
];

const incomingMatches = [
  {
    id: "sm1",
    name: "PayFlow",
    type: "Startup",
    score: 0.89,
    confidence: "high" as const,
    explanation: "Fintech payments startup with strong traction — aligns with your corporate innovation mandate in digital finance.",
  },
  {
    id: "sm2",
    name: "GreenTech Labs",
    type: "Startup",
    score: 0.82,
    confidence: "high" as const,
    explanation: "Climate-tech company developing carbon tracking SaaS — fits your sustainability investment thesis.",
  },
  {
    id: "sm3",
    name: "HealthPulse AI",
    type: "Startup",
    score: 0.65,
    confidence: "medium" as const,
    explanation: "Healthcare AI startup — moderate strategic fit with your digital transformation portfolio.",
  },
];

const feedbackLog = [
  { id: "f1", text: "PayFlow team demonstrated strong pivot capability during Q1 review.", date: "May 14, 2026" },
  { id: "f2", text: "NeoBank Labs completed milestone 3 ahead of schedule.", date: "May 10, 2026" },
  { id: "f3", text: "GreenTech Labs needs additional support on regulatory compliance.", date: "May 7, 2026" },
  { id: "f4", text: "CloudPay's monthly user growth exceeded projections by 40%.", date: "May 2, 2026" },
];

const companyProfile = {
  name: "Innovate Corp",
  website: "https://innovatecorp.example.com",
  sector: "Technology & Innovation",
  focus: ["Fintech", "Climate Tech", "Healthcare AI"],
  description: "Global innovation hub sponsoring early-stage startups in key verticals.",
};

const acceptedStartups = [
  { id: "a1", name: "NeoBank Labs", programme: "Fintech Accelerator Q2", status: "Active", since: "Mar 2026" },
  { id: "a2", name: "CloudPay", programme: "Fintech Accelerator Q2", status: "Active", since: "Apr 2026" },
];

export default function SponsorDashboard() {
  const handleAccept = (id: string) => console.log("Accept:", id);
  const handleDecline = (id: string) => console.log("Decline:", id);

  return (
    <div>
      <PageHeader
        title="Welcome back, Sponsor"
        subtitle="Discover startups that align with your strategic goals."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Incoming Startup Matches */}
        <div className="xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Incoming Startup Matches
            </h2>
            {incomingMatches.length > 0 ? (
              <div className="space-y-4">
                {incomingMatches.map((m, i) => (
                  <RecommendationCard key={m.id} {...m} onAccept={handleAccept} onDecline={handleDecline} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState title="No incoming matches" message="New startup matches will appear here." />
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-2 space-y-8">
          {/* Company Profile */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Company Profile
            </h2>
            <div className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white font-bold text-sm">
                  {companyProfile.name.charAt(0)}
                </div>
                <div>
                  <p className="font-heading font-semibold text-text-primary">{companyProfile.name}</p>
                  <p className="text-xs text-text-muted">{companyProfile.sector}</p>
                </div>
              </div>
              <p className="text-sm text-text-muted mb-4">{companyProfile.description}</p>
              <div className="flex flex-wrap gap-2">
                {companyProfile.focus.map((f) => (
                  <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feedback & Progress */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Feedback & Progress
            </h2>
            <div className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm">
              <ul className="space-y-4">
                {feedbackLog.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm text-text-primary font-body leading-relaxed">{item.text}</p>
                      <p className="text-xs text-text-muted mt-1">{item.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
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
              Accepted Startups
            </h2>
            {acceptedStartups.length > 0 ? (
              <div className="space-y-3">
                {acceptedStartups.map((s) => (
                  <div key={s.id} className="bg-card-bg rounded-2xl p-5 border border-border-warm shadow-sm flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white font-bold text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-semibold text-text-primary">{s.name}</p>
                      <p className="text-xs text-text-muted">{s.programme} · Since {s.since}</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No accepted startups" message="Accept a match to begin a partnership." />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
