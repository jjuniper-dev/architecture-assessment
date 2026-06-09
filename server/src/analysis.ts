import type { Database as SqliteDatabase } from 'better-sqlite3';
import { isSurveyClosed } from './db.js';
import { MIN_PUBLIC_RESPONSES, MIN_SEGMENT_RESPONSES, questionConfig } from './questions.js';

export interface AnswerRow { respondent_id: string; org: string; role: string; question_id: string; value: string }
export interface ResultsVisibility { visible: boolean; reason: string; responseCount: number; surveyClosed: boolean; minimumThreshold: number }

const choiceQuestions = questionConfig.questions.filter((q) => q.analysis === 'choice_alignment');
const familiarityQuestions = questionConfig.questions.filter((q) => q.analysis === 'familiarity');
const textQuestions = questionConfig.questions.filter((q) => q.analysis === 'theme');
const labelFor = (questionId: string, value: string) => questionConfig.questions.find((q) => q.id === questionId)?.options?.find((o) => o.value === value)?.label ?? value;

export function getVisibility(db: SqliteDatabase): ResultsVisibility {
  const responseCount = (db.prepare('SELECT COUNT(*) as count FROM respondents').get() as { count: number }).count;
  const surveyClosed = isSurveyClosed(db);
  const visible = surveyClosed || responseCount >= MIN_PUBLIC_RESPONSES;
  return {
    visible,
    responseCount,
    surveyClosed,
    minimumThreshold: MIN_PUBLIC_RESPONSES,
    reason: visible ? 'Aggregate results are available.' : `Aggregate results are hidden until the survey closes or at least ${MIN_PUBLIC_RESPONSES} responses are received.`
  };
}

function rows(db: SqliteDatabase): AnswerRow[] {
  return db.prepare(`SELECT r.id as respondent_id, r.org, r.role, a.question_id, a.value
    FROM respondents r JOIN answers a ON a.respondent_id = r.id`).all() as AnswerRow[];
}

