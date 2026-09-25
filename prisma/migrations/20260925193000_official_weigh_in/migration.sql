-- Official weigh-in. Separate from FishCatch (Livewell / AI Brag Board).

CREATE TABLE "WeighSession" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'CLOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeighSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeighedFish" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "weightLbs" DOUBLE PRECISION NOT NULL,
    "lengthInches" DOUBLE PRECISION,
    "spotCount" INTEGER,
    "weighedAt" TIMESTAMP(3) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "disqualified" BOOLEAN NOT NULL DEFAULT false,
    "dqReason" TEXT,
    "taggedTrout" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "enteredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeighedFish_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MainStringer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "troutFishId" TEXT,
    "totalWeightLbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "unlockNote" TEXT,
    "dqReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainStringer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MainStringerFish" (
    "id" TEXT NOT NULL,
    "stringerId" TEXT NOT NULL,
    "weighedFishId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "MainStringerFish_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SidePotEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "potId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "weighedFishId" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "metricLabel" TEXT NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "ineligibleReason" TEXT,
    "weighedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SidePotEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeighSession_status_idx" ON "WeighSession"("status");

CREATE UNIQUE INDEX "WeighedFish_sessionId_sequence_key" ON "WeighedFish"("sessionId", "sequence");
CREATE INDEX "WeighedFish_sessionId_weighedAt_idx" ON "WeighedFish"("sessionId", "weighedAt");
CREATE INDEX "WeighedFish_teamId_idx" ON "WeighedFish"("teamId");
CREATE INDEX "WeighedFish_species_idx" ON "WeighedFish"("species");
CREATE INDEX "WeighedFish_enteredByUserId_idx" ON "WeighedFish"("enteredByUserId");

CREATE UNIQUE INDEX "MainStringer_sessionId_teamId_key" ON "MainStringer"("sessionId", "teamId");
CREATE UNIQUE INDEX "MainStringer_troutFishId_key" ON "MainStringer"("troutFishId");
CREATE INDEX "MainStringer_sessionId_status_idx" ON "MainStringer"("sessionId", "status");
CREATE INDEX "MainStringer_teamId_idx" ON "MainStringer"("teamId");

CREATE UNIQUE INDEX "MainStringerFish_stringerId_slot_key" ON "MainStringerFish"("stringerId", "slot");
CREATE UNIQUE INDEX "MainStringerFish_weighedFishId_key" ON "MainStringerFish"("weighedFishId");
CREATE INDEX "MainStringerFish_stringerId_idx" ON "MainStringerFish"("stringerId");

CREATE UNIQUE INDEX "SidePotEntry_sessionId_potId_teamId_key" ON "SidePotEntry"("sessionId", "potId", "teamId");
CREATE INDEX "SidePotEntry_sessionId_potId_eligible_idx" ON "SidePotEntry"("sessionId", "potId", "eligible");
CREATE INDEX "SidePotEntry_teamId_idx" ON "SidePotEntry"("teamId");
CREATE INDEX "SidePotEntry_weighedFishId_idx" ON "SidePotEntry"("weighedFishId");

ALTER TABLE "WeighedFish" ADD CONSTRAINT "WeighedFish_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WeighSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeighedFish" ADD CONSTRAINT "WeighedFish_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeighedFish" ADD CONSTRAINT "WeighedFish_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MainStringer" ADD CONSTRAINT "MainStringer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WeighSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MainStringer" ADD CONSTRAINT "MainStringer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MainStringer" ADD CONSTRAINT "MainStringer_troutFishId_fkey" FOREIGN KEY ("troutFishId") REFERENCES "WeighedFish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MainStringerFish" ADD CONSTRAINT "MainStringerFish_stringerId_fkey" FOREIGN KEY ("stringerId") REFERENCES "MainStringer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MainStringerFish" ADD CONSTRAINT "MainStringerFish_weighedFishId_fkey" FOREIGN KEY ("weighedFishId") REFERENCES "WeighedFish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SidePotEntry" ADD CONSTRAINT "SidePotEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WeighSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SidePotEntry" ADD CONSTRAINT "SidePotEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SidePotEntry" ADD CONSTRAINT "SidePotEntry_weighedFishId_fkey" FOREIGN KEY ("weighedFishId") REFERENCES "WeighedFish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tournament Saturday scales: noon–2:00 p.m. America/Chicago (CDT, UTC-5).
-- Closed until an admin opens it from /admin/weigh-in.
INSERT INTO "WeighSession" ("id", "label", "startsAt", "endsAt", "status", "createdAt", "updatedAt")
VALUES (
    'weigh_2026_10_10_main',
    '2026-10-10 main',
    TIMESTAMP '2026-10-10 17:00:00',
    TIMESTAMP '2026-10-10 19:00:00',
    'CLOSED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
