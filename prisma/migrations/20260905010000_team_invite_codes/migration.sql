-- CreateTable
CREATE TABLE "TeamInviteCode" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInviteCode_code_key" ON "TeamInviteCode"("code");

-- CreateIndex
CREATE INDEX "TeamInviteCode_teamId_idx" ON "TeamInviteCode"("teamId");

-- AddForeignKey
ALTER TABLE "TeamInviteCode" ADD CONSTRAINT "TeamInviteCode_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
