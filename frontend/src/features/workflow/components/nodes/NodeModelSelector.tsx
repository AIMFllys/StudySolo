import React from 'react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import { FALLBACK_AI_MODEL_OPTIONS, groupModelsByProvider } from '../../constants/ai-models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NodeModelSelectorProps {
  nodeId: string;
  currentModel: string;
  nodeThemeColor: string;
}

export const NodeModelSelector: React.FC<NodeModelSelectorProps> = ({
  nodeId,
  currentModel,
  nodeThemeColor,
}) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const modelOptions = FALLBACK_AI_MODEL_OPTIONS;
  const groups = groupModelsByProvider(modelOptions);

  const handleSelect = (modelStr: string) => {
    updateNodeData(nodeId, { model_route: modelStr });
  };

  const selectedModelInfo = modelOptions.find((m) => m.model === currentModel) || modelOptions[0];
  const brandColor = selectedModelInfo.brandColor || nodeThemeColor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="node-model-selector-trigger group flex items-center gap-1.5 focus:outline-none bg-transparent border-none opacity-60 font-mono text-[9px] uppercase hover:opacity-100 hover:border hover:border-dashed hover:border-current/20 px-1 py-0.5 rounded transition-all"
          title="切换 AI 模型"
        >
          <span 
            className="w-1.5 h-1.5 rounded-full inline-block transition-colors" 
            style={{ backgroundColor: brandColor }}
          />
          <span>{selectedModelInfo.model}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 node-paper-bg border border-dashed border-black/20 dark:border-white/20 shadow-xl" align="start">
        {Object.entries(groups).map(([providerName, models], idx) => (
          <React.Fragment key={providerName}>
            {idx > 0 && <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-serif text-[10px] opacity-70 px-2 py-1">
                {providerName}
              </DropdownMenuLabel>
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.model}
                  onClick={() => handleSelect(model.model)}
                  className="font-mono text-[10px] cursor-pointer focus:bg-black/5 dark:focus:bg-white/10 flex items-center gap-2 px-2 py-1.5 rounded-sm"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: model.brandColor }}
                  />
                  <span>{model.model}</span>
                  {model.isPremium && (
                    <span className="text-[8px] border border-amber-500/30 text-amber-600 dark:text-amber-400 px-1 rounded-sm ml-auto">
                      PRO
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
