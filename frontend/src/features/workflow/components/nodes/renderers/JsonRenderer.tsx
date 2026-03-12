"use client";

/**
 * JsonRenderer — renders formatted JSON output for analyzer/planner nodes.
 * Uses Shiki for syntax-highlighted JSON display.
 */

import React, { useMemo } from "react";
import type { NodeRendererProps } from "../index";

export const JsonRenderer: React.FC<NodeRendererProps> = ({
    output,
    isStreaming,
}) => {
    const formattedJson = useMemo(() => {
        if (!output) return "";
        try {
            const parsed = JSON.parse(output);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return output; // Return raw if not valid JSON yet (streaming)
        }
    }, [output]);

    if (!output) {
        return (
            <div className="text-gray-400 text-sm italic">
                {isStreaming ? "分析中..." : "等待执行"}
            </div>
        );
    }

    return (
        <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs overflow-x-auto max-h-64 scrollbar-thin">
            <code>{formattedJson}</code>
        </pre>
    );
};
