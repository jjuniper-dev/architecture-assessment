import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DesignGallery from './gallery/DesignGallery';
import './styles.css';

type BranchContext = { questionId: string; variants: Record<string, string>; defaultText: string };
type Question = { id: string; code: string; track: 'baseline' | 'track1' | 'track2' | 'optional'; dimension: string; prompt: string; type: 'likert' | 'single' | 'multi' | 'text'; required?: boolean; options?: { value: string; label: string }[]; branchContext?: BranchContext };
type Config = { title: string; version: string; audience: string; completionTime: string; privacy: string; decisionUse: string; track2Label: string; questions: Question[] };

const orgs = ['HC', 'PHAC', 'Shared/Joint', 'Other'];
const roles = ['CIO', 'EA Director', 'Data Platform Director', 'Other'];

function App() {
  const [view, setView] = useState<'assessment' | 'gallery'>('assessment');
  const [config, setConfig] = useState<Config | null>(null);
  const [metadata, setMetadata] = useState({ org: 'HC', role: 'EA Director', includeTrack2: false });
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [results, setResults] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetch('/api/questions').then((r) => r.json()).then(setConfig); }, []);
  function refreshResults() { fetch('/api/results').then((r) => r.json()).then(setResults); }

  const nav = <nav className="mx-auto max-w-6xl px-6 pt-6">
    <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
      <button className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === 'assessment' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setView('assessment')}>Assessment</button>
      <button className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === 'gallery' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setView('gallery')}>Design Gallery</button>
    </div>
  </nav>;

  if (view === 'gallery') {
    return <main className="min-h-screen bg-slate-50 text-slate-900">
      {nav}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <DesignGallery />
      </section>
    </main>;
  }

  if (!config) return <main className="min-h-screen bg-slate-50 text-slate-900">{nav}<p className="p-8">Loading…</p></main>;
  const questions = config.questions.filter((q) => q.track !== 'track2' || metadata.includeTrack2);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch('/api/responses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metadata, answers }) });
    if (!res.ok) { alert(await res.text()); return; }
    setSubmitted(true);
    refreshResults();
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    {nav}
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Architecture evidence-gathering instrument · Version {config.version}</p>
        <h1 className="mt-2 text-3xl font-bold">{config.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Audience: {config.audience}. Completion time: {config.completionTime}.</p>
        <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-950">{config.privacy}</p>
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{config.decisionUse}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <section>
            <h2 className="text-xl font-semibold">Respondent metadata</h2>
            <p className="text-sm text-slate-600">Do not enter names. Org and role are collected once at the start, stored separately from answers, and reported only in aggregate.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Organization<select className="mt-1 w-full rounded border p-2" value={metadata.org} onChange={(e) => setMetadata({ ...metadata, org: e.target.value })}>{orgs.map((o) => <option key={o}>{o}</option>)}</select></label>
              <label className="block text-sm font-medium">Role<select className="mt-1 w-full rounded border p-2" value={metadata.role} onChange={(e) => setMetadata({ ...metadata, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</select></label>
            </div>
            <label className="mt-4 flex gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={metadata.includeTrack2} onChange={(e) => setMetadata({ ...metadata, includeTrack2: e.target.checked })}/><span><b>{config.track2Label}</b></span></label>
          </section>
          {(['baseline', 'track1', 'track2', 'optional'] as const).map((track) => {
            const trackQuestions = questions.filter((q) => q.track === track);
            if (!trackQuestions.length) return null;
            return <section key={track} className="space-y-4">
              <h2 className="border-t pt-5 text-xl font-semibold">{track === 'baseline' ? 'Baseline assessment — familiarity gate questions' : track === 'track1' ? 'Track 1 — Executive Alignment' : track === 'track2' ? config.track2Label : 'Optional — Open Comments'}</h2>
              {track === 'baseline' && <p className="text-sm text-slate-600">Rate your familiarity on a scale where 1 = Not familiar, 5 = Very familiar.</p>}
              {trackQuestions.map((q) => <QuestionCard key={q.id} question={q} answers={answers} onChange={(value) => setAnswers({ ...answers, [q.id]: value })}/>) }
            </section>;
          })}
          <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">Submit assessment</button>
          {submitted && <p className="rounded bg-green-50 p-3 text-green-800">Response stored. Thank you.</p>}
        </form>
        <ResultsPanel results={results} submitted={submitted} />
      </div>
    </section>
  </main>;
}

function branchHint(question: Question, answers: Record<string, string | string[]>) {
  if (!question.branchContext) return null;
  const selected = answers[question.branchContext.questionId];
  const key = typeof selected === 'string' ? selected : '';
  return question.branchContext.variants[key] ?? question.branchContext.defaultText;
}

function QuestionCard({ question, answers, onChange }: { question: Question; answers: Record<string, string | string[]>; onChange: (v: string | string[]) => void }) {
  const value = answers[question.id];
  return <div className="rounded-xl border border-slate-200 p-4">
    <p className="text-xs font-semibold uppercase text-slate-500">{question.code} · {question.dimension}</p>
    <label className="mt-1 block font-medium">{question.prompt}{question.required && <span className="text-red-600"> *</span>}</label>
    {branchHint(question, answers) && <p className="mt-2 rounded bg-indigo-50 p-2 text-sm text-indigo-950">{branchHint(question, answers)}</p>}
    {question.type === 'text' && <textarea className="mt-3 min-h-24 w-full rounded border p-2" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />}
    {['likert', 'single'].includes(question.type) && <div className="mt-3 grid gap-2">{question.options?.map((o) => <label key={o.value} className="flex gap-2 text-sm"><input required={question.required} name={question.id} type="radio" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />{o.label}</label>)}</div>}
    {question.type === 'multi' && <div className="mt-3 grid gap-2">{question.options?.map((o) => <label key={o.value} className="flex gap-2 text-sm"><input type="checkbox" checked={Array.isArray(value) && value.includes(o.value)} onChange={(e) => { const arr = Array.isArray(value) ? value : []; onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value)); }} />{o.label}</label>)}</div>}
  </div>;
}

function ResultsPanel({ results, submitted }: { results: any; submitted: boolean }) {
  if (!submitted) return <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-semibold">Results visibility</h2><p className="mt-2 text-sm text-slate-600">Aggregate results are not shown while a respondent is completing the assessment.</p></aside>;
  if (!results) return null;
  const visible = results.visibility?.visible;
  return <aside className="space-y-6">
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold">Aggregate results</h2>
      <p className="mt-2 text-sm text-slate-600">Responses: {results.visibility.responseCount}. {results.visibility.reason}</p>
      <a className="mt-4 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href="/api/export.csv">Download anonymized CSV</a>
    </div>
    {visible && <>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="font-semibold">Architecture Alignment Heatmap</h3><div className="mt-3 space-y-3">{results.heatmap?.map((h: any) => <div key={h.questionId} className="text-sm"><div className="flex justify-between gap-3"><span>{h.code}: {h.dimension}</span><span className="font-semibold">{h.alignment}</span></div><p className="text-slate-600">{h.leadingLabel ?? 'No responses'} · {h.leadingPercent}%</p></div>)}</div></div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="font-semibold">Consensus summary</h3><p className="mt-2 text-sm">High: {results.consensusSummary?.high}; Medium: {results.consensusSummary?.medium}; Low: {results.consensusSummary?.low}</p></div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="font-semibold">Text response themes</h3><p className="mt-2 text-sm">Theme extraction is grouped by question and includes small verbatim examples in the ARB export payload.</p></div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="font-semibold">ARB decision package draft</h3><p className="mt-2 text-sm">{results.arbDraft?.executiveSummary}</p><p className="mt-2 text-sm"><b>Low alignment:</b> {results.arbDraft?.lowAlignmentAreas?.join(', ') || 'None detected'}</p></div>
    </> }
  </aside>;
}

createRoot(document.getElementById('root')!).render(<App />);
