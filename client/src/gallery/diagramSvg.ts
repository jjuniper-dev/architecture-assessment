import type { DiagramNode, GalleryDiagram } from './types';

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function anchorPoint(node: DiagramNode, towardX: number, towardY: number) {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  if (Math.abs(dx) * node.h > Math.abs(dy) * node.w) {
    const x = dx > 0 ? node.x + node.w : node.x;
    const y = cy + (dy * (x - cx)) / dx;
    return { x, y };
  }
  const y = dy > 0 ? node.y + node.h : node.y;
  const x = cx + (dx * (y - cy)) / dy;
  return { x, y };
}

/** Renders a diagram's nodes/edges as a self-contained inline SVG markup string. */
export function diagramSvgMarkup(diagram: GalleryDiagram, size: { width: number; height: number }): string {
  const nodesById = new Map(diagram.nodes.map((n) => [n.id, n]));
  const arrowId = `arrow-${diagram.id}`;

  const edgesSvg = diagram.edges
    .map((edge) => {
      const from = nodesById.get(edge.from);
      const to = nodesById.get(edge.to);
      if (!from || !to) return '';
      const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
      const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
      const start = anchorPoint(from, toCenter.x, toCenter.y);
      const end = anchorPoint(to, fromCenter.x, fromCenter.y);
      const dash = edge.dashed ? ' stroke-dasharray="5,4"' : '';
      const labelSvg = edge.label
        ? `<text x="${(start.x + end.x) / 2}" y="${(start.y + end.y) / 2 - 4}" class="diagram-edge-label" text-anchor="middle">${escapeXml(edge.label)}</text>`
        : '';
      return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" class="diagram-edge"${dash} marker-end="url(#${arrowId})" />${labelSvg}`;
    })
    .join('');

  const nodesSvg = diagram.nodes
    .map((node) => {
      const lines = node.label.split('\n');
      const lineHeight = 13;
      const startY = node.y + node.h / 2 - ((lines.length - 1) * lineHeight) / 2;
      const tspans = lines
        .map((line, i) => `<tspan x="${node.x + node.w / 2}" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
        .join('');
      const cls = node.accent ? 'diagram-node diagram-node-accent' : 'diagram-node';
      return (
        `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="8" class="${cls}" />` +
        `<text text-anchor="middle" dominant-baseline="middle" class="diagram-node-label">${tspans}</text>`
      );
    })
    .join('');

  return `<svg viewBox="0 0 ${diagram.width} ${diagram.height}" width="${size.width}" height="${size.height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="diagram-svg">
    <defs><marker id="${arrowId}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" class="diagram-arrowhead" /></marker></defs>
    <g>${edgesSvg}</g>
    <g>${nodesSvg}</g>
  </svg>`;
}
