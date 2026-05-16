"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BrainCircuit, Filter, ChevronDown, ChevronUp, X } from "lucide-react";

import BubbleNode from "@/components/graph/BubbleNode";
import HexNode from "@/components/graph/HexNode";
import RRIEdge from "@/components/graph/RRIEdge";
import EntityDetailPanel from "@/components/graph/EntityDetailPanel";
import EdgePopover from "@/components/graph/EdgePopover";

const nodeTypes = {
  bubble: BubbleNode,
  hex: HexNode,
};

const edgeTypes = {
  rri: RRIEdge,
};

// --- Filter types ---
type RoleFilter = "all" | "mentor" | "sponsor";
type RRIFilter = "all" | "above70" | "below70";

const PER_PROGRAMME_LIMIT = 20;

export default function OrganiserGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Initializing ecosystem graph...");

  // --- Raw data (unfiltered, stored after initial fetch) ---
  const [rawProgrammes, setRawProgrammes] = useState<any[]>([]);
  const [rawEntities, setRawEntities] = useState<any[]>([]);
  const [rawApiEdges, setRawApiEdges] = useState<any[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  // --- Filter state ---
  const [filterOpen, setFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rriFilter, setRRIFilter] = useState<RRIFilter>("all");

  const [programmeFilter, setProgrammeFilter] = useState<string>("all"); // programme id or "all"

  // Detail panel & popover state
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [edgePopover, setEdgePopover] = useState<{
    data: any;
    position: { x: number; y: number };
  } | null>(null);

  const handleNodeClick = useCallback((entityData: any) => {
    if (entityData.isProgramme) return;
    setSelectedEntity(entityData);
    setEdgePopover(null);
  }, []);

  const handleEdgeClick = useCallback(
    (edgeData: any, position: { x: number; y: number }) => {
      setEdgePopover({ data: edgeData, position });
      setSelectedEntity(null);
    },
    []
  );

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== "all") count++;
    if (rriFilter !== "all") count++;
    if (programmeFilter !== "all") count++;
    return count;
  }, [roleFilter, rriFilter, programmeFilter]);

  // --- Apply filters and rebuild nodes/edges ---
  const applyFilters = useCallback(() => {
    if (rawEntities.length === 0) return;

    let filteredEntities = [...rawEntities];
    let filteredEdges = [...rawApiEdges];

    // 1. Role filter
    if (roleFilter !== "all") {
      filteredEntities = filteredEntities.filter(
        (e) => e.type?.toLowerCase() === roleFilter
      );
    }

    // 2. RRI threshold filter
    if (rriFilter === "above70") {
      filteredEntities = filteredEntities.filter((e) => e.rriScore >= 0.7);
    } else if (rriFilter === "below70") {
      filteredEntities = filteredEntities.filter((e) => e.rriScore < 0.7);
    }

    // 3. Programme filter — only show entities connected to a specific programme
    if (programmeFilter !== "all") {
      const progNodeId = `prog-${programmeFilter}`;
      const connectedEntityIds = new Set(
        filteredEdges
          .filter((e) => e.sourceId === progNodeId || e.targetId === progNodeId)
          .map((e) => (e.sourceId === progNodeId ? e.targetId : e.sourceId))
      );
      filteredEntities = filteredEntities.filter((e) =>
        connectedEntityIds.has(`ent-${e.id}`)
      );
    }

    // 4. Per-programme cap: max 20 profiles per programme (sorted by RRI)
    const activeProgrammes = programmeFilter !== "all"
      ? rawProgrammes.filter((p) => p.id === programmeFilter)
      : rawProgrammes;

    if (activeProgrammes.length > 0) {
      const allowedIds = new Set<string>();
      activeProgrammes.forEach((prog: any) => {
        const progNodeId = `prog-${prog.id}`;
        // Find entities connected to this programme
        const connectedEnts = filteredEdges
          .filter((e) => e.sourceId === progNodeId || e.targetId === progNodeId)
          .map((e) => (e.sourceId === progNodeId ? e.targetId : e.sourceId))
          .filter((id) => id.startsWith("ent-"));

        // Sort by RRI score descending, take top 20
        const sorted = connectedEnts
          .map((entId) => {
            const ent = filteredEntities.find((e) => `ent-${e.id}` === entId);
            const edge = filteredEdges.find(
              (e) =>
                (e.sourceId === progNodeId && e.targetId === entId) ||
                (e.targetId === progNodeId && e.sourceId === entId)
            );
            return { entId, rri: edge?.rriScore || ent?.rriScore || 0 };
          })
          .sort((a, b) => b.rri - a.rri)
          .slice(0, PER_PROGRAMME_LIMIT);

        sorted.forEach((s) => allowedIds.add(s.entId));
      });

      // Keep only entities that made it into at least one programme's top 20
      filteredEntities = filteredEntities.filter((e) => allowedIds.has(`ent-${e.id}`));
    }

    // Build the visible entity ID set
    const visibleEntityIds = new Set(filteredEntities.map((e) => `ent-${e.id}`));

    // Filter edges to only include those connecting visible entities
    filteredEdges = filteredEdges.filter((e) => {
      const sourceVisible =
        visibleEntityIds.has(e.sourceId) || e.sourceId.startsWith("prog-");
      const targetVisible =
        visibleEntityIds.has(e.targetId) || e.targetId.startsWith("prog-");
      return sourceVisible && targetVisible;
    });

    // Determine which programmes to show
    let filteredProgrammes = [...rawProgrammes];
    if (programmeFilter !== "all") {
      filteredProgrammes = filteredProgrammes.filter(
        (p) => p.id === programmeFilter
      );
    }

    // --- Layout ---
    const centerX = 600;
    const centerY = 500;
    const newNodes: Node[] = [];

    // Programme ring (inner)
    const progRadius = filteredProgrammes.length === 1 ? 0 : 220;
    const progCount = filteredProgrammes.length || 1;
    filteredProgrammes.forEach((prog: any, i: number) => {
      const angle = (i / progCount) * 2 * Math.PI - Math.PI / 2;
      newNodes.push({
        id: `prog-${prog.id}`,
        type: "hex",
        data: {
          ...prog,
          isProgramme: true,
          onNodeClick: handleNodeClick,
        },
        position: {
          x: centerX + progRadius * Math.cos(angle) - 75,
          y: centerY + progRadius * Math.sin(angle) - 85,
        },
      });
    });

    // Entity ring (outer) — radius adapts to count for readability
    const entCount = filteredEntities.length || 1;
    const entRadius = Math.max(300, Math.min(550, entCount * 12));
    filteredEntities.forEach((ent: any, i: number) => {
      const angle = (i / entCount) * 2 * Math.PI - Math.PI / 2;
      const jitter = Math.sin(i * 7.3) * 40;
      const x = centerX + (entRadius + jitter) * Math.cos(angle) - 50;
      const y = centerY + (entRadius + jitter) * Math.sin(angle) - 60;

      newNodes.push({
        id: `ent-${ent.id}`,
        type: "bubble",
        data: {
          ...ent,
          isProgramme: false,
          onNodeClick: handleNodeClick,
        },
        position: { x, y },
      });
    });

    setNodes(newNodes);

    // Build ReactFlow edges
    const newEdges: Edge[] = filteredEdges.map((e: any, i: number) => ({
      id: `edge-${i}`,
      source: e.sourceId,
      target: e.targetId,
      type: "rri",
      data: {
        rriScore: e.rriScore,
        confidence: e.confidence,
        explanation: e.explanation,
        sourceName: nameMap[e.sourceId] || e.sourceId,
        targetName: nameMap[e.targetId] || e.targetId,
        onEdgeClick: handleEdgeClick,
      },
    }));

    setEdges(newEdges);
  }, [
    rawEntities,
    rawApiEdges,
    rawProgrammes,
    roleFilter,
    rriFilter,
    programmeFilter,
    nameMap,
    handleNodeClick,
    handleEdgeClick,
    setNodes,
    setEdges,
  ]);

  // Re-apply filters whenever filter state changes
  useEffect(() => {
    if (!loading && rawEntities.length > 0) {
      applyFilters();
    }
  }, [roleFilter, rriFilter, programmeFilter, loading, applyFilters]);

  // --- Initial data fetch ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setLoadingMsg("Mapping ecosystem entities...");

      try {
        const res = await fetch("/api/organiser/graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid }),
        });

        if (!res.ok) throw new Error("Failed to load graph data");

        setLoadingMsg("Computing relationship scores with AI...");
        const json = await res.json();
        const { programmes, entities, edges: apiEdges } = json;

        // Build name map
        const names: Record<string, string> = { "organiser-root": "You (Organiser)" };
        programmes?.forEach((p: any) => {
          names[`prog-${p.id}`] = p.name;
        });
        entities?.forEach((e: any) => {
          names[`ent-${e.id}`] = e.name;
        });

        setNameMap(names);
        setRawProgrammes(programmes || []);
        setRawEntities(entities || []);
        setRawApiEdges(apiEdges || []);
      } catch (err) {
        console.error("Failed to fetch graph data", err);
        setLoadingMsg("Failed to load ecosystem data. Please refresh.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Build initial graph once data is loaded ---
  useEffect(() => {
    if (!loading && rawEntities.length > 0) {
      applyFilters();
    }
  }, [loading, rawEntities.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset all filters
  const resetFilters = () => {
    setRoleFilter("all");
    setRRIFilter("all");
    setProgrammeFilter("all");
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 8rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #0B1120, #0F172A)",
          borderRadius: 16,
          gap: 20,
        }}
      >
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "3px solid rgba(6,182,212,0.15)",
              borderTopColor: "#06B6D4",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BrainCircuit size={24} color="#06B6D4" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#E2E8F0",
              margin: "0 0 8px",
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            }}
          >
            Building Ecosystem Graph
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{loadingMsg}</p>
        </div>
      </div>
    );
  }

  // --- Filter pill button style helper ---
  const pillStyle = (active: boolean) => ({
    padding: "5px 12px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700 as const,
    cursor: "pointer" as const,
    border: active ? "1px solid rgba(6,182,212,0.5)" : "1px solid rgba(100,116,139,0.2)",
    background: active ? "rgba(6,182,212,0.15)" : "rgba(100,116,139,0.08)",
    color: active ? "#67E8F9" : "#94A3B8",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
  });

  return (
    <>
      <div
        className="graph-canvas-container"
        style={{
          width: "100%",
          height: "calc(100vh - 8rem)",
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(100,116,139,0.15)",
          background: "linear-gradient(180deg, #0B1120, #0F172A)",
        }}
      >
        {/* Title overlay */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 28,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#E2E8F0",
              margin: "0 0 4px",
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            Ecosystem Matrix
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#64748B",
              margin: 0,
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            }}
          >
            {nodes.length} nodes · {edges.length} connections ·{" "}
            <span style={{ color: "#06B6D4" }}>Live RRI</span>
          </p>
        </div>

        {/* ===== FILTER PANEL ===== */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 15,
          }}
        >
          {/* Toggle button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 10,
              border: activeFilterCount > 0
                ? "1px solid rgba(6,182,212,0.4)"
                : "1px solid rgba(100,116,139,0.25)",
              background: activeFilterCount > 0
                ? "rgba(6,182,212,0.12)"
                : "rgba(15,20,40,0.85)",
              backdropFilter: "blur(12px)",
              color: activeFilterCount > 0 ? "#67E8F9" : "#CBD5E1",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            }}
          >
            <Filter size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: "#06B6D4",
                  color: "#0B1120",
                  borderRadius: 6,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 800,
                  marginLeft: 2,
                }}
              >
                {activeFilterCount}
              </span>
            )}
            {filterOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Dropdown panel */}
          {filterOpen && (
            <div
              style={{
                marginTop: 8,
                background: "rgba(15,20,40,0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(100,116,139,0.2)",
                borderRadius: 14,
                padding: 20,
                minWidth: 380,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}>
                  Filter Graph
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#F87171",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <X size={10} /> Clear All
                  </button>
                )}
              </div>

              {/* 1. Role type */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Entity Type
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setRoleFilter("all")} style={pillStyle(roleFilter === "all")}>
                    All
                  </button>
                  <button onClick={() => setRoleFilter("mentor")} style={pillStyle(roleFilter === "mentor")}>
                    🟦 Mentors Only
                  </button>
                  <button onClick={() => setRoleFilter("sponsor")} style={pillStyle(roleFilter === "sponsor")}>
                    🟨 Sponsors Only
                  </button>
                </div>
              </div>

              {/* 2. RRI threshold */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Relationship Strength (RRI)
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setRRIFilter("all")} style={pillStyle(rriFilter === "all")}>
                    All Scores
                  </button>
                  <button onClick={() => setRRIFilter("above70")} style={pillStyle(rriFilter === "above70")}>
                    Strong ≥ 70%
                  </button>
                  <button onClick={() => setRRIFilter("below70")} style={pillStyle(rriFilter === "below70")}>
                    Weak &lt; 70%
                  </button>
                </div>
              </div>



              {/* 4. Programme filter */}
              {rawProgrammes.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Programme
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => setProgrammeFilter("all")} style={pillStyle(programmeFilter === "all")}>
                      All Programmes
                    </button>
                    {rawProgrammes.map((prog: any) => (
                      <button
                        key={prog.id}
                        onClick={() => setProgrammeFilter(prog.id)}
                        style={pillStyle(programmeFilter === prog.id)}
                      >
                        ⬡ {prog.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(100,116,139,0.15)",
                  fontSize: 11,
                  color: "#64748B",
                  textAlign: "center",
                }}
              >
                Showing <span style={{ color: "#E2E8F0", fontWeight: 700 }}>{nodes.filter(n => n.type === "bubble").length}</span> entities
                {" "}from <span style={{ color: "#E2E8F0", fontWeight: 700 }}>{rawEntities.length}</span> total
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 28,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: "rgba(15,20,40,0.8)",
            backdropFilter: "blur(8px)",
            borderRadius: 10,
            padding: "10px 14px",
            border: "1px solid rgba(100,116,139,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(6,182,212,0.5), rgba(6,182,212,0.15))",
                border: "1px solid rgba(6,182,212,0.5)",
              }}
            />
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Mentor</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(245,158,11,0.5), rgba(245,158,11,0.15))",
                border: "1px solid rgba(245,158,11,0.5)",
              }}
            />
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Sponsor</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "linear-gradient(135deg, rgba(115,98,120,0.6), rgba(167,139,250,0.4))",
              }}
            />
            <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Programme</span>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(100,116,139,0.15)",
              paddingTop: 6,
              marginTop: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 3, borderRadius: 2, background: "rgba(6,182,212,0.7)" }} />
              <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>Strong RRI</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <div style={{ width: 24, height: 1, borderRadius: 1, background: "rgba(100,116,139,0.3)" }} />
              <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>Weak RRI</span>
            </div>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "transparent" }}
          onClick={() => setEdgePopover(null)}
        >
          <Background
            color="rgba(100,116,139,0.15)"
            gap={30}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            style={{
              background: "rgba(15,20,40,0.85)",
              border: "1px solid rgba(100,116,139,0.2)",
              borderRadius: 10,
              overflow: "hidden",
            }}
            className="graph-controls"
          />
        </ReactFlow>
      </div>

      {/* Entity detail panel */}
      <EntityDetailPanel
        entity={selectedEntity}
        edges={rawApiEdges}
        onClose={() => setSelectedEntity(null)}
      />

      {/* Edge popover */}
      <EdgePopover
        data={edgePopover?.data || null}
        position={edgePopover?.position || null}
        onClose={() => setEdgePopover(null)}
      />
    </>
  );
}
