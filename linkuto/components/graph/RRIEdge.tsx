import { memo, useCallback } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
} from 'reactflow';

interface RRIEdgeData {
  rriScore: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  sourceName?: string;
  targetName?: string;
  onEdgeClick?: (data: any, position: { x: number; y: number }) => void;
}

const RRIEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}: EdgeProps<RRIEdgeData>) => {
  const rri = data?.rriScore || 0;

  // Visual encoding: thickness + opacity mapped to RRI
  const strokeWidth = 1 + rri * 3.5; // 1px to 4.5px
  const strokeOpacity = 0.1 + rri * 0.75; // 0.1 to 0.85

  // Color based on confidence
  const strokeColor =
    rri >= 0.75
      ? `rgba(6,182,212,${strokeOpacity})` // cyan for strong
      : rri >= 0.5
        ? `rgba(148,163,184,${strokeOpacity})` // slate for medium
        : `rgba(100,116,139,${strokeOpacity})`; // dimmer for weak

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.15,
  });

  const handleClick = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation();
      data?.onEdgeClick?.(
        {
          rriScore: data.rriScore,
          confidence: data.confidence,
          explanation: data.explanation,
          sourceName: data.sourceName,
          targetName: data.targetName,
        },
        { x: evt.clientX, y: evt.clientY }
      );
    },
    [data]
  );

  return (
    <>
      {/* Invisible wider path for easier click target */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          transition: 'stroke-width 0.3s ease, stroke 0.3s ease',
          filter: rri >= 0.75 ? `drop-shadow(0 0 4px rgba(6,182,212,0.3))` : 'none',
          ...style,
        }}
      />

      {/* Animated flow dots for strong connections */}
      {rri >= 0.7 && (
        <path
          d={edgePath}
          fill="none"
          stroke={`rgba(6,182,212,${strokeOpacity * 0.6})`}
          strokeWidth={strokeWidth * 0.5}
          strokeDasharray="4 8"
          style={{
            animation: 'edgeFlowDash 2s linear infinite',
          }}
        />
      )}

      {/* RRI score label on hover zone */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onClick={handleClick}
        >
          <div
            className="edge-score-label"
            style={{
              background: 'rgba(15,20,40,0.85)',
              border: `1px solid ${rri >= 0.75 ? 'rgba(6,182,212,0.4)' : 'rgba(100,116,139,0.3)'}`,
              borderRadius: 8,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: rri >= 0.75 ? '#67E8F9' : '#94A3B8',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            }}
          >
            {(rri * 100).toFixed(0)}%
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

RRIEdge.displayName = 'RRIEdge';
export default RRIEdge;
