-- DropForeignKey
ALTER TABLE "public"."aiCompletions" DROP CONSTRAINT "aiCompletions_documentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."transcriptions" DROP CONSTRAINT "transcriptions_documentId_fkey";

-- AddForeignKey
ALTER TABLE "public"."transcriptions" ADD CONSTRAINT "transcriptions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aiCompletions" ADD CONSTRAINT "aiCompletions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
