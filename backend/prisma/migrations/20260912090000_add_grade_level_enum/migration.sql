-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('GRADE_11', 'GRADE_12');

-- AlterEnum: ClassProgram (PRE_O_LEVEL/O_LEVEL/A_LEVEL -> MED/ENG/ICS/FA)
-- Existing rows are remapped to a sensible default since there is no natural
-- 1:1 correspondence between the old academic levels and the new subject groups.
BEGIN;
CREATE TYPE "ClassProgram_new" AS ENUM ('MED', 'ENG', 'ICS', 'FA');
ALTER TABLE "MorningClass" ALTER COLUMN "program" DROP DEFAULT;
ALTER TABLE "MorningClass" ALTER COLUMN "program" TYPE "ClassProgram_new" USING (
  CASE "program"::text
    WHEN 'MED' THEN 'MED'
    WHEN 'ENG' THEN 'ENG'
    WHEN 'ICS' THEN 'ICS'
    WHEN 'FA'  THEN 'FA'
    ELSE 'ICS'
  END::"ClassProgram_new"
);
ALTER TYPE "ClassProgram" RENAME TO "ClassProgram_old";
ALTER TYPE "ClassProgram_new" RENAME TO "ClassProgram";
DROP TYPE "ClassProgram_old";
ALTER TABLE "MorningClass" ALTER COLUMN "program" SET DEFAULT 'ICS';
COMMIT;

-- AlterTable: gradeLevel (free text -> enum), best-effort mapping of old labels
ALTER TABLE "MorningClass" ADD COLUMN "gradeLevel_new" "GradeLevel" NOT NULL DEFAULT 'GRADE_11';

UPDATE "MorningClass" SET "gradeLevel_new" =
  CASE
    WHEN "gradeLevel" ILIKE '%12%' THEN 'GRADE_12'::"GradeLevel"
    ELSE 'GRADE_11'::"GradeLevel"
  END;

ALTER TABLE "MorningClass" DROP COLUMN "gradeLevel";
ALTER TABLE "MorningClass" RENAME COLUMN "gradeLevel_new" TO "gradeLevel";
