/*
  Warnings:

  - You are about to drop the column `documentId` on the `aiCompletions` table. All the data in the column will be lost.
  - Added the required column `transcriptionId` to the `aiCompletions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."aiCompletions" DROP CONSTRAINT "aiCompletions_documentId_fkey";

-- AlterTable
ALTER TABLE "public"."aiCompletions" DROP COLUMN "documentId",
ADD COLUMN     "transcriptionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."aiCompletions" ADD CONSTRAINT "aiCompletions_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "public"."transcriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
