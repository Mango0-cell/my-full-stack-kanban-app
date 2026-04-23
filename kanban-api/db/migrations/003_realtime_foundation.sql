-- Realtime collaboration foundation

CREATE TABLE direct_conversations (
  conversation_id SERIAL PRIMARY KEY,
  user_one_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user_two_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_one_id < user_two_id),
  UNIQUE(user_one_id, user_two_id)
);

CREATE TABLE direct_messages (
  message_id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES direct_conversations(conversation_id) ON DELETE CASCADE,
  sender_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_follows (
  follow_id SERIAL PRIMARY KEY,
  follower_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  followed_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL DEFAULT 'following',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (follower_user_id <> followed_user_id),
  UNIQUE(follower_user_id, followed_user_id)
);

CREATE TABLE invitations (
  invitation_id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  inviter_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  invitee_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  invitee_email VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  message TEXT,
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_direct_conversations_user_one ON direct_conversations(user_one_id);
CREATE INDEX idx_direct_conversations_user_two ON direct_conversations(user_two_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_user_id);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_user_id);
CREATE INDEX idx_user_follows_followed ON user_follows(followed_user_id);
CREATE INDEX idx_invitations_project ON invitations(project_id);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_user_id);
CREATE INDEX idx_invitations_invitee_user ON invitations(invitee_user_id);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
