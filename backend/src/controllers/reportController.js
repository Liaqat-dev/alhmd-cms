const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {userHasPermission} = require('../utils/permissions');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Student include that brings in the class
const studentInclude = {
    select: {
        id: true,
        name: true,
        rollNumber: true,
        morningEnrollment: {include: {morningClass: {select: {id: true, name: true}}}}
    }
};

// Normalizes a report row so student.class is a flat { id, name } object (UI expects this shape)
function mapReport(report) {
    const {student, ...rest} = report;
    const classObj = student.morningEnrollment?.morningClass;
    return {...rest, student: {...student, class: classObj || null}};
}

// Computes attendance stats for a student in a date range
async function getAttendanceStats(studentId, startDate, endDate) {
    const attendances = await prisma.morningAttendance.findMany({
        where: {
            studentId,
            date: {gte: startDate, lte: endDate}
        }
    });

    const totalWorkingDays = attendances.length;
    const totalPresent = attendances.filter(a => a.status === 'PRESENT').length;
    const totalAbsent = attendances.filter(a => a.status === 'ABSENT').length;
    const totalLeave = attendances.filter(a => a.status === 'LEAVE').length;
    const attendancePercentage = totalWorkingDays > 0 ? (totalPresent / totalWorkingDays) * 100 : 0;

    return {totalWorkingDays, totalPresent, totalAbsent, totalLeave, attendancePercentage};
}

// Computes marks stats for a student in a date range
async function getMarksStats(studentId, startDate, endDate) {
    const marks = await prisma.morningMark.findMany({
        where: {studentId, exam: {scheduledDate: {gte: startDate, lte: endDate}}},
        include: {exam: {include: {subject: {select: {id: true, name: true}}}}}
    });

    let totalObtained = 0, totalPossible = 0, examsPassed = 0;
    for (const mark of marks) {
        totalObtained += Number(mark.obtainedMarks);
        totalPossible += mark.exam.totalMarks;
        if (Number(mark.obtainedMarks) >= mark.exam.passingMarks) examsPassed++;
    }
    const averageMarks = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : null;

    return {marks, totalExams: marks.length, examsPassed, averageMarks};
}

// Builds subject-wise details from ALL class exams in the period.
// allExams: every exam held for the class that month (MorningExam[])
// marksMap: Map<examId, markRow> — only the student's submitted marks
// Attendance is now recorded per class (not per subject), so it's reported
// once at the top level (see getAttendanceStats) rather than broken out here.
function buildSubjectDetails(allExams, marksMap) {
    const subjectMap = {};

    for (const exam of allExams) {
        const sid = exam.subjectId;
        if (!subjectMap[sid]) {
            subjectMap[sid] = {
                subjectId: sid,
                subjectName: exam.subject.name,
                exams: [],
                totalObtained: 0,
                totalPossible: 0,
                examsPassed: 0,
            };
        }

        const mark = marksMap.get(exam.id);
        subjectMap[sid].exams.push({
            title: exam.title,
            examType: exam.examType,
            scheduledDate: exam.scheduledDate,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            obtainedMarks: mark ? mark.obtainedMarks : null,
            grade: mark ? mark.grade : null,
            remarks: mark ? (mark.remarks || null) : null,
            notTaken: !mark
        });

        if (mark) {
            subjectMap[sid].totalObtained += Number(mark.obtainedMarks);
            subjectMap[sid].totalPossible += exam.totalMarks;
            if (Number(mark.obtainedMarks) >= exam.passingMarks) subjectMap[sid].examsPassed++;
        }
    }

    return Object.values(subjectMap).map(s => ({
        ...s,
        percentage: s.totalPossible > 0 ? ((s.totalObtained / s.totalPossible) * 100).toFixed(1) : null,
    }));
}

