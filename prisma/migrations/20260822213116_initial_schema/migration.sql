-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'COACH', 'MEMBER');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('WEIGHTLIFTING', 'GYMNASTICS', 'MONOSTRUCTURAL', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "PrUnit" AS ENUM ('KG', 'REPS', 'SECONDS');

-- CreateEnum
CREATE TYPE "BlockKind" AS ENUM ('WARMUP', 'STRENGTH', 'GYMNASTICS', 'METCON', 'ACCESSORY', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "BlockFormat" AS ENUM ('AMRAP', 'FOR_TIME', 'EMOM', 'TABATA', 'INTERVALS', 'STRENGTH_SETS', 'FREE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('BOOKED', 'WAITLIST', 'CHECKED_IN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScoreType" AS ENUM ('ROUNDS_REPS', 'TIME', 'LOAD', 'REPS');

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "boxId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "benchmark" BOOLEAN NOT NULL DEFAULT false,
    "prUnit" "PrUnit",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "coachNotes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "BlockKind" NOT NULL,
    "format" "BlockFormat" NOT NULL,
    "title" TEXT,
    "durationSeconds" INTEGER,
    "rounds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockMovement" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "reps" INTEGER,
    "loadMale" DOUBLE PRECISION,
    "loadFemale" DOUBLE PRECISION,
    "target" TEXT,
    "scalingNote" TEXT,

    CONSTRAINT "BlockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSlot" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "capacity" INTEGER NOT NULL DEFAULT 16,
    "coachId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClassSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "workoutId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'BOOKED',
    "waitlistPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "scoreType" "ScoreType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rounds" INTEGER,
    "reps" INTEGER,
    "rx" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "unit" "PrUnit" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL,
    "resultId" TEXT,

    CONSTRAINT "PersonalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallDevice" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "pairedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3),

    CONSTRAINT "WallDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "Box_slug_key" ON "Box"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_boxId_role_idx" ON "Membership"("boxId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_boxId_userId_key" ON "Membership"("boxId", "userId");

-- CreateIndex
CREATE INDEX "Movement_modality_idx" ON "Movement"("modality");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_boxId_slug_key" ON "Movement"("boxId", "slug");

-- CreateIndex
CREATE INDEX "Workout_boxId_date_idx" ON "Workout"("boxId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_boxId_date_key" ON "Workout"("boxId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Block_workoutId_position_key" ON "Block"("workoutId", "position");

-- CreateIndex
CREATE INDEX "BlockMovement_movementId_idx" ON "BlockMovement"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockMovement_blockId_position_key" ON "BlockMovement"("blockId", "position");

-- CreateIndex
CREATE INDEX "ClassSlot_boxId_weekday_idx" ON "ClassSlot"("boxId", "weekday");

-- CreateIndex
CREATE INDEX "ClassSession_startsAt_idx" ON "ClassSession"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_slotId_startsAt_key" ON "ClassSession"("slotId", "startsAt");

-- CreateIndex
CREATE INDEX "Reservation_sessionId_status_idx" ON "Reservation"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_sessionId_userId_key" ON "Reservation"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Result_sessionId_idx" ON "Result"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_blockId_userId_key" ON "Result"("blockId", "userId");

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_movementId_idx" ON "PersonalRecord"("userId", "movementId");

-- CreateIndex
CREATE UNIQUE INDEX "WallDevice_token_key" ON "WallDevice"("token");

-- CreateIndex
CREATE INDEX "WallDevice_boxId_idx" ON "WallDevice"("boxId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockMovement" ADD CONSTRAINT "BlockMovement_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockMovement" ADD CONSTRAINT "BlockMovement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSlot" ADD CONSTRAINT "ClassSlot_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSlot" ADD CONSTRAINT "ClassSlot_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ClassSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallDevice" ADD CONSTRAINT "WallDevice_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
