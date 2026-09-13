ALTER TABLE "Student" ALTER COLUMN "batch" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "batch" TYPE "Shift" USING ("batch"::text::"Shift");
ALTER TABLE "Student" ALTER COLUMN "batch" SET DEFAULT 'MORNING';
