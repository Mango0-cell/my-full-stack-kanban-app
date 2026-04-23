-- Allow custom priority values by dropping the CHECK constraint
ALTER TABLE cards DROP CONSTRAINT cards_priority_check;

-- Increase column size to allow longer custom values
ALTER TABLE cards ALTER COLUMN priority TYPE VARCHAR(50);
