import React from 'react';
import { getNodeTypeMeta } from '../../constants/workflow-meta';

interface NodeInputBadgesProps {
  nodeType: string;
}

export const NodeInputBadges: React.FC<NodeInputBadgesProps> = ({ nodeType }) => {
  const meta = getNodeTypeMeta(nodeType);
  
  if ((!meta.inputs || meta.inputs.length === 0) && (!meta.outputs || meta.outputs.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {meta.inputs?.map((input) => (
        <span 
          key={`in-${input.key}`}
          className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-sm bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"
          title={input.description}
        >
          📥 {input.key}{input.required && <span className="text-rose-500/70 ml-0.5">*</span>}
        </span>
      ))}
      {meta.outputs?.map((output) => (
        <span 
          key={`out-${output.key}`}
          className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-sm bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"
          title={output.description}
        >
          📤 {output.key}{output.required && <span className="text-rose-500/70 ml-0.5">*</span>}
        </span>
      ))}
    </div>
  );
};
