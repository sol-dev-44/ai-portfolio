'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReasoningNode {
    id: string;
    round: number;
    trace_index: number;
    score: number;
    is_golden: boolean;
    reasoning_text: string;
    final_answer: string;
}

interface STaRVisualizationProps {
    rounds: any[];
}

export default function STaRVisualization({ rounds }: STaRVisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<ReasoningNode | null>(null);

    useEffect(() => {
        if (!svgRef.current || !rounds.length) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const width = 1100;
        const height = 700;
        const roundSpacing = (width - 100) / rounds.length;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', 'transparent');

        // Build nodes
        const nodes: ReasoningNode[] = [];
        rounds.forEach((round) => {
            round.traces?.forEach((trace: any) => {
                nodes.push({
                    id: `r${round.round_number}-t${trace.trace_index}`,
                    round: round.round_number,
                    trace_index: trace.trace_index,
                    score: trace.score || 0,
                    is_golden: trace.is_golden || false,
                    reasoning_text: trace.reasoning_text,
                    final_answer: trace.final_answer,
                });
            });
        });

        // Group by round and sort by score
        const roundGroups = d3.group(nodes, d => d.round);
        const sortedGroups = Array.from(roundGroups.values()).map(group =>
            group.sort((a, b) => b.score - a.score)
        );

        // Position nodes
        const nodePositions = sortedGroups.flatMap((group, roundIdx) =>
            group.map((node, idx) => ({
                ...node,
                x: 80 + roundIdx * roundSpacing + roundSpacing / 2,
                y: 120 + idx * 55,
            }))
        );

        // Draw connections (golden to next round)
        const links: any[] = [];
        rounds.forEach((round, roundIdx) => {
            if (roundIdx < rounds.length - 1) {
                const goldenTraces = round.traces?.filter((t: any) => t.is_golden) || [];
                const nextRoundTraces = rounds[roundIdx + 1].traces || [];

                goldenTraces.forEach((golden: any) => {
                    nextRoundTraces.forEach((next: any, nextIdx: number) => {
                        if (nextIdx < 3) { // Only connect to top 3
                            links.push({
                                source: nodePositions.find(n => n.round === round.round_number && n.trace_index === golden.trace_index),
                                target: nodePositions.find(n => n.round === round.round_number + 1 && n.trace_index === next.trace_index),
                            });
                        }
                    });
                });
            }
        });

        // Draw curved links
        svg.selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', (d: any) => {
                const sourceX = d.source?.x || 0;
                const sourceY = d.source?.y || 0;
                const targetX = d.target?.x || 0;
                const targetY = d.target?.y || 0;
                const midX = (sourceX + targetX) / 2;
                return `M ${sourceX},${sourceY} Q ${midX},${sourceY} ${midX},${(sourceY + targetY) / 2} T ${targetX},${targetY}`;
            })
            .attr('stroke', '#fbbf24')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.3)
            .attr('fill', 'none');

        // Draw horizontal bars for scores
        const nodeGroup = svg.selectAll('.node')
            .data(nodePositions)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', (d: any) => `translate(${d.x - 80},${d.y})`);

        // Score bars
        nodeGroup.append('rect')
            .attr('x', 0)
            .attr('y', -8)
            .attr('width', (d: any) => (d.score / 10) * 150)
            .attr('height', 16)
            .attr('rx', 4)
            .attr('fill', (d: any) => {
                if (d.is_golden) return '#fbbf24';
                const hue = (d.score / 10) * 120; // Red to green
                return `hsl(${hue}, 70%, 50%)`;
            })
            .attr('opacity', 0.8)
            .style('cursor', 'pointer')
            .on('click', function (event, d: any) {
                setSelectedNode(d);
            });

        // Score text
        nodeGroup.append('text')
            .attr('x', (d: any) => (d.score / 10) * 150 + 5)
            .attr('y', 4)
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .attr('fill', '#374151')
            .style('pointer-events', 'none')
            .text((d: any) => (d.score ?? 0).toFixed(1));

        // Golden star
        nodeGroup
            .filter((d: any) => d.is_golden)
            .append('text')
            .attr('x', -15)
            .attr('y', 4)
            .attr('font-size', '14px')
            .text('⭐');

        // Round labels
        rounds.forEach((round, idx) => {
            svg.append('text')
                .attr('x', 80 + idx * roundSpacing + roundSpacing / 2)
                .attr('y', 40)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('font-weight', 'bold')
                .attr('fill', '#1f2937')
                .text(`Round ${round.round_number}`);

            svg.append('text')
                .attr('x', 80 + idx * roundSpacing + roundSpacing / 2)
                .attr('y', 60)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('fill', '#6b7280')
                .text(`Avg: ${(round.avg_score ?? 0).toFixed(1)}`);
        });

    }, [rounds]);

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>How to read:</strong> Each bar represents a reasoning trace. Length = quality score (1-10).
                    Golden traces (⭐) are used as examples for the next round. Click bars to see details.
                </p>
            </div>

            <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg p-4">
                <svg ref={svgRef} className="mx-auto" />
            </div>

            {selectedNode && (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Round {selectedNode.round}, Trace {selectedNode.trace_index + 1}
                            {selectedNode.is_golden && ' ⭐'}
                        </h4>
                        <span className="text-base font-bold px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            Score: {(selectedNode.score ?? 0).toFixed(1)}/10
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reasoning</div>
                        <div className="prose prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed max-h-96 overflow-y-auto">
                            <ReactMarkdown>{selectedNode.reasoning_text}</ReactMarkdown>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Final Answer</div>
                            <div className="text-base font-medium text-gray-900 dark:text-white">{selectedNode.final_answer}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
