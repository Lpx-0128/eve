"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; text: string };
  index?: number;
}

export default function StatCard({ icon: Icon, label, value, trend, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card-bg rounded-2xl p-6 shadow-sm border border-border-warm hover:shadow-md transition-shadow cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-accent/10 rounded-xl">
          <Icon size={20} className="text-accent" />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend.direction === "up"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.text}
          </span>
        )}
      </div>
      <p className="text-3xl font-heading font-bold text-text-primary mb-1">{value}</p>
      <p className="text-sm text-text-muted font-body">{label}</p>
    </motion.div>
  );
}
