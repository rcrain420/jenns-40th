-- AlterTable
ALTER TABLE "Team" ADD COLUMN "captainEmail" TEXT;

-- CreateIndex
CREATE INDEX "Team_captainEmail_idx" ON "Team"("captainEmail");
