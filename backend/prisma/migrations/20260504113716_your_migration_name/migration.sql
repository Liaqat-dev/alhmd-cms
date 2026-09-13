-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ENROLLED', 'PENDING');

-- CreateEnum
CREATE TYPE "ClassProgram" AS ENUM ('PRE_O_LEVEL', 'O_LEVEL', 'A_LEVEL');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('ONSITE', 'ONLINE', 'BOTH');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('STUDENTS', 'TEACHERS', 'BOTH');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('URGENT', 'NORMAL', 'INFORMATIONAL');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ChallanStatus" AS ENUM ('UNPAID', 'PAID', 'PARTIAL', 'OVERDUE', 'ROLLED_OVER');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('ADMISSION_FEE', 'MISC_FEE', 'BAG', 'UNIFORM', 'BOOKS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('MONTHLY_TEST', 'BIMONTHLY_TEST', 'PAST_PAPER', 'WEEKLY_TEST', 'MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'TASK');

-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('GENERATED', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MORNING_FEE', 'EVENING_FEE', 'MORNING_SALARY', 'EVENING_SALARY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK', 'ONLINE');

-- CreateEnum
CREATE TYPE "TeacherTier" AS ENUM ('TIER_1', 'TIER_2A', 'TIER_2B', 'TIER_3');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('REGULAR', 'EXTRAS', 'CRASH_COURSE');

-- CreateEnum
CREATE TYPE "Batch" AS ENUM ('MORNING', 'EVENING');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profilePicUrl" TEXT,
    "profilePicPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "family" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "additionalPay" INTEGER NOT NULL DEFAULT 0,
    "preOLevelSalary" INTEGER NOT NULL DEFAULT 0,
    "oLevelSalary" INTEGER NOT NULL DEFAULT 0,
    "aLevelSalary" INTEGER NOT NULL DEFAULT 0,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "availability" "Availability" NOT NULL DEFAULT 'ONSITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tier" "TeacherTier" NOT NULL DEFAULT 'TIER_3',

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "cnic" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "fatherName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "schoolName" TEXT,
    "registrationFee" INTEGER,
    "familyDiscount" INTEGER,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "status" "StudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "program" "ClassProgram" NOT NULL DEFAULT 'O_LEVEL',
    "classType" "ClassType" NOT NULL DEFAULT 'REGULAR',
    "studentLimit" INTEGER NOT NULL DEFAULT 35,
    "regularClassId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MorningClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningSubject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "morningClassId" INTEGER NOT NULL,
    "availability" "Availability" NOT NULL DEFAULT 'ONSITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningSubjectTeacher" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningSubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningStudentSubject" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningStudentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "morningClassId" INTEGER,
    "monthlyFee" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningExtrasEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "morningClassId" INTEGER,
    "monthlyFee" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningExtrasEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningTimetable" (
    "id" SERIAL NOT NULL,
    "morningClassId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MorningTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningAttendance" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningExam" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "morningClassId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passingMarks" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MorningExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningMark" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "obtainedMarks" DECIMAL(65,30) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "gradedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MorningMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningMonthlyReport" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "attendancePercentage" DECIMAL(65,30) NOT NULL,
    "totalPresent" INTEGER NOT NULL,
    "totalAbsent" INTEGER NOT NULL,
    "totalLate" INTEGER NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL,
    "averageMarks" DECIMAL(65,30),
    "totalExams" INTEGER NOT NULL DEFAULT 0,
    "examsPassed" INTEGER NOT NULL DEFAULT 0,
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "teacherRemarks" TEXT,
    "generatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MorningMonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "program" "ClassProgram" NOT NULL DEFAULT 'O_LEVEL',
    "classType" "ClassType" NOT NULL DEFAULT 'REGULAR',
    "studentLimit" INTEGER NOT NULL DEFAULT 35,
    "regularClassId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveningClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningSubject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eveningClassId" INTEGER NOT NULL,
    "monthlyFee" INTEGER,
    "availability" "Availability" NOT NULL DEFAULT 'ONSITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningSubjectTeacher" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningSubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "eveningClassId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningStudentSubject" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "agreedFee" INTEGER NOT NULL,
    "teacherShare" INTEGER,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningStudentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningTimetable" (
    "id" SERIAL NOT NULL,
    "eveningClassId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveningTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningAttendance" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningTeacherAttendance" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER,
    "subjectId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningTeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningTeacherAttendance" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER,
    "subjectId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningTeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningExam" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "eveningClassId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passingMarks" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveningExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningMark" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "obtainedMarks" DECIMAL(65,30) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "gradedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveningMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningMonthlyReport" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "attendancePercentage" DECIMAL(65,30) NOT NULL,
    "totalPresent" INTEGER NOT NULL,
    "totalAbsent" INTEGER NOT NULL,
    "totalLate" INTEGER NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL,
    "averageMarks" DECIMAL(65,30),
    "totalExams" INTEGER NOT NULL DEFAULT 0,
    "examsPassed" INTEGER NOT NULL DEFAULT 0,
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "teacherRemarks" TEXT,
    "generatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveningMonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningChallan" (
    "id" SERIAL NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "monthlyFee" INTEGER NOT NULL,
    "extrasFee" INTEGER NOT NULL DEFAULT 0,
    "arrears" INTEGER NOT NULL DEFAULT 0,
    "lateFee" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "additionalCharges" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "status" "ChallanStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rolledIntoId" INTEGER,

    CONSTRAINT "MorningChallan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningChallan" (
    "id" SERIAL NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "subjectsFee" INTEGER NOT NULL,
    "extrasFee" INTEGER NOT NULL DEFAULT 0,
    "arrears" INTEGER NOT NULL DEFAULT 0,
    "lateFee" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "additionalCharges" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "status" "ChallanStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rolledIntoId" INTEGER,

    CONSTRAINT "EveningChallan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningChallanItem" (
    "id" SERIAL NOT NULL,
    "eveningChallanId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "subjectName" TEXT NOT NULL,
    "feeAmount" INTEGER NOT NULL,
    "isExtras" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningChallanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExpense" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "label" TEXT,
    "amount" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "batch" "Batch" NOT NULL,
    "morningChallanId" INTEGER,
    "eveningChallanId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorningSalary" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "preOLevelMinutes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "preOLevelSalary" INTEGER NOT NULL DEFAULT 0,
    "oLevelMinutes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "oLevelSalary" INTEGER NOT NULL DEFAULT 0,
    "multiProgramApplied" BOOLEAN NOT NULL DEFAULT false,
    "higherBandAmount" INTEGER NOT NULL DEFAULT 0,
    "lowerBandAmount" INTEGER NOT NULL DEFAULT 0,
    "bandSubtotal" INTEGER NOT NULL DEFAULT 0,
    "aLevelBreakdown" JSONB,
    "aLevelSalary" INTEGER NOT NULL DEFAULT 0,
    "additionalPay" INTEGER NOT NULL DEFAULT 0,
    "totalSalary" INTEGER NOT NULL DEFAULT 0,
    "status" "SalaryStatus" NOT NULL DEFAULT 'GENERATED',
    "remarks" TEXT,
    "generatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MorningSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningSalary" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "additionalPay" INTEGER NOT NULL DEFAULT 0,
    "totalSalary" INTEGER NOT NULL DEFAULT 0,
    "status" "SalaryStatus" NOT NULL DEFAULT 'GENERATED',
    "remarks" TEXT,
    "generatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EveningSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EveningSalaryDetail" (
    "id" SERIAL NOT NULL,
    "eveningSalaryId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "className" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "subjectName" TEXT NOT NULL,
    "totalFeeCollected" INTEGER NOT NULL DEFAULT 0,
    "teacherShare" INTEGER NOT NULL DEFAULT 0,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EveningSalaryDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentHistory" (
    "id" SERIAL NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "morningChallanId" INTEGER,
    "eveningChallanId" INTEGER,
    "morningSalaryId" INTEGER,
    "eveningSalaryId" INTEGER,
    "amount" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "previousBalance" INTEGER NOT NULL DEFAULT 0,
    "newBalance" INTEGER NOT NULL DEFAULT 0,
    "receivedBy" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "durationWeeks" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL,
    "studentLimit" INTEGER NOT NULL DEFAULT 30,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrashCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseTeacher" (
    "id" SERIAL NOT NULL,
    "crashCourseId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashCourseTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "crashCourseId" INTEGER NOT NULL,
    "agreedFee" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashCourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseTimetable" (
    "id" SERIAL NOT NULL,
    "crashCourseId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrashCourseTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseAttendance" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "crashCourseId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashCourseAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseExam" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "crashCourseId" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passingMarks" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrashCourseExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseMark" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "obtainedMarks" DECIMAL(65,30) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "gradedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrashCourseMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashCourseChallan" (
    "id" SERIAL NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "crashCourseId" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "arrears" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "status" "ChallanStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrashCourseChallan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_family_idx" ON "RefreshToken"("family");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MorningClass_name_key" ON "MorningClass"("name");

-- CreateIndex
CREATE INDEX "MorningClass_regularClassId_idx" ON "MorningClass"("regularClassId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningSubject_name_morningClassId_key" ON "MorningSubject"("name", "morningClassId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningSubjectTeacher_subjectId_teacherId_key" ON "MorningSubjectTeacher"("subjectId", "teacherId");

-- CreateIndex
CREATE INDEX "MorningStudentSubject_studentId_idx" ON "MorningStudentSubject"("studentId");

-- CreateIndex
CREATE INDEX "MorningStudentSubject_subjectId_idx" ON "MorningStudentSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningStudentSubject_studentId_subjectId_key" ON "MorningStudentSubject"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningEnrollment_studentId_key" ON "MorningEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "MorningEnrollment_morningClassId_idx" ON "MorningEnrollment"("morningClassId");

-- CreateIndex
CREATE INDEX "MorningExtrasEnrollment_studentId_idx" ON "MorningExtrasEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "MorningExtrasEnrollment_morningClassId_idx" ON "MorningExtrasEnrollment"("morningClassId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningExtrasEnrollment_studentId_morningClassId_key" ON "MorningExtrasEnrollment"("studentId", "morningClassId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningTimetable_morningClassId_dayOfWeek_startTime_key" ON "MorningTimetable"("morningClassId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "MorningAttendance_studentId_idx" ON "MorningAttendance"("studentId");

-- CreateIndex
CREATE INDEX "MorningAttendance_date_idx" ON "MorningAttendance"("date");

-- CreateIndex
CREATE INDEX "MorningAttendance_teacherId_idx" ON "MorningAttendance"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "MorningAttendance_studentId_subjectId_date_key" ON "MorningAttendance"("studentId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "MorningExam_createdBy_idx" ON "MorningExam"("createdBy");

-- CreateIndex
CREATE INDEX "MorningExam_scheduledDate_idx" ON "MorningExam"("scheduledDate");

-- CreateIndex
CREATE INDEX "MorningMark_gradedBy_idx" ON "MorningMark"("gradedBy");

-- CreateIndex
CREATE UNIQUE INDEX "MorningMark_examId_studentId_key" ON "MorningMark"("examId", "studentId");

-- CreateIndex
CREATE INDEX "MorningMonthlyReport_generatedBy_idx" ON "MorningMonthlyReport"("generatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "MorningMonthlyReport_studentId_month_year_key" ON "MorningMonthlyReport"("studentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EveningClass_name_key" ON "EveningClass"("name");

-- CreateIndex
CREATE INDEX "EveningClass_regularClassId_idx" ON "EveningClass"("regularClassId");

-- CreateIndex
CREATE UNIQUE INDEX "EveningSubject_name_eveningClassId_key" ON "EveningSubject"("name", "eveningClassId");

-- CreateIndex
CREATE UNIQUE INDEX "EveningSubjectTeacher_subjectId_teacherId_key" ON "EveningSubjectTeacher"("subjectId", "teacherId");

-- CreateIndex
CREATE INDEX "EveningEnrollment_studentId_idx" ON "EveningEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "EveningEnrollment_eveningClassId_idx" ON "EveningEnrollment"("eveningClassId");

-- CreateIndex
CREATE UNIQUE INDEX "EveningEnrollment_studentId_eveningClassId_key" ON "EveningEnrollment"("studentId", "eveningClassId");

-- CreateIndex
CREATE INDEX "EveningStudentSubject_studentId_idx" ON "EveningStudentSubject"("studentId");

-- CreateIndex
CREATE INDEX "EveningStudentSubject_subjectId_idx" ON "EveningStudentSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "EveningStudentSubject_studentId_subjectId_key" ON "EveningStudentSubject"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "EveningTimetable_eveningClassId_dayOfWeek_startTime_key" ON "EveningTimetable"("eveningClassId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "EveningAttendance_studentId_idx" ON "EveningAttendance"("studentId");

-- CreateIndex
CREATE INDEX "EveningAttendance_date_idx" ON "EveningAttendance"("date");

-- CreateIndex
CREATE INDEX "EveningAttendance_teacherId_idx" ON "EveningAttendance"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "EveningAttendance_studentId_subjectId_date_key" ON "EveningAttendance"("studentId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "MorningTeacherAttendance_teacherId_idx" ON "MorningTeacherAttendance"("teacherId");

-- CreateIndex
CREATE INDEX "MorningTeacherAttendance_date_idx" ON "MorningTeacherAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MorningTeacherAttendance_teacherId_subjectId_date_key" ON "MorningTeacherAttendance"("teacherId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "EveningTeacherAttendance_teacherId_idx" ON "EveningTeacherAttendance"("teacherId");

-- CreateIndex
CREATE INDEX "EveningTeacherAttendance_date_idx" ON "EveningTeacherAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EveningTeacherAttendance_teacherId_subjectId_date_key" ON "EveningTeacherAttendance"("teacherId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "EveningExam_createdBy_idx" ON "EveningExam"("createdBy");

-- CreateIndex
CREATE INDEX "EveningExam_scheduledDate_idx" ON "EveningExam"("scheduledDate");

-- CreateIndex
CREATE INDEX "EveningMark_gradedBy_idx" ON "EveningMark"("gradedBy");

-- CreateIndex
CREATE UNIQUE INDEX "EveningMark_examId_studentId_key" ON "EveningMark"("examId", "studentId");

-- CreateIndex
CREATE INDEX "EveningMonthlyReport_generatedBy_idx" ON "EveningMonthlyReport"("generatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "EveningMonthlyReport_studentId_month_year_key" ON "EveningMonthlyReport"("studentId", "month", "year");

-- CreateIndex
CREATE INDEX "Announcement_createdBy_idx" ON "Announcement"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "MorningChallan_challanNumber_key" ON "MorningChallan"("challanNumber");

-- CreateIndex
CREATE INDEX "MorningChallan_createdBy_idx" ON "MorningChallan"("createdBy");

-- CreateIndex
CREATE INDEX "MorningChallan_status_idx" ON "MorningChallan"("status");

-- CreateIndex
CREATE INDEX "MorningChallan_dueDate_idx" ON "MorningChallan"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "MorningChallan_studentId_month_year_key" ON "MorningChallan"("studentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EveningChallan_challanNumber_key" ON "EveningChallan"("challanNumber");

-- CreateIndex
CREATE INDEX "EveningChallan_createdBy_idx" ON "EveningChallan"("createdBy");

-- CreateIndex
CREATE INDEX "EveningChallan_status_idx" ON "EveningChallan"("status");

-- CreateIndex
CREATE INDEX "EveningChallan_dueDate_idx" ON "EveningChallan"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "EveningChallan_studentId_month_year_key" ON "EveningChallan"("studentId", "month", "year");

-- CreateIndex
CREATE INDEX "StudentExpense_createdBy_idx" ON "StudentExpense"("createdBy");

-- CreateIndex
CREATE INDEX "StudentExpense_studentId_idx" ON "StudentExpense"("studentId");

-- CreateIndex
CREATE INDEX "MorningSalary_generatedBy_idx" ON "MorningSalary"("generatedBy");

-- CreateIndex
CREATE INDEX "MorningSalary_status_idx" ON "MorningSalary"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MorningSalary_teacherId_month_year_key" ON "MorningSalary"("teacherId", "month", "year");

-- CreateIndex
CREATE INDEX "EveningSalary_generatedBy_idx" ON "EveningSalary"("generatedBy");

-- CreateIndex
CREATE INDEX "EveningSalary_status_idx" ON "EveningSalary"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EveningSalary_teacherId_month_year_key" ON "EveningSalary"("teacherId", "month", "year");

-- CreateIndex
CREATE INDEX "PaymentHistory_receivedBy_idx" ON "PaymentHistory"("receivedBy");

-- CreateIndex
CREATE INDEX "PaymentHistory_paymentType_idx" ON "PaymentHistory"("paymentType");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourse_name_key" ON "CrashCourse"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseTeacher_crashCourseId_teacherId_key" ON "CrashCourseTeacher"("crashCourseId", "teacherId");

-- CreateIndex
CREATE INDEX "CrashCourseEnrollment_studentId_idx" ON "CrashCourseEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "CrashCourseEnrollment_crashCourseId_idx" ON "CrashCourseEnrollment"("crashCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseEnrollment_studentId_crashCourseId_key" ON "CrashCourseEnrollment"("studentId", "crashCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseTimetable_crashCourseId_dayOfWeek_startTime_key" ON "CrashCourseTimetable"("crashCourseId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "CrashCourseAttendance_studentId_idx" ON "CrashCourseAttendance"("studentId");

-- CreateIndex
CREATE INDEX "CrashCourseAttendance_date_idx" ON "CrashCourseAttendance"("date");

-- CreateIndex
CREATE INDEX "CrashCourseAttendance_teacherId_idx" ON "CrashCourseAttendance"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseAttendance_studentId_crashCourseId_date_key" ON "CrashCourseAttendance"("studentId", "crashCourseId", "date");

-- CreateIndex
CREATE INDEX "CrashCourseExam_createdBy_idx" ON "CrashCourseExam"("createdBy");

-- CreateIndex
CREATE INDEX "CrashCourseExam_scheduledDate_idx" ON "CrashCourseExam"("scheduledDate");

-- CreateIndex
CREATE INDEX "CrashCourseMark_gradedBy_idx" ON "CrashCourseMark"("gradedBy");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseMark_examId_studentId_key" ON "CrashCourseMark"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseChallan_challanNumber_key" ON "CrashCourseChallan"("challanNumber");

-- CreateIndex
CREATE INDEX "CrashCourseChallan_createdBy_idx" ON "CrashCourseChallan"("createdBy");

-- CreateIndex
CREATE INDEX "CrashCourseChallan_status_idx" ON "CrashCourseChallan"("status");

-- CreateIndex
CREATE INDEX "CrashCourseChallan_dueDate_idx" ON "CrashCourseChallan"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "CrashCourseChallan_enrollmentId_key" ON "CrashCourseChallan"("enrollmentId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningClass" ADD CONSTRAINT "MorningClass_regularClassId_fkey" FOREIGN KEY ("regularClassId") REFERENCES "MorningClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningSubject" ADD CONSTRAINT "MorningSubject_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningSubjectTeacher" ADD CONSTRAINT "MorningSubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningSubjectTeacher" ADD CONSTRAINT "MorningSubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningStudentSubject" ADD CONSTRAINT "MorningStudentSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningStudentSubject" ADD CONSTRAINT "MorningStudentSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningEnrollment" ADD CONSTRAINT "MorningEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningEnrollment" ADD CONSTRAINT "MorningEnrollment_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningExtrasEnrollment" ADD CONSTRAINT "MorningExtrasEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningExtrasEnrollment" ADD CONSTRAINT "MorningExtrasEnrollment_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningTimetable" ADD CONSTRAINT "MorningTimetable_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningTimetable" ADD CONSTRAINT "MorningTimetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningTimetable" ADD CONSTRAINT "MorningTimetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningAttendance" ADD CONSTRAINT "MorningAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningAttendance" ADD CONSTRAINT "MorningAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningAttendance" ADD CONSTRAINT "MorningAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningExam" ADD CONSTRAINT "MorningExam_morningClassId_fkey" FOREIGN KEY ("morningClassId") REFERENCES "MorningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningExam" ADD CONSTRAINT "MorningExam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningExam" ADD CONSTRAINT "MorningExam_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningMark" ADD CONSTRAINT "MorningMark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "MorningExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningMark" ADD CONSTRAINT "MorningMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningMark" ADD CONSTRAINT "MorningMark_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningMonthlyReport" ADD CONSTRAINT "MorningMonthlyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningMonthlyReport" ADD CONSTRAINT "MorningMonthlyReport_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningClass" ADD CONSTRAINT "EveningClass_regularClassId_fkey" FOREIGN KEY ("regularClassId") REFERENCES "EveningClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningSubject" ADD CONSTRAINT "EveningSubject_eveningClassId_fkey" FOREIGN KEY ("eveningClassId") REFERENCES "EveningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningSubjectTeacher" ADD CONSTRAINT "EveningSubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "EveningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningSubjectTeacher" ADD CONSTRAINT "EveningSubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningEnrollment" ADD CONSTRAINT "EveningEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningEnrollment" ADD CONSTRAINT "EveningEnrollment_eveningClassId_fkey" FOREIGN KEY ("eveningClassId") REFERENCES "EveningClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningStudentSubject" ADD CONSTRAINT "EveningStudentSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningStudentSubject" ADD CONSTRAINT "EveningStudentSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "EveningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningTimetable" ADD CONSTRAINT "EveningTimetable_eveningClassId_fkey" FOREIGN KEY ("eveningClassId") REFERENCES "EveningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningTimetable" ADD CONSTRAINT "EveningTimetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "EveningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningTimetable" ADD CONSTRAINT "EveningTimetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningAttendance" ADD CONSTRAINT "EveningAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningAttendance" ADD CONSTRAINT "EveningAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "EveningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningAttendance" ADD CONSTRAINT "EveningAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningTeacherAttendance" ADD CONSTRAINT "MorningTeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningTeacherAttendance" ADD CONSTRAINT "MorningTeacherAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "MorningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningTeacherAttendance" ADD CONSTRAINT "EveningTeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningTeacherAttendance" ADD CONSTRAINT "EveningTeacherAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "EveningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningExam" ADD CONSTRAINT "EveningExam_eveningClassId_fkey" FOREIGN KEY ("eveningClassId") REFERENCES "EveningClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningExam" ADD CONSTRAINT "EveningExam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "EveningSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningExam" ADD CONSTRAINT "EveningExam_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningMark" ADD CONSTRAINT "EveningMark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "EveningExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningMark" ADD CONSTRAINT "EveningMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningMark" ADD CONSTRAINT "EveningMark_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningMonthlyReport" ADD CONSTRAINT "EveningMonthlyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningMonthlyReport" ADD CONSTRAINT "EveningMonthlyReport_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningChallan" ADD CONSTRAINT "MorningChallan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningChallan" ADD CONSTRAINT "MorningChallan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningChallan" ADD CONSTRAINT "MorningChallan_rolledIntoId_fkey" FOREIGN KEY ("rolledIntoId") REFERENCES "MorningChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningChallan" ADD CONSTRAINT "EveningChallan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningChallan" ADD CONSTRAINT "EveningChallan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningChallan" ADD CONSTRAINT "EveningChallan_rolledIntoId_fkey" FOREIGN KEY ("rolledIntoId") REFERENCES "EveningChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningChallanItem" ADD CONSTRAINT "EveningChallanItem_eveningChallanId_fkey" FOREIGN KEY ("eveningChallanId") REFERENCES "EveningChallan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExpense" ADD CONSTRAINT "StudentExpense_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExpense" ADD CONSTRAINT "StudentExpense_morningChallanId_fkey" FOREIGN KEY ("morningChallanId") REFERENCES "MorningChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExpense" ADD CONSTRAINT "StudentExpense_eveningChallanId_fkey" FOREIGN KEY ("eveningChallanId") REFERENCES "EveningChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExpense" ADD CONSTRAINT "StudentExpense_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningSalary" ADD CONSTRAINT "MorningSalary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorningSalary" ADD CONSTRAINT "MorningSalary_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningSalary" ADD CONSTRAINT "EveningSalary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningSalary" ADD CONSTRAINT "EveningSalary_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EveningSalaryDetail" ADD CONSTRAINT "EveningSalaryDetail_eveningSalaryId_fkey" FOREIGN KEY ("eveningSalaryId") REFERENCES "EveningSalary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_morningChallanId_fkey" FOREIGN KEY ("morningChallanId") REFERENCES "MorningChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_eveningChallanId_fkey" FOREIGN KEY ("eveningChallanId") REFERENCES "EveningChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_morningSalaryId_fkey" FOREIGN KEY ("morningSalaryId") REFERENCES "MorningSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_eveningSalaryId_fkey" FOREIGN KEY ("eveningSalaryId") REFERENCES "EveningSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseTeacher" ADD CONSTRAINT "CrashCourseTeacher_crashCourseId_fkey" FOREIGN KEY ("crashCourseId") REFERENCES "CrashCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseTeacher" ADD CONSTRAINT "CrashCourseTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseEnrollment" ADD CONSTRAINT "CrashCourseEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseEnrollment" ADD CONSTRAINT "CrashCourseEnrollment_crashCourseId_fkey" FOREIGN KEY ("crashCourseId") REFERENCES "CrashCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseTimetable" ADD CONSTRAINT "CrashCourseTimetable_crashCourseId_fkey" FOREIGN KEY ("crashCourseId") REFERENCES "CrashCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseTimetable" ADD CONSTRAINT "CrashCourseTimetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseAttendance" ADD CONSTRAINT "CrashCourseAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseAttendance" ADD CONSTRAINT "CrashCourseAttendance_crashCourseId_fkey" FOREIGN KEY ("crashCourseId") REFERENCES "CrashCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseAttendance" ADD CONSTRAINT "CrashCourseAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseExam" ADD CONSTRAINT "CrashCourseExam_crashCourseId_fkey" FOREIGN KEY ("crashCourseId") REFERENCES "CrashCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseExam" ADD CONSTRAINT "CrashCourseExam_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseMark" ADD CONSTRAINT "CrashCourseMark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "CrashCourseExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseMark" ADD CONSTRAINT "CrashCourseMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseMark" ADD CONSTRAINT "CrashCourseMark_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseChallan" ADD CONSTRAINT "CrashCourseChallan_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CrashCourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseChallan" ADD CONSTRAINT "CrashCourseChallan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseChallan" ADD CONSTRAINT "CrashCourseChallan_crashCourseId_fkey" FOREIGN KEY ("crashCourseId") REFERENCES "CrashCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashCourseChallan" ADD CONSTRAINT "CrashCourseChallan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