// Fetches all exams held for a student's class in a date range and returns
// subject details combining every exam with the student's marks (if any).
async function fetchSubjectDetails(studentId, startDate, endDate, enrolledStudent) {
    const classId = enrolledStudent.morningEnrollment?.morningClassId;

    if (!classId) return [];

    // All exams held for the class in this period
    const allExams = await prisma.morningExam.findMany({
        where: {morningClassId: classId, scheduledDate: {gte: startDate, lte: endDate}},
        include: {subject: {select: {id: true, name: true}}},
        orderBy: [{subjectId: 'asc'}, {scheduledDate: 'asc'}]
    });

    if (allExams.length === 0) return [];

    // Student's marks for those exams
    const examIds = allExams.map(e => e.id);
    const studentMarks = await prisma.morningMark.findMany({
        where: {
            studentId,
            examId: {in: examIds}
        }
    });

    const marksMap = new Map(studentMarks.map(m => [m.examId, m]));

    return buildSubjectDetails(allExams, marksMap);
}

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /reports/generate
const generateStudentReport = catchAsync(async (req, res) => {
    const {studentId, month, year} = req.body;

    if (!studentId || !month || !year) {
        throw new AppError(400, {message: 'Student ID, month, and year are required'});
    }

    const student = await prisma.student.findUnique({
        where: {id: studentId}, ...studentInclude
    });
    if (!student) throw new AppError(404, 'Student not found');

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const [attendance, marksData] = await Promise.all([getAttendanceStats(studentId, startDate, endDate), getMarksStats(studentId, startDate, endDate)]);

    const reportData = {
        studentId,
        month: parseInt(month),
        year: parseInt(year),
        attendancePercentage: parseFloat(attendance.attendancePercentage.toFixed(2)),
        totalPresent: attendance.totalPresent,
        totalAbsent: attendance.totalAbsent,
        totalLeave: attendance.totalLeave,
        totalWorkingDays: attendance.totalWorkingDays,
        averageMarks: marksData.averageMarks !== null ? parseFloat(marksData.averageMarks.toFixed(2)) : null,
        totalExams: marksData.totalExams,
        examsPassed: marksData.examsPassed,
        generatedBy: req.user.id
    };

    const report = await prisma.morningMonthlyReport.upsert({
        where: {studentId_month_year: {studentId, month: parseInt(month), year: parseInt(year)}},
        update: reportData,
        create: reportData,
        include: {student: studentInclude}
    });

    // Fetch all class exams for the full subject breakdown (includes not-taken exams)
    const subjects = await fetchSubjectDetails(studentId, startDate, endDate, student);

    res.json({
        message: 'Report generated successfully', report: mapReport(report), details: {subjects}
    });
});

// POST /reports/generate-class
const generateClassReports = catchAsync(async (req, res) => {
    const {classId, month, year} = req.body;

    if (!classId || !month || !year) {
        throw new AppError(400, {message: 'Class ID, month, and year are required'});
    }

    // Get all active students in the class
    const enrollments = await prisma.morningEnrollment.findMany({
        where: {morningClassId: classId, isActive: true}, select: {studentId: true}
    });
    const studentIds = enrollments.map(e => e.studentId);

    const results = {generated: 0, errors: []};
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    for (const studentId of studentIds) {
        try {
            const [attendance, marksData] = await Promise.all([getAttendanceStats(studentId, startDate, endDate), getMarksStats(studentId, startDate, endDate)]);

            const reportData = {
                studentId,
                month: parseInt(month),
                year: parseInt(year),
                attendancePercentage: attendance.attendancePercentage,
                totalPresent: attendance.totalPresent,
                totalAbsent: attendance.totalAbsent,
                totalLeave: attendance.totalLeave,
                totalWorkingDays: attendance.totalWorkingDays,
                averageMarks: marksData.averageMarks,
                totalExams: marksData.totalExams,
                examsPassed: marksData.examsPassed,
                generatedBy: req.user.id
            };

            await prisma.morningMonthlyReport.upsert({
                where: {studentId_month_year: {studentId, month: parseInt(month), year: parseInt(year)}},
                update: reportData,
                create: reportData
            });

            results.generated++;
        } catch (err) {
            results.errors.push({studentId, error: err.message});
        }
    }

    res.json({message: `Reports generated: ${results.generated}`, results});
});

// GET /reports
const getAllReports = catchAsync(async (req, res) => {
    const {classId, month, year, studentId} = req.query;

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (studentId) where.studentId = studentId;
    if (classId) {
        where.student = {morningEnrollment: {morningClassId: classId}};
    }

    const reports = await prisma.morningMonthlyReport.findMany({
        where, include: {student: studentInclude}, orderBy: [{year: 'desc'}, {month: 'desc'}, {student: {name: 'asc'}}]
    });

    res.json({reports: reports.map(mapReport)});
});

