"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useCallback, useRef } from "react";

interface EdgePopoverProps {
  data: {
    rriScore: number;
    confidence: string;
    explanation: string;
    sourceName?: string;
    targetName?: string;
  } | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export default function EdgePopover({ data, position, onClose }: EdgePopoverProps) {
  const isOpen = !!data && !!position;
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Delay click listener to avoid immediate close from the edge click
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen || !data || !position) return null;

  const rri = data.rriScore;

  // Clamp position to stay in viewport
  const clampedX = Math.min(Math.max(position.x - 150, 12), window.innerWidth - 320);
  const clampedY = Math.min(Math.max(position.y - 10, 12), window.innerHeight - 200);

  const confidenceColor =
    data.confidence === "high"
      ? { bg: "rgba(52,211,153,0.15)", text: "#34D399" }
      : data.confidence === "medium"
        ? { bg: "rgba(251,191,36,0.15)", text: "#FBBF24" }
        : { bg: "rgba(239,68,68,0.15)", text: "#F87171" };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: clampedX,
          top: clampedY,
          zIndex: 80,
          width: 300,
          background: "linear-gradient(180deg, rgba(15,20,40,0.95), rgba(11,17,32,0.98))",
          border: "1px solid rgba(100,116,139,0.2)",
          borderRadius: 14,
          padding: 20,
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(6,182,212,0.08)",
        }}
      >
        {/* Header: score + confidence */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color="#06B6D4" />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              }}
            >
              Relationship Score
            </span>
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "2px 8px",
              borderRadius: 6,
              background: confidenceColor.bg,
              color: confidenceColor.text,
            }}
          >
            {data.confidence}
          </span>
        </div>

        {/* RRI Score display */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: rri >= 0.75 ? "#67E8F9" : rri >= 0.5 ? "#E2E8F0" : "#94A3B8",
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              lineHeight: 1,
            }}
          >
            {(rri * 100).toFixed(1)}
            <span style={{ fontSize: 16, color: "#64748B" }}>%</span>
          </div>

          {/* Score bar */}
          <div
            style={{
              marginTop: 10,
              height: 4,
              borderRadius: 2,
              background: "rgba(100,116,139,0.15)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rri * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: 2,
                background:
                  rri >= 0.75
                    ? "linear-gradient(90deg, #06B6D4, #0EA5E9)"
                    : rri >= 0.5
                      ? "linear-gradient(90deg, #94A3B8, #CBD5E1)"
                      : "linear-gradient(90deg, #64748B, #94A3B8)",
              }}
            />
          </div>
        </div>

        {/* Names */}
        {(data.sourceName || data.targetName) && (
          <div
            style={{
              fontSize: 11,
              color: "#94A3B8",
              textAlign: "center",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            {data.sourceName || "Source"}{" "}
            <span style={{ color: "#475569" }}>↔</span>{" "}
            {data.targetName || "Target"}
          </div>
        )}

        {/* Explanation */}
        <div
          style={{
            background: "rgba(100,116,139,0.08)",
            border: "1px solid rgba(100,116,139,0.12)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <p style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5, margin: 0 }}>
            &ldquo;{data.explanation}&rdquo;
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
