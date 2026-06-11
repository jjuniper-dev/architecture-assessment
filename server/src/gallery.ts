import crypto from 'node:crypto';
import { GalleryDiagram, galleryDiagrams } from './galleryData.js';

function shortCode(): string {
  return crypto.randomBytes(2).toString('hex');
}

function toCamel(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function findFocusNode(diagram: GalleryDiagram) {
  const counts = new Map<string, number>();
  for (const n of diagram.nodes) counts.set(n.id, 0);
  for (const e of diagram.edges) {
    counts.set(e.from, (counts.get(e.from) ?? 0) + 1);
    counts.set(e.to, (counts.get(e.to) ?? 0) + 1);
  }
  const accent = diagram.nodes.find((n) => n.accent);
  if (accent) return accent;
  let best = diagram.nodes[0];
  let bestCount = -1;
  for (const n of diagram.nodes) {
    const c = counts.get(n.id) ?? 0;
    if (c > bestCount) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}

export interface TitleSuggestion {
  suggestedTitle: string;
  suggestedFilename: string;
  rationale: string;
  source: 'content-heuristic';
}

export function suggestTitle(diagram: GalleryDiagram): TitleSuggestion {
  const focus = findFocusNode(diagram);
  const focusLabel = focus.label.split('\n')[0];
  const suggestedTitle = `${diagram.category}: ${focusLabel} (${diagram.nodes.length} components, ${diagram.edges.length} connections)`;
  const descriptor = diagram.tags[0] ? toCamel(diagram.tags[0]) : 'Concept';
  const suggestedFilename = `img_${shortCode()}_${toCamel(diagram.title)}_${dateStamp()}_${shortCode()}_${descriptor}.png`;
  return {
    suggestedTitle,
    suggestedFilename,
    rationale: `Based on the diagram's ${diagram.nodes.length} components and ${diagram.edges.length} connections, "${focusLabel}" looks like the focal element, so it anchors the suggested title.`,
    source: 'content-heuristic'
  };
}

export interface RedrawResult {
  status: 'not_configured';
  message: string;
}

export function redrawNotConfigured(): RedrawResult {
  return {
    status: 'not_configured',
    message:
      'Image regeneration requires an image-generation provider (e.g. an OpenAI or Stability API key) to be configured on the server. This endpoint is wired up and ready - add the provider integration to enable it.'
  };
}

export { galleryDiagrams };