// GET /reports/:id
const getReportById = catchAsync(async (req, res) => {
    const {id} = req.params;

    const report = await prisma.morningMonthlyReport.findUnique({
        where: {id}, include: {student: studentInclude}
    });
    if (!report) throw new AppError(404, 'Report not found');

    // Ownership (a student viewing their own report) vs. reports.view
    // permission — this can't be a route-level middleware check like
    // allowSelfOrPermission, because the resource's owner (report.studentId)
    // isn't known until after this lookup: the :id here is the report's own
    // id, not the student's.
    if (req.user.role === 'STUDENT') {
        if (report.studentId !== req.user.id) {
            throw new AppError(403, 'You do not have permission to view this report.');
        }
    } else {
        const allowed = await userHasPermission(req.user, 'reports.view');
        if (!allowed) throw new AppError(403, 'You do not have permission to view this report.');
    }

    const startDate = new Date(report.year, report.month - 1, 1);
    const endDate = new Date(report.year, report.month, 0);

    const subjects = await fetchSubjectDetails(report.studentId, startDate, endDate, report.student);

    res.json({
        report: mapReport(report), details: {subjects}
    });
});

// GET /reports/student/:studentId  (or /reports/my for student role)
const getStudentReports = catchAsync(async (req, res) => {
    const studentId = req.user.student?.id || req.params.studentId;
    if (!studentId) throw new AppError(400, {message: 'Student ID required'});

    const reports = await prisma.morningMonthlyReport.findMany({
        where: {studentId}, include: {student: studentInclude}, orderBy: [{year: 'desc'}, {month: 'desc'}]
    });

    res.json({reports: reports.map(mapReport)});
});

// PATCH /reports/:id/remarks
const updateReportRemarks = catchAsync(async (req, res) => {
    const {id} = req.params;
    const {teacherRemarks} = req.body;

    const report = await prisma.morningMonthlyReport.update({
        where: {id}, data: {teacherRemarks}, include: {student: studentInclude}
    });

    res.json({message: 'Remarks updated successfully', report: mapReport(report)});
});

// DELETE /reports/:id
const deleteReport = catchAsync(async (req, res) => {
    const {id} = req.params;

    const report = await prisma.morningMonthlyReport.findUnique({where: {id}});
    if (!report) throw new AppError(404, 'Report not found');
    await prisma.morningMonthlyReport.delete({where: {id}});

    res.json({message: 'Report deleted successfully'});
});

// GET /reports/class-summary
const getClassPerformanceSummary = catchAsync(async (req, res) => {
    const {classId, month, year} = req.query;

    if (!classId || !month || !year) {
        throw new AppError(400, {message: 'Class ID, month, and year are required'});
    }

    const studentFilter = {morningEnrollment: {morningClassId: classId}};

    const reports = await prisma.morningMonthlyReport.findMany({
        where: {
            student: studentFilter, month: parseInt(month), year: parseInt(year)
        }, include: {student: studentInclude}
    });

    const summary = {
        totalStudents: reports.length, averageAttendance: 0, averageMarks: 0, topPerformers: [], needsAttention: []
    };

    if (reports.length > 0) {
        let totalAttendance = 0, totalMarks = 0, marksCount = 0;

        for (const report of reports) {
            totalAttendance += Number(report.attendancePercentage);
            if (report.averageMarks) {
                totalMarks += Number(report.averageMarks);
                marksCount++;
            }
        }

        summary.averageAttendance = (totalAttendance / reports.length).toFixed(2);
        summary.averageMarks = marksCount > 0 ? (totalMarks / marksCount).toFixed(2) : 0;

        const sorted = [...reports].sort((a, b) => {
            const aScore = Number(a.averageMarks || 0) + Number(a.attendancePercentage);
            const bScore = Number(b.averageMarks || 0) + Number(b.attendancePercentage);
            return bScore - aScore;
        });

        summary.topPerformers = sorted.slice(0, 5).map(r => ({
            name: r.student.name,
            rollNumber: r.student.rollNumber,
            attendance: r.attendancePercentage,
            marks: r.averageMarks
        }));

        summary.needsAttention = sorted.slice(-5).reverse().filter(r => Number(r.attendancePercentage) < 75 || (r.averageMarks && Number(r.averageMarks) < 50)).map(r => ({
            name: r.student.name,
            rollNumber: r.student.rollNumber,
            attendance: r.attendancePercentage,
            marks: r.averageMarks
        }));
    }

    res.json({summary, reports: reports.map(mapReport)});
});

module.exports = {
    generateStudentReport,
    generateClassReports,
    getAllReports,
    getReportById,
    getStudentReports,
    updateReportRemarks,
    deleteReport,
    getClassPerformanceSummary
};
