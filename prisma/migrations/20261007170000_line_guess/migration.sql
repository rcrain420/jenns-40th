-- CreateTable
CREATE TABLE "LineGuess" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guessFeet" DOUBLE PRECISION NOT NULL,
    "paidClaimed" BOOLEAN NOT NULL DEFAULT false,
    "method" TEXT NOT NULL DEFAULT 'CCA',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineGuess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LineGuess_createdAt_idx" ON "LineGuess"("createdAt");
