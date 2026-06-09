CREATE TABLE assessment_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE respondents (
  id TEXT PRIMARY KEY,
  org TEXT NOT NULL,
  role TEXT NOT NULL,
  include_track2 INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  respondent_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (respondent_id) REFERENCES respondents(id) ON DELETE CASCADE,
  UNIQUE(respondent_id, question_id)
);

CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_respondents_org_role ON respondents(org, role);
INSERT INTO assessment_settings (key, value) VALUES ('survey_closed', 'false');
