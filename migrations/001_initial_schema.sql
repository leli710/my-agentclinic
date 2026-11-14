CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ailments (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 120),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 3 AND 2000),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  treatment TEXT NOT NULL DEFAULT '' CHECK (length(treatment) <= 2000),
  outcome TEXT NOT NULL DEFAULT '' CHECK (length(outcome) <= 2000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_ailments_agent_id ON ailments(agent_id);
CREATE INDEX idx_ailments_status_severity ON ailments(status, severity);
