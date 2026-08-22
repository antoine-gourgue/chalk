-- AlterTable
ALTER TABLE "WallDevice" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pairingCode" TEXT,
ADD COLUMN     "pairingExpiresAt" TIMESTAMP(3),
ALTER COLUMN "pairedAt" DROP NOT NULL,
ALTER COLUMN "pairedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "WallDevice_pairingCode_key" ON "WallDevice"("pairingCode");

