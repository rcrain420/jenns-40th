-- AlterTable
ALTER TABLE "Team" ADD COLUMN "amountPaidCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_teamId_idx" ON "Payment"("teamId");

-- CreateIndex
CREATE INDEX "Payment_createdByUserId_idx" ON "Payment"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing PAID boats with a due amount get one MANUAL row so Paid matches Due.
-- Youth land $0 PAID stays PAID with an empty ledger.
INSERT INTO "Payment" ("id", "teamId", "amountCents", "note", "source", "createdAt")
SELECT
    'migpay_' || "id",
    "id",
    "amountDueCents",
    'Migrated: previously marked paid',
    'MANUAL',
    CURRENT_TIMESTAMP
FROM "Team"
WHERE "paymentStatus" = 'PAID' AND "amountDueCents" > 0;

UPDATE "Team"
SET "amountPaidCents" = "amountDueCents"
WHERE "paymentStatus" = 'PAID' AND "amountDueCents" > 0;
