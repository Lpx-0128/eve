"use client";

import { useState, useEffect, useCallback } from "react";
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
import { BrainCircuit } from "lucide-react";

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

export default function OrganiserGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rawEdges, setRawEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Initializing ecosystem graph...");

  // Detail panel state
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Edge popover state
  const [edgePopover, setEdgePopover] = useState<{
    data: any;
    position: { x: number; y: number };
  } | null>(null);

  // Name lookup map for edge labels
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const handleNodeClick = useCallback((entityData: any) => {
    if (entityData.isProgramme) return; // Don't open detail for programmes
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

        if (!res.ok) {
          throw new Error("Failed to load graph data");
        }

        setLoadingMsg("Computing relationship scores with AI...");
        const json = await res.json();
        const { programmes, entities, edges: apiEdges } = json;

        // Build name map for edge labels
        const names: Record<string, string> = { "organiser-root": "You (Organiser)" };
        programmes?.forEach((p: any) => {
          names[`prog-${p.id}`] = p.name;
        });
        entities?.forEach((e: any) => {
          names[`ent-${e.id}`] = e.name;
        });
        setNameMap(names);
        setRawEdges(apiEdges || []);

        setLoadingMsg("Rendering visualization...");

        // --- Layout: concentric rings ---
        const centerX = 600;
        const centerY = 500;

        const newNodes: Node[] = [];

        // Programme ring (inner, radius ~200)
        const progRadius = 220;
        const progCount = programmes?.length || 0;
        programmes?.forEach((prog: any, i: number) => {
          const angle = (i / Math.max(progCount, 1)) * 2 * Math.PI - Math.PI / 2;
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

        // Entity ring (outer, radius ~480)
        const entRadius = 480;
        const entCount = entities?.length || 0;
        entities?.forEach((ent: any, i: number) => {
          const angle = (i / Math.max(entCount, 1)) * 2 * Math.PI - Math.PI / 2;
          // Slight radial jitter for organic feel
          const jitter = (Math.sin(i * 7.3) * 40);
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

        // Build ReactFlow edges from API edges
        const newEdges: Edge[] = (apiEdges || []).map((e: any, i: number) => ({
          id: `edge-${i}`,
          source: e.sourceId,
          target: e.targetId,
          type: "rri",
          data: {
            rriScore: e.rriScore,
            confidence: e.confidence,
            explanation: e.explanation,
            sourceName: names[e.sourceId] || e.sourceId,
            targetName: names[e.targetId] || e.targetId,
            onEdgeClick: handleEdgeClick,
          },
        }));

        setEdges(newEdges);
      } catch (err) {
        console.error("Failed to fetch graph data", err);
        setLoadingMsg("Failed to load ecosystem data. Please refresh.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setNodes, setEdges, handleNodeClick, handleEdgeClick]);

  // Loading state — custom dark themed
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
        edges={rawEdges}
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
