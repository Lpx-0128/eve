"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Globe, Brain, Sparkles } from "lucide-react";
import { useEffect, useCallback } from "react";

interface EntityDetailPanelProps {
  entity: any | null;
  edges: any[];
  onClose: () => void;
}

export default function EntityDetailPanel({ entity, edges, onClose }: EntityDetailPanelProps) {
  const isOpen = !!entity;
  const isMentor = entity?.type?.toLowerCase() === "mentor";

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Get connections for this entity, sorted by RRI
  const connections = edges
    .filter(
      (e) =>
        e.targetId === `ent-${entity?.id}` || e.sourceId === `ent-${entity?.id}`
    )
    .sort((a: any, b: any) => b.rriScore - a.rriScore);

  const accentColor = isMentor ? "#06B6D4" : "#F59E0B";
  const accentBg = isMentor ? "rgba(6,182,212,0.1)" : "rgba(245,158,11,0.1)";
  const accentBorder = isMentor ? "rgba(6,182,212,0.25)" : "rgba(245,158,11,0.25)";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(2px)",
              zIndex: 60,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              maxWidth: "90vw",
              background: "linear-gradient(180deg, rgba(15,20,40,0.97), rgba(11,17,32,0.99))",
              borderLeft: "1px solid rgba(100,116,139,0.2)",
              zIndex: 70,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px 24px 20px",
                borderBottom: "1px solid rgba(100,116,139,0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Avatar bubble */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: isMentor
                        ? "radial-gradient(circle at 30% 30%, rgba(6,182,212,0.3), rgba(14,165,233,0.1))"
                        : "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.3), rgba(234,179,8,0.1))",
                      border: `1.5px solid ${accentBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      color: accentColor,
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    }}
                  >
                    {entity?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#E2E8F0",
                        margin: 0,
                        fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      }}
                    >
                      {entity?.name}
                    </h2>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: accentColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {entity?.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: "rgba(100,116,139,0.15)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#94A3B8",
                    transition: "all 0.2s ease",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {/* Summary */}
              {entity?.summary && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>
                    {entity.summary}
                  </p>
                </div>
              )}

              {/* Meta info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {entity?.industry && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#94A3B8" }}>
                    <Building2 size={14} color={accentColor} />
                    {entity.industry}
                  </div>
                )}
                {entity?.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#94A3B8" }}>
                    <Globe size={14} color={accentColor} />
                    {entity.location}
                  </div>
                )}
              </div>

              {/* Expertise tags */}
              {entity?.expertise?.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 10,
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    }}
                  >
                    Expertise
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {entity.expertise.map((skill: string) => (
                      <span
                        key={skill}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: accentBg,
                          border: `1px solid ${accentBorder}`,
                          fontSize: 11,
                          fontWeight: 600,
                          color: accentColor,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* RRI Connections */}
              {connections.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 12,
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Brain size={12} />
                      RRI Connections ({connections.length})
                    </div>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {connections.map((conn: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(100,116,139,0.08)",
                          border: "1px solid rgba(100,116,139,0.12)",
                          borderRadius: 10,
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>
                            {(conn.rriScore * 100).toFixed(1)}%
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              padding: "2px 8px",
                              borderRadius: 6,
                              background:
                                conn.confidence === "high"
                                  ? "rgba(52,211,153,0.15)"
                                  : conn.confidence === "medium"
                                    ? "rgba(251,191,36,0.15)"
                                    : "rgba(239,68,68,0.15)",
                              color:
                                conn.confidence === "high"
                                  ? "#34D399"
                                  : conn.confidence === "medium"
                                    ? "#FBBF24"
                                    : "#F87171",
                            }}
                          >
                            {conn.confidence}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
                          {conn.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RRI score footer */}
            {entity?.rriScore !== undefined && (
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid rgba(100,116,139,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={14} color={accentColor} />
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Overall RRI
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: accentColor,
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                  }}
                >
                  {(entity.rriScore * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
