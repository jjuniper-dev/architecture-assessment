export type Org = 'HC' | 'PHAC' | 'Shared/Joint' | 'Other';
export type Role = 'CIO' | 'EA Director' | 'Data Platform Director' | 'Other';
export type QuestionType = 'likert' | 'single' | 'multi' | 'text';
export type Track = 'baseline' | 'track1' | 'track2' | 'optional';

export interface QuestionOption { value: string; label: string }
export interface BranchContext {
  questionId: string;
  variants: Record<string, string>;
  defaultText: string;
}
export interface Question {
  id: string;
  code: string;
  track: Track;
  dimension: string;
  prompt: string;
  type: QuestionType;
  required?: boolean;
  options?: QuestionOption[];
  analysis?: 'choice_alignment' | 'familiarity' | 'theme';
  branchContext?: BranchContext;
}

export const MIN_PUBLIC_RESPONSES = Number(process.env.MIN_PUBLIC_RESPONSES ?? 15);
export const MIN_SEGMENT_RESPONSES = Number(process.env.MIN_SEGMENT_RESPONSES ?? 3);

export const familiarityOptions: QuestionOption[] = [
  { value: '1', label: '1 — Not familiar' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5 — Very familiar' }
];

const option = (letter: string, label: string): QuestionOption => ({ value: letter, label: `(${letter}) ${label}` });

export const questionConfig: { title: string; version: string; date: string; audience: string; completionTime: string; privacy: string; decisionUse: string; track2Label: string; questions: Question[] } = {
  title: 'HC/PHAC Architecture Alignment Assessment',
  version: '1.0',
  date: 'June 2026',
  audience: 'CIOs, EA Directors, Data Platform Directors (HC and PHAC)',
  completionTime: 'Track 1 ~4 min, Track 2 ~12 min (optional)',
  privacy: 'Results will be reported only in aggregate. Individual responses will not be attributed.',
  decisionUse: 'This assessment does not make the decision. It identifies where alignment exists, where executive decision is required, and which unresolved issues should be brought to ARB.',
  track2Label: 'Architecture Detail — recommended for EA/Data Platform respondents; optional for CIOs.',
  questions: [
    { id: 'b_path', code: 'PATH', track: 'baseline', dimension: 'Baseline familiarity', prompt: 'PATH (Protected AI Technology Hub)', type: 'likert', required: true, options: familiarityOptions, analysis: 'familiarity' },
    { id: 'b_hail', code: 'HAIL', track: 'baseline', dimension: 'Baseline familiarity', prompt: 'HAIL (Health AI Lab)', type: 'likert', required: true, options: familiarityOptions, analysis: 'familiarity' },
    { id: 'b_purview', code: 'Purview', track: 'baseline', dimension: 'Baseline familiarity', prompt: 'Purview (Data governance and lineage)', type: 'likert', required: true, options: familiarityOptions, analysis: 'familiarity' },
    { id: 'b_data_platform', code: 'Databricks/Fabric', track: 'baseline', dimension: 'Baseline familiarity', prompt: 'Databricks / Fabric (Data platform)', type: 'likert', required: true, options: familiarityOptions, analysis: 'familiarity' },
    { id: 'b_ai_governance', code: 'AI Governance', track: 'baseline', dimension: 'Baseline familiarity', prompt: 'HC/PHAC AI Governance framework', type: 'likert', required: true, options: familiarityOptions, analysis: 'familiarity' },
    { id: 'b_enterprise_data_strategy', code: 'Enterprise Data Strategy', track: 'baseline', dimension: 'Baseline familiarity', prompt: 'Enterprise Data Strategy', type: 'likert', required: true, options: familiarityOptions, analysis: 'familiarity' },

    { id: 'q1_operating_model', code: 'Q1', track: 'track1', dimension: 'Operating Model Architecture', prompt: 'HC/PHAC should adopt which operating model for AI adoption?', type: 'single', required: true, options: [
      option('A', 'Project-scoped AI — each initiative builds, governs, and operates independently'),
      option('B', 'Enterprise AI Platform — shared runtime, shared governance, shared data foundation across all initiatives'),
      option('C', 'Hybrid — some shared layers (e.g., data governance) with independent project execution'),
      option('D', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q1_text', code: 'Q1 follow-up', track: 'track1', dimension: 'Operating Model Architecture', prompt: 'What\'s driving your choice? (e.g., benefits you see, risks you\'re concerned about, organizational constraints)', type: 'text', analysis: 'theme' },

    { id: 'q2_platform_model', code: 'Q2', track: 'track1', dimension: 'Platform Operating Model', prompt: 'Which organizational and operational model is most likely to succeed for enterprise AI?', type: 'single', required: true, options: [
      option('A', 'Single unified enterprise platform operated jointly by HC and PHAC'),
      option('B', 'Shared platform with clear architectural separation (e.g., one organization operates governance/control, other operates runtime/data)'),
      option('C', 'Federated platforms (one per organization) with aligned standards and integration points'),
      option('D', 'Independent platforms per organization (minimal coordination)'),
      option('E', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q2_text', code: 'Q2 follow-up', track: 'track1', dimension: 'Platform Operating Model', prompt: 'What\'s your biggest concern with the model you selected? (e.g., organizational autonomy, cost, technical feasibility, governance clarity)', type: 'text', analysis: 'theme' },

    { id: 'q3_governance_timing', code: 'Q3', track: 'track1', dimension: 'Governance Enforcement Timing', prompt: 'AI governance and policy enforcement should primarily occur:', type: 'single', required: true, options: [
      option('A', 'Before deployment only — governance is pre-flight approval (plan-review-approve-deploy)'),
      option('B', 'At runtime, continuously — governance is observe-validate-enforce-monitor during execution'),
      option('C', 'Both equally important — pre-flight and continuous runtime governance'),
      option('D', 'Depends on the use case (project type, risk level, etc.)')
    ], analysis: 'choice_alignment' },
    { id: 'q3_text', code: 'Q3 follow-up', track: 'track1', dimension: 'Governance Enforcement Timing', prompt: 'Why? What\'s the implication for your programs or operations?', type: 'text', analysis: 'theme' },

    { id: 'q4_data_sequence', code: 'Q4', track: 'track1', dimension: 'Data Governance Sequencing', prompt: 'Before launching an enterprise AI platform, HC/PHAC\'s priority should be:', type: 'single', required: true, options: [
      option('A', 'Integrated enterprise data strategy first (unified data governance, lineage, access control) — platform comes after'),
      option('B', 'Platform infrastructure first (runtime, AI capabilities) — data strategy can be iterated in parallel or later'),
      option('C', 'Both in parallel (they\'re equally urgent)'),
      option('D', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q4_text', code: 'Q4 follow-up', track: 'track1', dimension: 'Data Governance Sequencing', prompt: 'What\'s your biggest concern about the sequencing you selected?', type: 'text', analysis: 'theme' },

    { id: 'q5a_policy_authority', code: 'Q5A', track: 'track1', dimension: 'Policy Authority', prompt: 'For enterprise AI governance, who should define policy (standards, compliance, risk thresholds)?', type: 'single', required: true, options: [
      option('A', 'OCDO sets enterprise AI policy; each ADM enforces in their program domain'),
      option('B', 'Joint policy board (both HC and PHAC representatives)'),
      option('C', 'Each organization sets its own policy with loose alignment'),
      option('D', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q5a_text', code: 'Q5A follow-up', track: 'track1', dimension: 'Policy Authority', prompt: 'Why? What\'s your constraint here?', type: 'text', analysis: 'theme' },

    { id: 'q5b_arch_authority', code: 'Q5B', track: 'track1', dimension: 'Architecture Authority', prompt: 'Who should define the enterprise architecture for AI platforms (PATH, HAIL, integration patterns)?', type: 'single', required: true, options: [
      option('A', 'Architecture Review Board (joint HC/PHAC EA leadership)'),
      option('B', 'EA Directors from both organizations jointly'),
      option('C', 'Each organization\'s EA leads separately, then coordinate'),
      option('D', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q5b_text', code: 'Q5B follow-up', track: 'track1', dimension: 'Architecture Authority', prompt: 'What authority structure would work for your organization?', type: 'text', analysis: 'theme' },

    { id: 'q6_path_role', code: 'Q6', track: 'track2', dimension: 'PATH Role Definition', prompt: 'Based on your governance timing choice (Q3), PATH should own:', type: 'single', required: true, branchContext: { questionId: 'q3_governance_timing', defaultText: 'Display both pre-flight and continuous runtime governance framings.', variants: { A: 'You selected pre-flight enforcement in Q3; consider PATH as an approval/control gate before deployment.', B: 'You selected continuous runtime governance in Q3; consider PATH as runtime observe-validate-enforce-monitor control.', C: 'You selected both pre-flight and runtime governance in Q3; consider PATH across both control moments.', D: 'You selected use-case-dependent governance in Q3; consider where PATH should vary by risk level.' } }, options: [
      option('A', 'AI execution patterns and runtime governance (how AI workloads run)'),
      option('B', 'Policy enforcement and auditability (compliance, access control, decision logging)'),
      option('C', 'Both equally'),
      option('D', 'Neither — PATH is not necessary'),
      option('E', 'Unclear what PATH\'s distinct role should be')
    ], analysis: 'choice_alignment' },
    { id: 'q6_text', code: 'Q6 follow-up', track: 'track2', dimension: 'PATH Role Definition', prompt: 'What capability is PATH missing today, or what\'s unclear about its purpose?', type: 'text', analysis: 'theme' },

    { id: 'q7_hail_role', code: 'Q7', track: 'track2', dimension: 'HAIL Role Definition', prompt: 'Based on your operating model choice (Q1), HAIL should own:', type: 'single', required: true, branchContext: { questionId: 'q1_operating_model', defaultText: 'Frame HAIL\'s role against the operating model you selected in Q1.', variants: { A: 'You selected project-scoped AI in Q1; consider whether HAIL enables independent project runtime needs.', B: 'You selected enterprise AI platform in Q1; consider HAIL as shared platform runtime.', C: 'You selected hybrid in Q1; consider what HAIL owns centrally versus what projects own.', D: 'You selected undecided in Q1; use this to clarify HAIL\'s possible role.' } }, options: [
      option('A', 'AI model inference and execution environment (where workloads run)'),
      option('B', 'Workload scheduling, resource optimization, and operational monitoring'),
      option('C', 'Both A and B'),
      option('D', 'Something different — describe in text'),
      option('E', 'Unclear what HAIL\'s distinct role should be')
    ], analysis: 'choice_alignment' },
    { id: 'q7_text', code: 'Q7 follow-up', track: 'track2', dimension: 'HAIL Role Definition', prompt: 'What\'s unclear about HAIL\'s role compared to other platforms (e.g., Foundry)?', type: 'text', analysis: 'theme' },

    { id: 'q7a_path_hail_relationship', code: 'Q7A', track: 'track2', dimension: 'PATH / HAIL Relationship', prompt: 'The relationship between PATH (governance/control plane) and HAIL (runtime environment) should be:', type: 'single', required: true, options: [
      option('A', 'They should converge into a single integrated platform'),
      option('B', 'They should remain separate but tightly integrated (PATH governs, HAIL executes)'),
      option('C', 'PATH should govern and control HAIL\'s behavior'),
      option('D', 'HAIL should subsume PATH functionality'),
      option('E', 'Unclear / depends on technical architecture decisions')
    ], analysis: 'choice_alignment' },
    { id: 'q7a_text', code: 'Q7A follow-up', track: 'track2', dimension: 'PATH / HAIL Relationship', prompt: 'Why? What\'s your reasoning?', type: 'text', analysis: 'theme' },

    { id: 'q8_purview', code: 'Q8', track: 'track2', dimension: 'Data Governance (Purview)', prompt: 'Enterprise data governance (Purview) is:', type: 'single', required: true, options: [
      option('A', 'A prerequisite for enterprise AI — you cannot govern AI without data lineage and governance in place'),
      option('B', 'A parallel track — AI governance can proceed independently of data governance'),
      option('C', 'Not yet relevant to HC/PHAC'),
      option('D', 'Critical but secondary (comes after AI platform is running)')
    ], analysis: 'choice_alignment' },
    { id: 'q8_text', code: 'Q8 follow-up', track: 'track2', dimension: 'Data Governance (Purview)', prompt: 'What\'s the biggest blocker to implementing enterprise data governance today?', type: 'text', analysis: 'theme' },

    { id: 'q9_data_platform', code: 'Q9', track: 'track2', dimension: 'Data Platform Technology', prompt: 'For the data platform layer (analytics, ML workloads, data transformation), the right technology choice is:', type: 'single', required: true, options: [
      option('A', 'Databricks — data engineering, analytics, machine learning platform'),
      option('B', 'Fabric — integrated Microsoft analytics and data platform'),
      option('C', 'Both for different workload types'),
      option('D', 'Neither — another technology'),
      option('E', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q9_text', code: 'Q9 follow-up', track: 'track2', dimension: 'Data Platform Technology', prompt: 'What\'s your biggest concern about your choice? (e.g., cost, vendor strategy, capability gaps, governance, interoperability, organizational preference)', type: 'text', analysis: 'theme' },

    { id: 'q10_gov_ops', code: 'Q10', track: 'track2', dimension: 'Governance Operations Ownership', prompt: 'Based on your shared ownership choice (Q2), governance and data governance operations should be run by:', type: 'single', required: true, branchContext: { questionId: 'q2_platform_model', defaultText: 'Frame operations ownership against your Q2 platform operating model choice.', variants: { A: 'You selected a single unified joint platform in Q2; consider what joint operations requires.', B: 'You selected shared platform with clear separation in Q2; consider how governance/control and runtime/data responsibilities are split.', C: 'You selected federated platforms in Q2; consider where common governance operations sit.', D: 'You selected independent platforms in Q2; consider the minimum viable cross-org governance operation.', E: 'You selected undecided in Q2; use this to clarify viable ownership.' } }, options: [
      option('A', 'PHAC (owns governance policy, standards, audit, compliance across enterprise)'),
      option('B', 'HC (owns governance because it operates enterprise platforms)'),
      option('C', 'Shared responsibility with clear boundaries — both orgs contribute'),
      option('D', 'Outsourced to external managed service provider'),
      option('E', 'Unclear')
    ], analysis: 'choice_alignment' },
    { id: 'q10_text', code: 'Q10 follow-up', track: 'track2', dimension: 'Governance Operations Ownership', prompt: 'What\'s your organizational constraint or preference here?', type: 'text', analysis: 'theme' },

    { id: 'q11_funding', code: 'Q11', track: 'track2', dimension: 'Operational Funding Model', prompt: 'The most sustainable funding model for shared platform operations is:', type: 'single', required: true, options: [
      option('A', 'Pooled operational budget — both organizations contribute proportionally to operating costs'),
      option('B', 'Usage-based — each program pays for what it consumes'),
      option('C', 'Hybrid — base operational costs shared, variable costs allocated by program'),
      option('D', 'Each organization funds independently'),
      option('E', 'Undecided')
    ], analysis: 'choice_alignment' },
    { id: 'q11_text', code: 'Q11 follow-up', track: 'track2', dimension: 'Operational Funding Model', prompt: 'What would make this work in your organization\'s budget model?', type: 'text', analysis: 'theme' },

    { id: 'q12_operations_staffing', code: 'Q12', track: 'track2', dimension: 'Day-to-Day Operations & Staffing', prompt: 'The shared platform should be operated by:', type: 'single', required: true, branchContext: { questionId: 'q2_platform_model', defaultText: 'Frame staffing against your Q2 platform operating model choice.', variants: { A: 'You selected a single unified joint platform in Q2; consider how one operations model coordinates both organizations.', B: 'You selected shared platform with clear separation in Q2; consider a hybrid/both-organizations staffing model.', C: 'You selected federated platforms in Q2; consider which staff operate common standards versus local platforms.', D: 'You selected independent platforms in Q2; consider what staffing still needs coordination.', E: 'You selected undecided in Q2; use this to clarify operational feasibility.' } }, options: [
      option('A', 'DTB data services team (operationalizes for both PHAC and HC workloads)'),
      option('B', 'HC enterprise platforms team (operationalizes for both organizations)'),
      option('C', 'Shared / hybrid operations team (staff from both organizations)'),
      option('D', 'Managed service provider (outsourced operations)'),
      option('E', 'Unclear / depends on technical architecture decisions')
    ], analysis: 'choice_alignment' },
    { id: 'q12_text', code: 'Q12 follow-up', track: 'track2', dimension: 'Day-to-Day Operations & Staffing', prompt: 'What\'s the biggest operational risk or constraint you see?', type: 'text', analysis: 'theme' },

    { id: 'q13_risk', code: 'Q13', track: 'track2', dimension: 'Top Risks & Blockers', prompt: 'Select the single biggest risk to HC/PHAC enterprise AI platform success:', type: 'single', required: true, options: [
      option('A', 'Governance bottleneck — policy enforcement is too slow or too rigid'),
      option('B', 'Architecture mismatch — platforms don\'t interoperate (PATH/HAIL/Purview/Fabric misalignment)'),
      option('C', 'Funding and sustainability — long-term operational costs are unsustainable'),
      option('D', 'Organizational misalignment — HC and PHAC can\'t agree on model or responsibilities'),
      option('E', 'Data readiness — data governance and integration not mature enough'),
      option('F', 'Something else')
    ], analysis: 'choice_alignment' },
    { id: 'q13_text', code: 'Q13 follow-up', track: 'track2', dimension: 'Top Risks & Blockers', prompt: 'Describe your concern. What would help mitigate this risk?', type: 'text', analysis: 'theme' },
    { id: 'optional_arb_comments', code: 'Optional comments', track: 'optional', dimension: 'Open Comments', prompt: 'Is there anything else ARB should know about your perspective on enterprise AI architecture for HC/PHAC?', type: 'text', analysis: 'theme' }
  ]
};

export function visibleQuestions(includeTrack2: boolean): Question[] {
  return questionConfig.questions.filter((q) => q.track !== 'track2' || includeTrack2);
}
