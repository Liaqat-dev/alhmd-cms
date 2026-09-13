-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('MORNING_FEE', 'MORNING_SALARY');
ALTER TABLE "PaymentHistory" ALTER COLUMN "paymentType" TYPE "PaymentType_new" USING ("paymentType"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "PaymentType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CrashCourseAttendance" DROP CONSTRAINT "CrashCourseAttendance_crashCourseId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseAttendance" DROP CONSTRAINT "CrashCourseAttendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseAttendance" DROP CONSTRAINT "CrashCourseAttendance_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseChallan" DROP CONSTRAINT "CrashCourseChallan_crashCourseId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseChallan" DROP CONSTRAINT "CrashCourseChallan_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseChallan" DROP CONSTRAINT "CrashCourseChallan_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseChallan" DROP CONSTRAINT "CrashCourseChallan_studentId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseEnrollment" DROP CONSTRAINT "CrashCourseEnrollment_crashCourseId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseEnrollment" DROP CONSTRAINT "CrashCourseEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseExam" DROP CONSTRAINT "CrashCourseExam_crashCourseId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseExam" DROP CONSTRAINT "CrashCourseExam_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseMark" DROP CONSTRAINT "CrashCourseMark_examId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseMark" DROP CONSTRAINT "CrashCourseMark_gradedBy_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseMark" DROP CONSTRAINT "CrashCourseMark_studentId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseTeacher" DROP CONSTRAINT "CrashCourseTeacher_crashCourseId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseTeacher" DROP CONSTRAINT "CrashCourseTeacher_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseTimetable" DROP CONSTRAINT "CrashCourseTimetable_crashCourseId_fkey";

-- DropForeignKey
ALTER TABLE "CrashCourseTimetable" DROP CONSTRAINT "CrashCourseTimetable_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "EveningAttendance" DROP CONSTRAINT "EveningAttendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "EveningAttendance" DROP CONSTRAINT "EveningAttendance_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "EveningAttendance" DROP CONSTRAINT "EveningAttendance_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "EveningChallan" DROP CONSTRAINT "EveningChallan_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EveningChallan" DROP CONSTRAINT "EveningChallan_rolledIntoId_fkey";

-- DropForeignKey
ALTER TABLE "EveningChallan" DROP CONSTRAINT "EveningChallan_studentId_fkey";

-- DropForeignKey
ALTER TABLE "EveningChallanItem" DROP CONSTRAINT "EveningChallanItem_eveningChallanId_fkey";

-- DropForeignKey
ALTER TABLE "EveningClass" DROP CONSTRAINT "EveningClass_regularClassId_fkey";

-- DropForeignKey
ALTER TABLE "EveningEnrollment" DROP CONSTRAINT "EveningEnrollment_eveningClassId_fkey";

-- DropForeignKey
ALTER TABLE "EveningEnrollment" DROP CONSTRAINT "EveningEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "EveningExam" DROP CONSTRAINT "EveningExam_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "EveningExam" DROP CONSTRAINT "EveningExam_eveningClassId_fkey";

-- DropForeignKey
ALTER TABLE "EveningExam" DROP CONSTRAINT "EveningExam_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "EveningMark" DROP CONSTRAINT "EveningMark_examId_fkey";

-- DropForeignKey
ALTER TABLE "EveningMark" DROP CONSTRAINT "EveningMark_gradedBy_fkey";

-- DropForeignKey
ALTER TABLE "EveningMark" DROP CONSTRAINT "EveningMark_studentId_fkey";

-- DropForeignKey
ALTER TABLE "EveningMonthlyReport" DROP CONSTRAINT "EveningMonthlyReport_generatedBy_fkey";

-- DropForeignKey
ALTER TABLE "EveningMonthlyReport" DROP CONSTRAINT "EveningMonthlyReport_studentId_fkey";

-- DropForeignKey
ALTER TABLE "EveningSalary" DROP CONSTRAINT "EveningSalary_generatedBy_fkey";

-- DropForeignKey
ALTER TABLE "EveningSalary" DROP CONSTRAINT "EveningSalary_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "EveningSalaryDetail" DROP CONSTRAINT "EveningSalaryDetail_eveningSalaryId_fkey";

-- DropForeignKey
ALTER TABLE "EveningStudentSubject" DROP CONSTRAINT "EveningStudentSubject_studentId_fkey";

-- DropForeignKey
ALTER TABLE "EveningStudentSubject" DROP CONSTRAINT "EveningStudentSubject_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "EveningSubject" DROP CONSTRAINT "EveningSubject_eveningClassId_fkey";

-- DropForeignKey
ALTER TABLE "EveningSubjectTeacher" DROP CONSTRAINT "EveningSubjectTeacher_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "EveningSubjectTeacher" DROP CONSTRAINT "EveningSubjectTeacher_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "EveningTeacherAttendance" DROP CONSTRAINT "EveningTeacherAttendance_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "EveningTeacherAttendance" DROP CONSTRAINT "EveningTeacherAttendance_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "EveningTimetable" DROP CONSTRAINT "EveningTimetable_eveningClassId_fkey";

-- DropForeignKey
ALTER TABLE "EveningTimetable" DROP CONSTRAINT "EveningTimetable_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "EveningTimetable" DROP CONSTRAINT "EveningTimetable_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "MorningClass" DROP CONSTRAINT "MorningClass_regularClassId_fkey";

-- DropForeignKey
ALTER TABLE "MorningExtrasEnrollment" DROP CONSTRAINT "MorningExtrasEnrollment_morningClassId_fkey";

-- DropForeignKey
ALTER TABLE "MorningExtrasEnrollment" DROP CONSTRAINT "MorningExtrasEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentHistory" DROP CONSTRAINT "PaymentHistory_eveningChallanId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentHistory" DROP CONSTRAINT "PaymentHistory_eveningSalaryId_fkey";

-- DropForeignKey
ALTER TABLE "StudentExpense" DROP CONSTRAINT "StudentExpense_eveningChallanId_fkey";

-- DropIndex
DROP INDEX "MorningClass_regularClassId_idx";

-- AlterTable
ALTER TABLE "MorningChallan" DROP COLUMN "extrasFee";

-- AlterTable
ALTER TABLE "MorningClass" DROP COLUMN "classType",
DROP COLUMN "regularClassId";

-- AlterTable
ALTER TABLE "MorningSalary" DROP COLUMN "aLevelBreakdown",
DROP COLUMN "aLevelSalary",
DROP COLUMN "bandSubtotal",
DROP COLUMN "higherBandAmount",
DROP COLUMN "lowerBandAmount",
DROP COLUMN "multiProgramApplied",
DROP COLUMN "oLevelMinutes",
DROP COLUMN "oLevelSalary",
DROP COLUMN "preOLevelMinutes",
DROP COLUMN "preOLevelSalary",
ADD COLUMN     "basicSalary" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PaymentHistory" DROP COLUMN "eveningChallanId",
DROP COLUMN "eveningSalaryId";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "batch";

-- AlterTable
ALTER TABLE "StudentExpense" DROP COLUMN "batch",
DROP COLUMN "eveningChallanId";

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "aLevelSalary",
DROP COLUMN "oLevelSalary",
DROP COLUMN "preOLevelSalary",
DROP COLUMN "shift",
ADD COLUMN     "basicSalary" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "CrashCourse";

-- DropTable
DROP TABLE "CrashCourseAttendance";

-- DropTable
DROP TABLE "CrashCourseChallan";

-- DropTable
DROP TABLE "CrashCourseEnrollment";

-- DropTable
DROP TABLE "CrashCourseExam";

-- DropTable
DROP TABLE "CrashCourseMark";

-- DropTable
DROP TABLE "CrashCourseTeacher";

-- DropTable
DROP TABLE "CrashCourseTimetable";

-- DropTable
DROP TABLE "EveningAttendance";

-- DropTable
DROP TABLE "EveningChallan";

-- DropTable
DROP TABLE "EveningChallanItem";

-- DropTable
DROP TABLE "EveningClass";

-- DropTable
DROP TABLE "EveningEnrollment";

-- DropTable
DROP TABLE "EveningExam";

-- DropTable
DROP TABLE "EveningMark";

-- DropTable
DROP TABLE "EveningMonthlyReport";

-- DropTable
DROP TABLE "EveningSalary";

-- DropTable
DROP TABLE "EveningSalaryDetail";

-- DropTable
DROP TABLE "EveningStudentSubject";

-- DropTable
DROP TABLE "EveningSubject";

-- DropTable
DROP TABLE "EveningSubjectTeacher";

-- DropTable
DROP TABLE "EveningTeacherAttendance";

-- DropTable
DROP TABLE "EveningTimetable";

-- DropTable
DROP TABLE "MorningExtrasEnrollment";

-- DropEnum
DROP TYPE "Batch";

-- DropEnum
DROP TYPE "ClassType";

-- DropEnum
DROP TYPE "Shift";

