import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, GraduationCap } from 'lucide-react';

interface HexNodeData {
  name: string;
  type: string;
  industry_focus?: string[];
  participants?: any[];
  mentors?: any[];
  status?: string;
  description?: string;
  isProgramme: boolean;
  onNodeClick?: (data: any) => void;
}

const HexNode = memo(({ data }: { data: HexNodeData }) => {
  const hexWidth = 150;
  const hexHeight = 170;
  const participantCount = data.participants?.length || 0;
  const mentorCount = data.mentors?.length || 0;

  return (
    <div
      className="hex-node-wrapper"
      style={{
        width: hexWidth,
        height: hexHeight + 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      onClick={() => data.onNodeClick?.(data)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-1 !h-1"
        style={{ top: 0 }}
      />

      {/* Outer hex border (gradient) */}
      <div
        style={{
          width: hexWidth,
          height: hexHeight,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: 'linear-gradient(135deg, rgba(115,98,120,0.8), rgba(167,139,250,0.6))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.2))',
        }}
      >
        {/* Inner hex fill */}
        <div
          style={{
            width: hexWidth - 3,
            height: hexHeight - 3,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: 'linear-gradient(180deg, rgba(15,20,40,0.92), rgba(25,30,55,0.88))',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 12px',
            gap: 6,
          }}
        >
          {/* Status dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: data.status === 'active' ? '#34D399' : '#6B7280',
              boxShadow: data.status === 'active' ? '0 0 8px rgba(52,211,153,0.5)' : 'none',
            }}
          />

          {/* Programme name */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#E2E8F0',
              textAlign: 'center',
              lineHeight: 1.2,
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              maxWidth: '90%',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}
          >
            {data.name}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginTop: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={10} color="#94A3B8" />
              <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600 }}>
                {participantCount}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <GraduationCap size={10} color="#A78BFA" />
              <span style={{ fontSize: 9, color: '#A78BFA', fontWeight: 600 }}>
                {mentorCount}
              </span>
            </div>
          </div>
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

HexNode.displayName = 'HexNode';
export default HexNode;
