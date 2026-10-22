-- Apply before deploying the claim approver code.
-- Existing approvals remain unattributed because the approver was not recorded.
ALTER TABLE profile_claims
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT
  REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
