import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface BubbleNodeData {
  name: string;
  type: 'Mentor' | 'Sponsor';
  industry?: string;
  rriScore?: number;
  onNodeClick?: (data: any) => void;
}

const BubbleNode = memo(({ data }: { data: BubbleNodeData }) => {
  const isMentor = data.type?.toLowerCase() === 'mentor';
  const initial = data.name ? data.name.charAt(0).toUpperCase() : '?';
  const rri = data.rriScore || 0;

  // Bubble size scales slightly with RRI score
  const baseSize = 90;
  const size = baseSize + rri * 30; // 90px to 120px

  // Color palettes
  const colors = isMentor
    ? {
        bg: `radial-gradient(circle at 30% 30%, rgba(6,182,212,0.25), rgba(14,165,233,0.10) 60%, rgba(6,182,212,0.05))`,
        border: 'rgba(6,182,212,0.45)',
        glow: 'rgba(6,182,212,0.2)',
        glowHover: 'rgba(6,182,212,0.45)',
        text: '#67E8F9',
        tag: '#06B6D4',
        // Iridescent highlight
        highlight: 'radial-gradient(circle at 65% 25%, rgba(168,235,255,0.35) 0%, transparent 50%)',
      }
    : {
        bg: `radial-gradient(circle at 30% 30%, rgba(245,158,11,0.25), rgba(234,179,8,0.10) 60%, rgba(245,158,11,0.05))`,
        border: 'rgba(245,158,11,0.45)',
        glow: 'rgba(245,158,11,0.2)',
        glowHover: 'rgba(245,158,11,0.45)',
        text: '#FDE68A',
        tag: '#F59E0B',
        highlight: 'radial-gradient(circle at 65% 25%, rgba(255,240,180,0.35) 0%, transparent 50%)',
      };

  // Randomized animation delay for organic feel
  const animDelay = `${(data.name?.charCodeAt(0) || 0) % 7 * 0.4}s`;
  const animDuration = `${3 + ((data.name?.charCodeAt(1) || 0) % 3)}s`;

  return (
    <div
      className="bubble-node-wrapper"
      style={{
        width: size,
        height: size + 36,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        animation: `bubbleFloat ${animDuration} ease-in-out infinite`,
        animationDelay: animDelay,
      }}
      onClick={() => data.onNodeClick?.(data)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-1 !h-1"
        style={{ top: 8 }}
      />

      {/* Bubble sphere */}
      <div
        className="bubble-sphere"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          boxShadow: `0 0 24px ${colors.glow}, inset 0 0 30px rgba(255,255,255,0.03)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Iridescent highlight (soap bubble light reflection) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: colors.highlight,
            pointerEvents: 'none',
          }}
        />

        {/* Inner initial */}
        <span
          style={{
            fontSize: size * 0.32,
            fontWeight: 800,
            color: colors.text,
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            position: 'relative',
            zIndex: 2,
            textShadow: `0 0 16px ${colors.glow}`,
          }}
        >
          {initial}
        </span>
      </div>

      {/* Name + type below bubble */}
      <div style={{ textAlign: 'center', marginTop: 6, maxWidth: size + 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#E2E8F0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          }}
        >
          {data.name}
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: colors.tag,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: 1,
          }}
        >
          {data.type}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-1 !h-1"
        style={{ bottom: 0 }}
      />
    </div>
  );
});

BubbleNode.displayName = 'BubbleNode';
export default BubbleNode;
