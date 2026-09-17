-- Allow one account on a BOAT and on YOUTH_LAND / RowRide entries they own.
-- TeamMember.userId was globally unique, so a parent claim on RowRide blocked Join the boat.

DROP INDEX IF EXISTS "TeamMember_userId_key";

CREATE UNIQUE INDEX "TeamMember_userId_teamId_key" ON "TeamMember"("userId", "teamId");

CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");

-- A parent may claim both a paid boat and the RowRide entries they registered.
DROP INDEX IF EXISTS "Team_claimedByUserId_key";

CREATE INDEX IF NOT EXISTS "Team_claimedByUserId_idx" ON "Team"("claimedByUserId");
