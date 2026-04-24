INSERT INTO roles (role_name, description)
VALUES ('editor', 'Can edit board content (columns, cards)')
ON CONFLICT (role_name) DO NOTHING;
