-- CreateEnum
CREATE TYPE "Trade" AS ENUM ('PLOMBIER', 'ELECTRICIEN', 'MACON', 'CARRELEUR', 'MENUISIER', 'PEINTRE', 'PAYSAGISTE', 'CHAUFFAGISTE', 'COUVREUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "ReminderTone" AS ENUM ('FORMAL', 'PROFESSIONAL', 'FRIENDLY', 'DIRECT');

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiPromptVersion" TEXT,
ADD COLUMN     "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iteration" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "trade" "Trade",
    "defaultTone" "ReminderTone" NOT NULL DEFAULT 'PROFESSIONAL',
    "signatureBlock" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costEur" DECIMAL(10,6) NOT NULL,
    "reminderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