function pct(numerator: number, denominator: number): number { return denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0; }
function alignmentLevel(leadingPercent: number): 'High' | 'Medium' | 'Low' {
  if (leadingPercent > 70) return 'High';
  if (leadingPercent >= 50) return 'Medium';
  return 'Low';
}
function countChoices(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => { acc[value] = (acc[value] ?? 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
function respondentFamiliarity(all: AnswerRow[]) {
  const respondents = [...new Set(all.map((r) => r.respondent_id))];
  const scores = new Map<string, number>();
  for (const id of respondents) {
    const vals = all.filter((r) => r.respondent_id === id && familiarityQuestions.some((q) => q.id === r.question_id)).map((r) => Number(r.value)).filter(Number.isFinite);
    scores.set(id, vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  }
  return scores;
}

export function aggregateResults(db: SqliteDatabase) {
  const visibility = getVisibility(db);
  if (!visibility.visible) return { visibility };
  const all = rows(db);
  const heatmap = alignmentHeatmap(all);
  return {
    visibility,
    heatmap,
    consensusSummary: {
      high: heatmap.filter((h) => h.alignment === 'High').length,
      medium: heatmap.filter((h) => h.alignment === 'Medium').length,
      low: heatmap.filter((h) => h.alignment === 'Low').length
    },
    familiarityWeighted: familiarityWeighted(all),
    hcVsPhac: organizationalDivergence(all),
    roleBased: roleBased(all),
    themes: textThemes(all),
    arbDraft: arbDraft(heatmap, all)
  };
}

export function alignmentHeatmap(all: AnswerRow[]) {
  return choiceQuestions.map((q) => {
    const vals = all.filter((r) => r.question_id === q.id).map((r) => r.value);
    const counts = countChoices(vals);
    const total = vals.length;
    const [leadingChoice, leadingCount = 0] = counts[0] ?? ['', 0];
    const leadingPercent = pct(leadingCount, total);
    return {
      questionId: q.id,
      code: q.code,
      dimension: q.dimension,
      prompt: q.prompt,
      total,
      leadingChoice,
      leadingLabel: leadingChoice ? labelFor(q.id, leadingChoice) : null,
      leadingPercent,
      alignment: alignmentLevel(leadingPercent),
      distribution: counts.map(([choice, count]) => ({ choice, label: labelFor(q.id, choice), count, percent: pct(count, total) }))
    };
  });
}

export function familiarityWeighted(all: AnswerRow[]) {
  const familiarity = respondentFamiliarity(all);
  return choiceQuestions.map((q) => {
    const values = all.filter((r) => r.question_id === q.id);
    const rawCounts = countChoices(values.map((r) => r.value));
    const total = values.length;
    const [leadingChoice, leadingCount = 0] = rawCounts[0] ?? ['', 0];
    const rawAgreement = pct(leadingCount, total);
    const informed = values.filter((r) => (familiarity.get(r.respondent_id) ?? 0) >= 4);
    const informedSame = informed.filter((r) => r.value === leadingChoice).length;
    const weightedAgreement = pct(informedSame, informed.length);
    const divergence = Number((weightedAgreement - rawAgreement).toFixed(1));
    return {
      questionId: q.id,
      code: q.code,
      dimension: q.dimension,
      leadingChoice,
      leadingLabel: leadingChoice ? labelFor(q.id, leadingChoice) : null,
      rawAgreement,
      weightedAgreement,
      informedCount: informed.length,
      divergence,
      flag: Math.abs(divergence) > 15 ? 'Awareness gap likely affects aggregate result' : null
    };
  });
}

export function organizationalDivergence(all: AnswerRow[]) {
  return segmentDivergence(all, 'org', ['HC', 'PHAC']);
}

export function segmentDivergence(all: AnswerRow[], field: 'org' | 'role', allowed?: string[]) {
  return choiceQuestions.map((q) => {
    const overall = countChoices(all.filter((r) => r.question_id === q.id).map((r) => r.value));
    const [leadingChoice] = overall[0] ?? [''];
    const groups = new Map<string, AnswerRow[]>();
    for (const row of all.filter((r) => r.question_id === q.id)) {
      const key = row[field];
      if (allowed && !allowed.includes(key)) continue;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    const visibleGroups = [...groups.entries()]
      .filter(([, vals]) => vals.length >= MIN_SEGMENT_RESPONSES)
      .map(([key, vals]) => {
        const support = vals.filter((r) => r.value === leadingChoice).length;
        return { segment: key, leadingChoiceSupport: pct(support, vals.length), count: vals.length };
      });
    const suppressed = [...groups.entries()].filter(([, vals]) => vals.length < MIN_SEGMENT_RESPONSES).map(([key]) => key);
    const percentages = visibleGroups.map((g) => g.leadingChoiceSupport);
    const divergence = percentages.length >= 2 ? Number((Math.max(...percentages) - Math.min(...percentages)).toFixed(1)) : null;
    return {
      questionId: q.id,
      code: q.code,
      dimension: q.dimension,
      leadingChoice,
      leadingLabel: leadingChoice ? labelFor(q.id, leadingChoice) : null,
      groups: visibleGroups,
      suppressed,
      divergence,
      flag: divergence !== null && divergence > 20 ? 'Requires ARB discussion' : null
    };
  });
}

export function roleBased(all: AnswerRow[]) { return segmentDivergence(all, 'role'); }

const themeKeywords: Record<string, string[]> = {
  'Organizational autonomy concern': ['autonomy', 'independent', 'federated', 'control', 'separate'],
  'Funding model unclear': ['funding', 'budget', 'cost', 'chargeback', 'sustainability'],
  'Control plane / runtime split unclear': ['control plane', 'runtime', 'path', 'hail', 'platform', 'separation'],
  'Timeline / sequencing risk': ['timeline', 'sequence', 'sequencing', 'parallel', 'first', 'delay'],
  'Data governance and lineage': ['data', 'lineage', 'purview', 'stewardship', 'quality'],
  'Policy and compliance enforcement': ['policy', 'compliance', 'audit', 'governance', 'risk'],
  'Interoperability / architecture mismatch': ['interoperability', 'integration', 'mismatch', 'architecture', 'standards']
};

export function textThemes(all: AnswerRow[]) {
  return textQuestions.map((q) => {
    const snippets = all.filter((r) => r.question_id === q.id).map((r) => r.value.trim()).filter(Boolean);
    const themes = Object.entries(themeKeywords).map(([theme, keywords]) => {
      const examples = snippets.filter((s) => keywords.some((k) => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 2);
      return { theme, count: examples.length, examples };
    }).filter((x) => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 4);
    return { questionId: q.id, code: q.code, dimension: q.dimension, responseCount: snippets.length, themes };
  });
}

export function arbDraft(heatmap: ReturnType<typeof alignmentHeatmap>, all: AnswerRow[]) {
  const themes = textThemes(all).flatMap((q) => q.themes.map((t) => ({ question: q.code, ...t })));
  return {
    title: 'Draft ARB Decision Package — HC/PHAC Architecture Alignment',
    executiveSummary: `Evidence from ${new Set(all.map((r) => r.respondent_id)).size} anonymized responses. This package identifies alignment and decision points; it is not a vote.`,
    highAlignmentAreas: heatmap.filter((h) => h.alignment === 'High').map((h) => `${h.code}: ${h.dimension}`),
    mediumAlignmentAreas: heatmap.filter((h) => h.alignment === 'Medium').map((h) => `${h.code}: ${h.dimension}`),
    lowAlignmentAreas: heatmap.filter((h) => h.alignment === 'Low').map((h) => `${h.code}: ${h.dimension}`),
    topConcerns: themes.sort((a, b) => b.count - a.count).slice(0, 6),
    recommendedNextSteps: [
      'Use low-alignment questions as the first ARB discussion agenda.',
      'Review HC/PHAC divergence flags above 20 percentage points before endorsing an operating model.',
      'Validate high-divergence familiarity-weighted results with a small expert review before full rollout.',
      'Convert unresolved authority, funding, and operations issues into explicit ARB decision records.'
    ]
  };
}

export function arbMarkdown(db: SqliteDatabase): string {
  const result = aggregateResults(db) as any;
  if (!result.visibility?.visible) return `# HC/PHAC Architecture Alignment Assessment\n\nAggregate results are not available yet. ${result.visibility?.reason ?? ''}\n`;
  const lines = [
    `# ${result.arbDraft.title}`,
    '',
    `## Executive Summary`,
    '',
    result.arbDraft.executiveSummary,
    '',
    `## Architecture Alignment Heatmap`,
    '',
    `| Question | Topic | Leading result | Alignment |`,
    `|---|---|---|---|`,
    ...result.heatmap.map((h: any) => `| ${h.code} | ${h.dimension} | ${h.leadingLabel ?? 'n/a'} (${h.leadingPercent}%) | ${h.alignment} |`),
    '',
    `## Familiarity-Weighted Analysis`,
    '',
    `| Question | Raw agreement | Weighted agreement (≥4 familiarity) | Divergence |`,
    `|---|---:|---:|---:|`,
    ...result.familiarityWeighted.map((h: any) => `| ${h.code} | ${h.rawAgreement}% | ${h.weightedAgreement}% | ${h.divergence}% |`),
    '',
    `## HC vs PHAC Divergence`,
    '',
    `| Question | Leading choice | Divergence | Flag |`,
    `|---|---|---:|---|`,
    ...result.hcVsPhac.map((h: any) => `| ${h.code} | ${h.leadingLabel ?? 'n/a'} | ${h.divergence ?? 'n/a'} | ${h.flag ?? ''} |`),
    '',
    `## Recommended Next Steps`,
    '',
    ...result.arbDraft.recommendedNextSteps.map((step: string) => `- ${step}`)
  ];
  return lines.join('\n');
}

export function csvExport(db: SqliteDatabase): string {
  const exportRows = db.prepare(`SELECT r.id as respondent_id, r.org, r.role, r.include_track2, r.submitted_at, a.question_id, a.value
    FROM respondents r JOIN answers a ON a.respondent_id = r.id ORDER BY r.submitted_at, a.question_id`).all() as Record<string, unknown>[];
  const headers = ['respondent_id', 'org', 'role', 'include_track2', 'submitted_at', 'question_id', 'value'];
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...exportRows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
}
