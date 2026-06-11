export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  accent?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface GalleryDiagram {
  id: string;
  filename: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** Path to a real diagram image (e.g. exported from PowerPoint/Lucidchart). When set, this is rendered instead of the generated node/edge SVG. */
  image?: string;
}

export interface TitleSuggestion {
  suggestedTitle: string;
  suggestedFilename: string;
  rationale: string;
  source: 'content-heuristic' | 'openai';
}

export type RedrawResult =
  | { status: 'not_configured'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ok'; imageUrl: string; message: string };
