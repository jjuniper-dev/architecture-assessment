# Draft ARB Decision Package — HC/PHAC Architecture Alignment

**Mock evidence base:** 8 pilot-style anonymized responses. Results are aggregate only. Org and role splits below the minimum sample threshold are suppressed.

## Executive summary

The mock data suggests medium alignment on the broad enterprise-platform direction, low alignment on operating ownership, and a likely awareness gap on data-platform technology choices. This package does not make the decision. It identifies where ARB discussion is likely required.

## Architecture Alignment Heatmap

| Question | Topic | Leading result | Alignment |
|---|---|---|---|
| Q1 | Operating Model Architecture | Enterprise AI Platform (65%) | Medium |
| Q2 | Platform Operating Model | Shared platform with clear separation (78%) | High |
| Q3 | Governance Enforcement Timing | Both pre-flight and runtime (72%) | High |
| Q4 | Data Governance Sequencing | Data strategy first (60%) | Medium |
| Q5A | Policy Authority | Joint policy board (68%) | Medium |
| Q5B | Architecture Authority | ARB joint EA leadership (74%) | High |
| Q9 | Data Platform Technology | Both Databricks and Fabric (50%) | Medium |

## Familiarity-weighted signals

| Question | Raw agreement | Weighted agreement (≥4 familiarity) | Divergence |
|---|---:|---:|---:|
| Q4 | 60% | 78% | +18% |
| Q9 | 50% | 72% | +22% |

Interpretation: data governance and platform technology answers appear sensitive to baseline familiarity. ARB should avoid treating those raw percentages as simple preference signals.

## HC vs PHAC divergence

| Question | HC support | PHAC support | Divergence | Interpretation |
|---|---:|---:|---:|---|
| Q2 | 82% | 41% | 41% | Major misalignment; ARB discussion required |
| Q4 | 70% | 55% | 15% | Minor difference |
| Q5A | 68% | 72% | 4% | Aligned |

## Text response themes

### Q2 Text Responses (n=8)

- Organizational autonomy concern — 3 responses
- Funding model unclear — 2 responses
- Control plane / runtime split unclear — 2 responses
- Timeline / sequencing risk — 1 response

### Q13 Text Responses (n=8)

- Architecture mismatch across PATH/HAIL/Purview/Fabric — 4 responses
- Data readiness and lineage — 2 responses
- Governance bottleneck — 1 response
- Funding sustainability — 1 response

## Suggested ARB ask

Approve the target direction with conditions:

1. Confirm the shared vs separated operating model for PATH, HAIL, Purview, and data platform capabilities.
2. Decide whether data governance is a prerequisite, parallel track, or post-platform hardening activity.
3. Assign policy authority and architecture authority explicitly.
4. Require an implementation decision record for any intentional HC/PHAC divergence.

## Recommended next steps

- Validate the alignment index with the 6-8 respondent pilot cohort.
- Review any HC/PHAC divergence above 20 percentage points before full rollout.
- Use text themes to refine wording where respondents identify ambiguity.
