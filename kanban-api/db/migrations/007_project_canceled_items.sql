-- Project-scoped canceled items shared by all project members.

CREATE TABLE canceled_column_groups (
  canceled_group_id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  column_name VARCHAR(100) NOT NULL,
  canceled_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  canceled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE canceled_cards (
  canceled_card_id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  canceled_group_id INTEGER REFERENCES canceled_column_groups(canceled_group_id) ON DELETE CASCADE,
  created_by_user_id INTEGER NOT NULL REFERENCES users(user_id),
  assigned_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  original_column_name VARCHAR(100) NOT NULL,
  canceled_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  canceled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_canceled_groups_project_created
  ON canceled_column_groups(project_id, canceled_at DESC);

CREATE INDEX idx_canceled_cards_project_created
  ON canceled_cards(project_id, canceled_at DESC);

CREATE INDEX idx_canceled_cards_group
  ON canceled_cards(canceled_group_id);
