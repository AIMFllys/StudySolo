"use client";

/**
 * OutlineRenderer — renders learning outlines with collapsible sections.
 * Falls back to MarkdownRenderer for streamed content.
 */

import React from "react";
import type { NodeRendererProps } from "../index";
import NodeMarkdownOutput from "../NodeMarkdownOutput";

export const OutlineRenderer: React.FC<NodeRendererProps> = ({
    output,
    isStreaming,
}) => {
    if (!output) {
        return (
            <div className="text-gray-400 text-sm italic">
                {isStreaming ? "大纲生成中..." : "等待执行"}
            </div>
        );
    }

    // The outline is Markdown with headers, so we can use the same
    // NodeMarkdownOutput. In the future, this can be enhanced with
    // collapsible tree UI once the format is finalized.
    return (
        <div className="outline-renderer">
            <NodeMarkdownOutput content={output} />
        </div>
    );
};
