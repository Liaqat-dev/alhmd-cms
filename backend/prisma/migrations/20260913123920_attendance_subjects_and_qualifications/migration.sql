-- AlterEnum
ALTER TYPE "ClassProgram" ADD VALUE 'IT';

-- DropForeignKey
ALTER TABLE "MorningAttendance" DROP CONSTRAINT "MorningAttendance_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "MorningSubject" DROP CONSTRAINT "MorningSubject_morningClassId_fkey";

-- DropForeignKey
ALTER TABLE "MorningTeacherAttendance" DROP CONSTRAINT "MorningTeacherAttendance_subjectId_fkey";

-- DropIndex
DROP INDEX "MorningAttendance_studentId_subjectId_date_key";

-- DropIndex
DROP INDEX "MorningSubject_name_morningClassId_key";

-- DropIndex
DROP INDEX "MorningTeacherAttendance_teacherId_subjectId_date_key";

-- AlterTable
ALTER TABLE "MorningAttendance" DROP COLUMN "subjectId",
ADD COLUMN     "morningClassId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MorningSubject" DROP COLUMN "morningClassId",
ADD COLUMN     "gradeLevel" "GradeLevel" NOT NULL DEFAULT 'GRADE_11';

-- AlterTable
ALTER TABLE "MorningTeacherAttendance" DROP COLUMN "subjectId",
ADD COLUMN     "morningClassId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "availability";

-- CreateTable
CREATE TABLE "TeacherQualification" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "degreeTitle" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "totalMarksOrGpa" TEXT NOT NULL,
    "obtainedMarksOrGpa" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MorningClassToMorningSubject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "TeacherQualification_teacherId_idx" ON "TeacherQualification"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "_MorningClassToMorningSubject_AB_unique" ON "_MorningClassToMorningSubject"("A", "B");

-- CreateIndex
CREATE INDEX "_MorningClassToMorningSubject_B_index" ON "_MorningClassToMorningSubject"("B");

-- CreateIndex
CREATE INDEX "MorningAttendance_morningClassId_idx" ON "MorningAttendance"("morningClassId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningAttendance_studentId_morningClassId_date_key" ON "MorningAttendance"("studentId", "morningClassId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MorningSubject_name_gradeLevel_key" ON "MorningSubject"("name", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "MorningTeacherAttendance_teacherId_morningClassId_date_key" ON "MorningTeacherAttendance"("teacherId", "morningClassId", "date");

-- AddForeignKey
ALTER TABLE "TeacherQualification" ADD CONSTRAINT "TeacherQualification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningAttendance" ADD CONSTRAINT "MorningAttendance_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningTeacherAttendance" ADD CONSTRAINT "MorningTeacherAttendance_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MorningClassToMorningSubject" ADD CONSTRAINT "_MorningClassToMorningSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "MorningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MorningClassToMorningSubject" ADD CONSTRAINT "_MorningClassToMorningSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

