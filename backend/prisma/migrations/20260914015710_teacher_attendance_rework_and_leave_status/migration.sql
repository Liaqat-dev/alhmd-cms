-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');
ALTER TABLE "MorningTeacherAttendance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MorningAttendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TABLE "MorningTeacherAttendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "AttendanceStatus_old";
ALTER TABLE "MorningTeacherAttendance" ALTER COLUMN "status" SET DEFAULT 'PRESENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "MorningTeacherAttendance" DROP CONSTRAINT "MorningTeacherAttendance_morningClassId_fkey";

-- DropIndex
DROP INDEX "MorningTeacherAttendance_teacherId_morningClassId_date_key";

-- AlterTable
ALTER TABLE "MorningMonthlyReport" DROP COLUMN "totalLate",
ADD COLUMN     "totalLeave" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MorningTeacherAttendance" DROP COLUMN "morningClassId",
ADD COLUMN     "markedBy" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "MorningTeacherAttendance_teacherId_date_key" ON "MorningTeacherAttendance"("teacherId", "date");

-- AddForeignKey
ALTER TABLE "MorningTeacherAttendance" ADD CONSTRAINT "MorningTeacherAttendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

