import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/src/index.js';

const tempDirs: string[] = [];
function appWithDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'assessment-'));
  tempDirs.push(dir);
  return createApp(path.join(dir, 'test.sqlite'));
}
afterEach(() => { for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

const baseAnswers = {
  b_path: '4', b_hail: '4', b_purview: '4', b_data_platform: '4', b_ai_governance: '4', b_enterprise_data_strategy: '4',
  q1_operating_model: 'B', q1_text: 'Shared runtime reduces duplication.',
  q2_platform_model: 'B', q2_text: 'Need clear separation and autonomy.',
  q3_governance_timing: 'C', q3_text: 'Runtime monitoring and pre-flight review both matter.',
  q4_data_sequence: 'A', q4_text: 'Lineage is needed before scale.',
  q5a_policy_authority: 'B', q5a_text: 'Joint policy avoids drift.',
  q5b_arch_authority: 'A', q5b_text: 'ARB can make cross-org decisions.'
};

async function submit(app: ReturnType<typeof createApp>, org = 'HC', role = 'EA Director', includeTrack2 = false) {
  return request(app).post('/api/responses').send({
    metadata: { org, role, includeTrack2 },
    answers: includeTrack2 ? {
      ...baseAnswers,
      q6_path_role: 'C', q7_hail_role: 'C', q7a_path_hail_relationship: 'B', q8_purview: 'A', q9_data_platform: 'C', q10_gov_ops: 'C', q11_funding: 'C', q12_operations_staffing: 'C', q13_risk: 'B', q13_text: 'PATH/HAIL/Purview interoperability is the risk.'
    } : baseAnswers
  });
}

describe('HC/PHAC assessment MVP', () => {
  it('suppresses aggregate results before close or minimum threshold', async () => {
    const app = appWithDb();
    await submit(app);
    const res = await request(app).get('/api/results').expect(200);
    expect(res.body.visibility.visible).toBe(false);
    expect(res.body.heatmap).toBeUndefined();
  });

  it('shows alignment-index heatmap once survey is closed', async () => {
    const app = appWithDb();
    await submit(app, 'HC');
    await request(app).post('/api/admin/close').send({ closed: true }).expect(200);
    const res = await request(app).get('/api/results').expect(200);
    expect(res.body.visibility.visible).toBe(true);
    expect(res.body.heatmap[0].alignment).toBe('High');
    expect(res.body.heatmap[0].leadingPercent).toBe(100);
    expect(res.body.familiarityWeighted[0].weightedAgreement).toBe(100);
  });

  it('suppresses HC vs PHAC divergence groups below sample-size threshold', async () => {
    const app = appWithDb();
    await submit(app, 'HC');
    await submit(app, 'PHAC');
    await request(app).post('/api/admin/close').send({ closed: true });
    const res = await request(app).get('/api/results').expect(200);
    expect(res.body.hcVsPhac[0].groups).toHaveLength(0);
    expect(res.body.hcVsPhac[0].suppressed).toContain('HC');
  });

  it('implements Track 2 branching by storing optional questions only when selected', async () => {
    const app = appWithDb();
    await submit(app, 'HC', 'Data Platform Director', true).expect(201);
    const csv = await request(app).get('/api/export.csv').expect(200);
    expect(csv.text).toContain('q6_path_role');
    expect(csv.text).toContain('q13_risk');
  });
});
