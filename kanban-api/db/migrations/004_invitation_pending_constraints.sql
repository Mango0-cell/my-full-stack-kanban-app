-- Prevent duplicate pending invitations per project/email and improve pending lookups.

WITH ranked_pending AS (
  SELECT
    invitation_id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, LOWER(invitee_email)
      ORDER BY created_at DESC, invitation_id DESC
    ) AS row_num
  FROM invitations
  WHERE status = 'pending'
)
UPDATE invitations i
SET status = 'expired',
    updated_at = NOW()
FROM ranked_pending rp
WHERE i.invitation_id = rp.invitation_id
  AND rp.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_invitations_pending_project_email
ON invitations (project_id, LOWER(invitee_email))
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_project_status_created
ON invitations (project_id, status, created_at DESC);
