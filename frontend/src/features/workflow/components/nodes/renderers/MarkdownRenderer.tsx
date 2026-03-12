"use client";

/**
 * MarkdownRenderer — default renderer for most LLM nodes.
 * Uses NodeMarkdownOutput for rich markdown display.
 */

import React from "react";
import type { NodeRendererProps } from "../index";
import NodeMarkdownOutput from "../NodeMarkdownOutput";

export const MarkdownRenderer: React.FC<NodeRendererProps> = ({
    output,
    isStreaming,
}) => {
    if (!output) {
        return (
            <div className="text-gray-400 text-sm italic">
                {isStreaming ? "生成中..." : "等待执行"}
            </div>
        );
    }

    return <NodeMarkdownOutput content={output} />;
};
