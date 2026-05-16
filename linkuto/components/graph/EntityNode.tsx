import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Building2, User, Sparkles } from 'lucide-react';

export default memo(({ data, isConnectable }: any) => {
  const isProgramme = data.isProgramme;
  const badgeColor = isProgramme 
    ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
    : "bg-accent/10 text-accent border-accent/20";

  return (
    <div className="bg-card-bg border border-border-warm rounded-2xl p-4 shadow-sm min-w-[200px] hover:border-accent/50 transition-colors">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-accent"
      />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xl font-bold ${badgeColor}`}>
          {isProgramme ? <Sparkles size={18} /> : (data.name ? data.name.charAt(0) : "U")}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {data.type || "Participant"}
          </div>
          <div className="text-sm font-bold text-text-primary line-clamp-1" title={data.name}>
            {data.name}
          </div>
        </div>
      </div>
      
      {data.industry && (
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-2">
          <Building2 size={12} /> {data.industry}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-accent"
      />
    </div>
  );
});
