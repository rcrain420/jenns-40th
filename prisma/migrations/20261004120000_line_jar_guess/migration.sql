-- Side contest guesses. Admin list only; no public read path.

CREATE TABLE "LineJarGuess" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guessedLengthInches" DOUBLE PRECISION NOT NULL,
    "donationCents" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineJarGuess_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LineJarGuess_createdAt_idx" ON "LineJarGuess"("createdAt");
