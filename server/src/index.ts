import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { aggregateResults, arbMarkdown, csvExport } from './analysis.js';
import { openDb, setSurveyClosed } from './db.js';
import { galleryDiagrams, redrawNotConfigured, suggestTitle } from './gallery.js';
import { questionConfig, visibleQuestions } from './questions.js';

const metadataSchema = z.object({
  org: z.enum(['HC', 'PHAC', 'Shared/Joint', 'Other']),
  role: z.enum(['CIO', 'EA Director', 'Data Platform Director', 'Other']),
  includeTrack2: z.boolean().default(false)
});

const submitSchema = z.object({
  metadata: metadataSchema,
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
});

export function createApp(dbPath?: string) {
  const { db, migrate } = openDb(dbPath);
  migrate();
  const app = express();
  app.locals.db = db;
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/questions', (_req, res) => res.json(questionConfig));

  app.get('/api/gallery/diagrams', (_req, res) => res.json(galleryDiagrams));

  app.post('/api/gallery/suggest-title', (req, res) => {
    const parsed = z.object({ id: z.string() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
    const diagram = galleryDiagrams.find((d) => d.id === parsed.data.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    res.json(suggestTitle(diagram));
  });

  app.post('/api/gallery/redraw', (req, res) => {
    const parsed = z.object({ id: z.string(), instructions: z.string().min(1).max(2000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request payload', details: parsed.error.flatten() });
    const diagram = galleryDiagrams.find((d) => d.id === parsed.data.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    res.json(redrawNotConfigured());
  });

  app.post('/api/responses', (req, res) => {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid response payload', details: parsed.error.flatten() });
    const { metadata, answers } = parsed.data;
    const required = visibleQuestions(metadata.includeTrack2).filter((q) => q.required);
    const missing = required.filter((q) => answers[q.id] === undefined || answers[q.id] === '').map((q) => q.id);
    if (missing.length) return res.status(400).json({ error: 'Missing required answers', missing });

    const id = crypto.randomUUID();
    const tx = db.transaction(() => {
      db.prepare('INSERT INTO respondents (id, org, role, include_track2) VALUES (?, ?, ?, ?)').run(id, metadata.org, metadata.role, metadata.includeTrack2 ? 1 : 0);
      const insert = db.prepare('INSERT INTO answers (respondent_id, question_id, value) VALUES (?, ?, ?)');
      for (const q of visibleQuestions(metadata.includeTrack2)) {
        const raw = answers[q.id];
        if (raw === undefined || raw === '') continue;
        insert.run(id, q.id, Array.isArray(raw) ? raw.join(',') : raw);
      }
    });
    tx();
    res.status(201).json({ id, message: 'Response stored without name or direct identifier.' });
  });

  app.get('/api/results', (_req, res) => res.json(aggregateResults(db)));
  app.get('/api/arb.md', (_req, res) => {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hc-phac-arb-decision-package-draft.md"');
    res.send(arbMarkdown(db));
  });

  app.get('/api/export.csv', (_req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hc-phac-architecture-assessment-anonymized.csv"');
    res.send(csvExport(db));
  });
  app.post('/api/admin/close', (req, res) => {
    const closed = Boolean(req.body?.closed ?? true);
    setSurveyClosed(db, closed);
    res.json({ surveyClosed: closed });
  });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDir = path.resolve(__dirname, '../client');
  app.use(express.static(clientDir));
  app.get(/.*/, (_req, res, next) => {
    const index = path.join(clientDir, 'index.html');
    res.sendFile(index, (err) => { if (err) next(); });
  });
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 8090);
  createApp().listen(port, () => console.log(`HC/PHAC assessment listening on ${port}`));
}
