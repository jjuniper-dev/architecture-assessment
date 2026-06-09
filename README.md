# HC/PHAC Architecture Alignment Assessment

A lightweight internal web app for gathering architecture alignment evidence. One way to think about it: the app separates three things that are often conflated in meetings — respondent context, structured alignment signals, and aggregate decision evidence.

## What it is

- React + TypeScript frontend
- Tailwind CSS UI
- Node.js + Express backend
- SQLite persistence
- Dockerized deployment
- Default port: `8090`, configurable with `ASSESSMENT_PORT`
- Minimum aggregate visibility threshold: `15` responses by default
- No authentication for MVP

This is **not** a poll or voting tool. It is an architecture evidence-gathering instrument.

## Privacy and decision-use statements

- "Results will be reported only in aggregate. Individual responses will not be attributed."
- "This assessment does not make the decision. It identifies where alignment exists, where executive decision is required, and which unresolved issues should be brought to ARB."

The app does not collect names. Organization and role metadata are stored in the `respondents` table, while answers are stored in the `answers` table.

## Question configuration

The seeded question set lives in:

- `server/src/questions.ts`

It includes:

- Baseline gate familiarity questions for PATH, HAIL, Purview, Databricks/Fabric, HC/PHAC AI Governance, and Enterprise Data Strategy
- Track 1 executive alignment questions Q1-Q5B from the final June 2026 question set
- Optional Track 2 deep-dive questions Q6-Q13 from the final June 2026 question set, labelled: "Architecture Detail — recommended for EA/Data Platform respondents; optional for CIOs."
- Branching logic: Track 2 questions are shown and stored only when the respondent opts in; Q6 references Q3, Q7 references Q1, and Q10/Q12 reference Q2.

## SQLite schema and migrations

The migration is stored at:

- `server/migrations/001_initial_assessment_schema.sql`

Runtime migration execution is implemented in:

- `server/src/db.ts`

Tables:

- `assessment_settings` — survey state, including `survey_closed`
- `respondents` — anonymous respondent id plus org/role metadata
- `answers` — question answers keyed by anonymous respondent id
- `migrations` — applied migration tracking

## Local development

```bash
npm install
npm run dev
```

Frontend dev server: <http://localhost:5173>
Backend API: <http://localhost:8090>

## Production-style local run

```bash
npm install
npm run build
PORT=8090 DB_PATH=./data/assessment.sqlite npm start
```

Open <http://localhost:8090>.

## Docker run

Standalone:

```bash
docker compose up -d --build
```

Change host port if needed:

```bash
ASSESSMENT_PORT=8091 docker compose up -d --build
```

## Export instructions

Download anonymized CSV from the UI or call:

```bash
curl -o hc-phac-architecture-assessment-anonymized.csv http://localhost:8090/api/export.csv
```

The CSV includes anonymous respondent ids, org, role, Track 2 flag, submitted timestamp, question id, and value. It does not include names.

Download the ARB draft package as Markdown:

```bash
curl -o hc-phac-arb-decision-package-draft.md http://localhost:8090/api/arb.md
```

## Result visibility and suppression

Aggregate results are hidden until either:

1. The survey is closed, or
2. The minimum response threshold is reached.

Defaults:

- `MIN_PUBLIC_RESPONSES=15`
- `MIN_SEGMENT_RESPONSES=3`

HC vs PHAC divergence and role-based analyses suppress groups below `MIN_SEGMENT_RESPONSES` to reduce re-identification risk.

To close the survey for MVP administration:

```bash
curl -X POST http://localhost:8090/api/admin/close \
  -H 'Content-Type: application/json' \
  -d '{"closed":true}'
```

## Generated outputs

The `/api/results` endpoint generates:

- Architecture Alignment Heatmap with High/Medium/Low alignment index by question
- Familiarity-weighted analysis showing raw agreement, ≥4-familiarity agreement, and divergence
- HC vs PHAC divergence analysis with differences above 20 percentage points flagged for ARB
- Role-based analysis where sample size allows
- Text response themes by question, with short verbatim examples
- ARB decision package draft output

Mechanically, the alignment index follows the final methodology:

- High: more than 70% on any single choice
- Medium: 50-70% on the leading choice
- Low: less than 50% on the leading choice

A mock ARB output sample is included at:

- `samples/mock-arb-output.md`

## Tests

```bash
npm test
```

Covered areas:

- Aggregation visibility threshold
- Survey-close result visibility
- Sample-size suppression
- Track 2 branching/storage behavior
