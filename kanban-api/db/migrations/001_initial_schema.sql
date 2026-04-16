-- ROLES (seed immediately after creation)
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO roles (role_name, description) VALUES
  ('owner', 'Full control over the project'),
  ('admin', 'Can manage members and content'),
  ('member', 'Can create and edit cards'),
  ('viewer', 'Read-only access');

-- USERS
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  theme VARCHAR(20) DEFAULT 'light',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  job_title VARCHAR(100),
  location VARCHAR(100),
  website_url TEXT,
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE projects (
  project_id SERIAL PRIMARY KEY,
  owner_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_MEMBERS
CREATE TABLE project_members (
  project_member_id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- COLUMNS
CREATE TABLE columns (
  column_id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  created_by_user_id INTEGER NOT NULL REFERENCES users(user_id),
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CARDS
CREATE TABLE cards (
  card_id SERIAL PRIMARY KEY,
  column_id INTEGER NOT NULL REFERENCES columns(column_id) ON DELETE CASCADE,
  created_by_user_id INTEGER NOT NULL REFERENCES users(user_id),
  assigned_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTACHMENTS
CREATE TABLE attachments (
  attachment_id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  uploaded_by_user_id INTEGER NOT NULL REFERENCES users(user_id),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CARD_ACTIVITY
CREATE TABLE card_activity (
  activity_id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  action_type VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_owner ON projects(owner_user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_columns_project ON columns(project_id);
CREATE INDEX idx_cards_column ON cards(column_id);
CREATE INDEX idx_cards_assigned ON cards(assigned_user_id);
CREATE INDEX idx_comments_card ON comments(card_id);
CREATE INDEX idx_activity_card ON card_activity(card_id);
