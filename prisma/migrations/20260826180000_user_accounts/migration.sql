-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'GUEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmailToken_userId_type_idx" ON "EmailToken"("userId", "type");

-- CreateIndex
CREATE INDEX "EmailToken_tokenHash_idx" ON "EmailToken"("tokenHash");

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "claimedByUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_claimedByUserId_key" ON "Team"("claimedByUserId");

-- AlterTable
ALTER TABLE "FishCatch" ALTER COLUMN "anglerId" DROP NOT NULL;
ALTER TABLE "FishCatch" ADD COLUMN "userId" TEXT;

-- AlterTable
ALTER TABLE "CatchComment" ALTER COLUMN "anglerId" DROP NOT NULL;
ALTER TABLE "CatchComment" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "FishCatch_userId_idx" ON "FishCatch"("userId");

-- CreateIndex
CREATE INDEX "CatchComment_userId_idx" ON "CatchComment"("userId");

-- AddForeignKey
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishCatch" ADD CONSTRAINT "FishCatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchComment" ADD CONSTRAINT "CatchComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
