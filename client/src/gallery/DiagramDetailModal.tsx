import { useState } from 'react';
import { diagramSvgMarkup } from './diagramSvg';
import type { GalleryDiagram, RedrawResult, TitleSuggestion } from './types';

export default function DiagramDetailModal({ diagram, onClose }: { diagram: GalleryDiagram; onClose: () => void }) {
  const [instructions, setInstructions] = useState('');
  const [redrawResult, setRedrawResult] = useState<RedrawResult | null>(null);
  const [redrawing, setRedrawing] = useState(false);
  const [titleSuggestion, setTitleSuggestion] = useState<TitleSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  async function requestRedraw() {
    if (!instructions.trim()) return;
    setRedrawing(true);
    setRedrawResult(null);
    try {
      const res = await fetch('/api/gallery/redraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: diagram.id, instructions })
      });
      setRedrawResult(await res.json());
    } finally {
      setRedrawing(false);
    }
  }

  async function requestTitleSuggestion() {
    setSuggesting(true);
    setTitleSuggestion(null);
    try {
      const res = await fetch('/api/gallery/suggest-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: diagram.id })
      });
      setTitleSuggestion(await res.json());
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{diagram.category}</p>
            <h3 className="mt-1 text-2xl font-bold">{diagram.title}</h3>
          </div>
          <button className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
          dangerouslySetInnerHTML={{ __html: diagramSvgMarkup(diagram, { width: 640, height: 360 }) }}
        />

        <p className="mt-4 text-sm text-slate-700">{diagram.description}</p>

        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-500">Source filename</dt>
            <dd className="break-all font-mono text-xs text-slate-700">{diagram.filename}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Tags</dt>
            <dd className="text-slate-700">{diagram.tags.join(', ')}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h4 className="font-semibold">Suggest a title</h4>
          <p className="mt-1 text-sm text-slate-600">
            Have the assistant read this diagram's content and recommend a title and filename in your existing naming
            convention.
          </p>
          <button
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={requestTitleSuggestion}
            disabled={suggesting}
          >
            {suggesting ? 'Thinking…' : 'Suggest a title'}
          </button>
          {titleSuggestion && (
            <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-950">
              <p>
                <b>Suggested title:</b> {titleSuggestion.suggestedTitle}
              </p>
              <p className="mt-1 break-all">
                <b>Suggested filename:</b> <span className="font-mono text-xs">{titleSuggestion.suggestedFilename}</span>
              </p>
              <p className="mt-1 text-indigo-800">{titleSuggestion.rationale}</p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <h4 className="font-semibold">Describe a change you'd like to see</h4>
          <p className="mt-1 text-sm text-slate-600">
            Tell the assistant how you'd like this starting point adapted, then ask it to redraw the diagram.
          </p>
          <textarea
            className="mt-3 min-h-24 w-full rounded border p-2 text-sm"
            placeholder="e.g. Split the orders service into orders and fulfillment, and add a caching layer in front of the API gateway."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <button
            className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            onClick={requestRedraw}
            disabled={redrawing || !instructions.trim()}
          >
            {redrawing ? 'Redrawing…' : 'Redraw with AI'}
          </button>
          {redrawResult && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{redrawResult.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
