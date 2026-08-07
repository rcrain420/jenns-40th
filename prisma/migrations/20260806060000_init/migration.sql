-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "boatType" TEXT NOT NULL,
    "captainName" TEXT,
    "captainPhone" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "registrantEmail" TEXT NOT NULL,
    "notes" TEXT,
    "licenseConfirmed" BOOLEAN NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "amountDueCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Angler" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Angler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishCatch" (
    "id" TEXT NOT NULL,
    "anglerId" TEXT NOT NULL,
    "photoPath" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "lengthInches" DOUBLE PRECISION NOT NULL,
    "weightLbs" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "aiNotes" TEXT,
    "aiProvider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FishCatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatchComment" (
    "id" TEXT NOT NULL,
    "catchId" TEXT NOT NULL,
    "anglerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatchComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Angler_teamId_idx" ON "Angler"("teamId");

-- CreateIndex
CREATE INDEX "FishCatch_anglerId_idx" ON "FishCatch"("anglerId");

-- CreateIndex
CREATE INDEX "FishCatch_createdAt_idx" ON "FishCatch"("createdAt");

-- CreateIndex
CREATE INDEX "CatchComment_catchId_idx" ON "CatchComment"("catchId");

-- CreateIndex
CREATE INDEX "CatchComment_anglerId_idx" ON "CatchComment"("anglerId");

-- CreateIndex
CREATE INDEX "CatchComment_createdAt_idx" ON "CatchComment"("createdAt");

-- AddForeignKey
ALTER TABLE "Angler" ADD CONSTRAINT "Angler_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishCatch" ADD CONSTRAINT "FishCatch_anglerId_fkey" FOREIGN KEY ("anglerId") REFERENCES "Angler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchComment" ADD CONSTRAINT "CatchComment_catchId_fkey" FOREIGN KEY ("catchId") REFERENCES "FishCatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchComment" ADD CONSTRAINT "CatchComment_anglerId_fkey" FOREIGN KEY ("anglerId") REFERENCES "Angler"("id") ON DELETE CASCADE ON UPDATE CASCADE;
