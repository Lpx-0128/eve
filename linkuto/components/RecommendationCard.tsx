"use client";

import { motion } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";

export interface RecommendationCardProps {
  id: string;
  name: string;
  type: string;
  score: number;
  confidence: "high" | "medium" | "low";
  explanation: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isProcessing?: boolean;
  index?: number;
}

export default function RecommendationCard({
  id,
  name,
  type,
  score,
  confidence,
  explanation,
  onAccept,
  onDecline,
  isProcessing = false,
  index = 0,
}: RecommendationCardProps) {
  const scorePercentage = Math.round(score * 100);

  const badgeStyles = {
    high: "bg-emerald-50 text-emerald-600 border-emerald-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    low: "bg-rose-50 text-rose-500 border-rose-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-card-bg rounded-2xl border border-border-warm shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      data-testid="recommendation-card"
    >
      <div className="p-5 flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white font-heading font-bold text-base">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-base font-heading font-semibold text-text-primary truncate">
              {name}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles[confidence]}`}
            >
              {scorePercentage}%
            </span>
          </div>

          <p className="text-xs font-medium text-text-muted capitalize mb-3">
            {type}
          </p>

          <div className="bg-bg-base rounded-xl p-3">
            <div className="flex gap-2 items-start">
              <Sparkles size={14} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-primary/80 font-body leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-border-warm flex justify-end gap-2">
        <button
          onClick={() => onDecline(id)}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-border-warm rounded-xl text-sm font-medium text-text-muted bg-card-bg hover:bg-bg-base hover:text-text-primary disabled:opacity-50 transition-all cursor-pointer"
        >
          <X size={14} />
          Decline
        </button>
        <button
          onClick={() => onAccept(id)}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
        >
          <Check size={14} />
          Accept
        </button>
      </div>
    </motion.div>
  );
}
