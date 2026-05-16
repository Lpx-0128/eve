"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import LoadingState from '@/components/LoadingState';
import EntityNode from '@/components/graph/EntityNode';

const nodeTypes = {
  entity: EntityNode,
};

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const res = await fetch('/api/graph');
        const json = await res.json();
        
        if (json.data) {
          const { entities, programmes } = json.data;
          
          const newNodes: Node[] = [];
          const newEdges: Edge[] = [];

          // Center node for Ecosystem
          newNodes.push({
            id: 'root',
            type: 'entity',
            data: { name: 'Ecosystem Core', type: 'System', isProgramme: true },
            position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 150 },
          });

          // Programmes in an inner circle
          const progRadius = 250;
          programmes.forEach((prog: any, i: number) => {
            const angle = (i / programmes.length) * 2 * Math.PI;
            const x = window.innerWidth / 2 - 100 + progRadius * Math.cos(angle);
            const y = window.innerHeight / 2 - 150 + progRadius * Math.sin(angle);
            
            newNodes.push({
              id: `prog-${prog.id}`,
              type: 'entity',
              data: { ...prog, type: 'Programme', isProgramme: true },
              position: { x, y },
            });

            newEdges.push({
              id: `edge-root-${prog.id}`,
              source: 'root',
              target: `prog-${prog.id}`,
              animated: true,
              style: { stroke: '#06B6D4', strokeWidth: 2, opacity: 0.5 },
            });
          });

          // Entities in an outer circle
          const entRadius = 500;
          entities.forEach((ent: any, i: number) => {
            const angle = (i / entities.length) * 2 * Math.PI;
            // Add a little randomness to make it look organic
            const rOffset = Math.random() * 100 - 50;
            const x = window.innerWidth / 2 - 100 + (entRadius + rOffset) * Math.cos(angle);
            const y = window.innerHeight / 2 - 150 + (entRadius + rOffset) * Math.sin(angle);
            
            newNodes.push({
              id: `ent-${ent.id}`,
              type: 'entity',
              data: { ...ent, isProgramme: false },
              position: { x, y },
            });

            // Randomly connect entity to 1 or 2 programmes to simulate matches/participation
            if (programmes.length > 0) {
              const randomProg = programmes[Math.floor(Math.random() * programmes.length)];
              newEdges.push({
                id: `edge-${ent.id}-${randomProg.id}`,
                source: `prog-${randomProg.id}`,
                target: `ent-${ent.id}`,
                animated: true,
                style: { stroke: '#736278', strokeWidth: 1, opacity: 0.4 },
              });
            } else {
               // If no programmes, connect to root
               newEdges.push({
                id: `edge-root-${ent.id}`,
                source: 'root',
                target: `ent-${ent.id}`,
                animated: true,
                style: { stroke: '#736278', strokeWidth: 1, opacity: 0.4 },
              });
            }
          });

          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (err) {
        console.error("Failed to fetch graph data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [setNodes, setEdges]);

  if (loading) {
    return <LoadingState message="Rendering ecosystem nodes..." variant="skeleton" />;
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-border-warm bg-bg-base shadow-sm">
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <h1 className="text-2xl font-heading font-extrabold text-text-primary drop-shadow-md">
          Ecosystem Matrix
        </h1>
        <p className="text-sm text-text-muted font-body drop-shadow-md">
          Live visualization of {nodes.length} nodes and {edges.length} connections
        </p>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        className="bg-bg-base"
      >
        <Background color="#736278" gap={20} size={1} variant={BackgroundVariant.Dots} className="opacity-20" />
        <Controls className="bg-card-bg border border-border-warm fill-text-primary rounded-xl shadow-sm overflow-hidden [&>button]:border-border-warm" />
      </ReactFlow>
    </div>
  );
}
