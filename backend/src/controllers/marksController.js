const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Helpers ───────────────────────────────────────────────────────────────────

const calculateGrade = (obtained, total) => {
  const pct = (obtained / total) * 100;
  if (pct >= 90) return 'A*';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'U';
};

// Normalizes an exam row to the shape the UI expects:
//   name  ← title
//   examDate ← scheduledDate
//   classId  ← classId
//   class    ← class
function mapExam(e) {
  const { class: cls, ...rest } = e;
  return {
    ...rest,
    name: e.title,
    examDate: e.scheduledDate,
    classId: e.classId,
    class: cls || null,
  };
}

const examInclude = {
  class: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  _count: { select: { marks: true } }
};

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /marks/exams
const getAllExams = catchAsync(async (req, res) => {
  const { classId, subjectId, examType } = req.query;

  const where = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;
  if (examType) where.examType = examType;

  const rows = await prisma.exam.findMany({
    where,
    include: examInclude,
    orderBy: { scheduledDate: 'desc' }
  });
  const exams = rows.map(mapExam);

  res.json({ exams });
});

// GET /marks/exams/:id
const getExamById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const row = await prisma.exam.findUnique({
    where: { id },
    include: {
      class: true,
      subject: true,
      marks: {
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { student: { name: 'asc' } }
      }
    }
  });
  if (!row) throw new AppError(404, 'Exam not found');

  res.json({ exam: mapExam(row) });
});

// POST /marks/exams
// If subjectId === 'ALL', creates one exam per subject in the class
const createExam = catchAsync(async (req, res) => {
  const { name, examType, classId, subjectId, totalMarks, passingMarks, examDate } = req.body;

  if (!name || !examType || !classId || !subjectId || !totalMarks || !passingMarks || !examDate) {
    throw new AppError(400, { message: 'All fields are required' });
  }

  const isAllSubjects = subjectId === 'ALL';

  // Validate class exists
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError(400, { classId: 'Class not found' });

  const baseData = {
    title: name.trim(),
    examType,
    totalMarks: parseInt(totalMarks),
    passingMarks: parseInt(passingMarks),
    scheduledDate: new Date(examDate),
    createdBy: req.user.id
  };

  if (isAllSubjects) {
    // Create one exam per subject
    const subjects = await prisma.subject.findMany({ where: { classes: { some: { id: classId } } } });

    if (subjects.length === 0) {
      throw new AppError(400, { message: 'This class has no subjects.' });
    }

    const createdExams = [];
    for (const subject of subjects) {
      const row = await prisma.exam.create({
        data: { ...baseData, classId: classId, subjectId: subject.id },
        include: examInclude
      });
      createdExams.push(mapExam(row));
    }

    return res.status(201).json({
      message: `${createdExams.length} exams created successfully (one per subject)`,
      exams: createdExams
    });
  }

  // Single subject exam
  const sub = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!sub) throw new AppError(400, { subjectId: 'Subject not found' });

  const row = await prisma.exam.create({
    data: { ...baseData, classId: classId, subjectId },
    include: examInclude
  });
  const exam = mapExam(row);

  res.status(201).json({ message: 'Exam created successfully', exam });
});

// PUT /marks/exams/:id
const updateExam = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, examType, totalMarks, passingMarks, examDate } = req.body;

  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Exam not found');

  const data = {
    ...(name && { title: name.trim() }),
    ...(examType && { examType }),
    ...(totalMarks && { totalMarks: parseInt(totalMarks) }),
    ...(passingMarks && { passingMarks: parseInt(passingMarks) }),
    ...(examDate && { scheduledDate: new Date(examDate) })
  };

  const row = await prisma.exam.update({ where: { id }, data, include: examInclude });
  const exam = mapExam(row);

  res.json({ message: 'Exam updated successfully', exam });
});

// DELETE /marks/exams/:id
const deleteExam = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Exam not found');

  await prisma.exam.delete({ where: { id } });

  res.json({ message: 'Exam deleted successfully' });
});

// POST /marks/enter
const enterMarks = catchAsync(async (req, res) => {
  const { examId, marks } = req.body;
  if (!examId || !marks || !Array.isArray(marks)) {
    throw new AppError(400, { message: 'Exam ID and marks array are required' });
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new AppError(404, 'Exam not found');

  const results = { created: 0, updated: 0, errors: [] };

  for (const markEntry of marks) {
    const { studentId, obtainedMarks, remarks } = markEntry;
    try {
      if (obtainedMarks > exam.totalMarks) {
        results.errors.push({ studentId, error: 'Obtained marks exceed total marks' });
        continue;
      }
      const grade = calculateGrade(obtainedMarks, exam.totalMarks);
      const existing = await prisma.mark.findUnique({
        where: { examId_studentId: { examId, studentId } }
      });

      if (existing) {
        await prisma.mark.update({
          where: { id: existing.id },
          data: { obtainedMarks: parseFloat(obtainedMarks), grade, remarks, gradedBy: req.user.id }
        });
        results.updated++;
      } else {
        await prisma.mark.create({
          data: { examId, studentId, obtainedMarks: parseFloat(obtainedMarks), grade, remarks, gradedBy: req.user.id }
        });
        results.created++;
      }
    } catch (err) {
      results.errors.push({ studentId, error: err.message });
    }
  }

  res.json({ message: `Marks entered: ${results.created} created, ${results.updated} updated`, results });
});

// GET /marks/student/:studentId  (or /marks/my for student role)
const getStudentMarks = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id || req.params.studentId;
  if (!studentId) throw new AppError(400, { message: 'Student ID required' });

  const { subjectId, examType } = req.query;

  const examWhere = {};
  if (subjectId) examWhere.subjectId = subjectId;
  if (examType) examWhere.examType = examType;

  let marks = await prisma.mark.findMany({
    where: { studentId, exam: examWhere },
    include: {
      exam: {
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { exam: { scheduledDate: 'desc' } }
  });
  marks = marks.map(m => ({ ...m, exam: mapExam(m.exam) }));

  const statistics = { totalExams: marks.length, averagePercentage: 0, passed: 0, failed: 0 };
  if (marks.length > 0) {
    let totalPct = 0;
    for (const mark of marks) {
      const pct = (Number(mark.obtainedMarks) / mark.exam.totalMarks) * 100;
      totalPct += pct;
      if (Number(mark.obtainedMarks) >= mark.exam.passingMarks) statistics.passed++;
      else statistics.failed++;
    }
    statistics.averagePercentage = (totalPct / marks.length).toFixed(2);
  }

  res.json({ marks, statistics });
});

// GET /marks/class/:examId  — returns all enrolled students with their mark for this exam
const getClassMarks = catchAsync(async (req, res) => {
  const { examId } = req.params;

  const examRow = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } }
    }
  });
  if (!examRow) throw new AppError(404, 'Exam not found');

  const studentSelect = {
    id: true, name: true, rollNumber: true,
    marks: { where: { examId }, take: 1 }
  };
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: examRow.classId, isActive: true },
    include: { student: { select: studentSelect } },
    orderBy: { student: { name: 'asc' } }
  });
  const students = enrollments.map(e => ({ ...e.student, marks: e.student.marks }));

  const exam = mapExam(examRow);
  const markedStudents = students.filter(s => s.marks.length > 0);

  const statistics = {
    totalStudents: students.length,
    markedCount: markedStudents.length,
    pendingCount: students.length - markedStudents.length,
    averageMarks: 0, highestMarks: 0, lowestMarks: exam.totalMarks,
    passCount: 0, failCount: 0
  };

  if (markedStudents.length > 0) {
    let totalMarks = 0;
    for (const student of markedStudents) {
      const obtained = Number(student.marks[0].obtainedMarks);
      totalMarks += obtained;
      if (obtained > statistics.highestMarks) statistics.highestMarks = obtained;
      if (obtained < statistics.lowestMarks) statistics.lowestMarks = obtained;
      if (obtained >= exam.passingMarks) statistics.passCount++;
      else statistics.failCount++;
    }
    statistics.averageMarks = (totalMarks / markedStudents.length).toFixed(2);
  }

  res.json({ exam, students, statistics });
});

// GET /marks/subject-wise/:studentId  (or /marks/my/subject-wise)
const getSubjectWiseMarks = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id || req.params.studentId;
  if (!studentId) throw new AppError(400, { message: 'Student ID required' });

  const marks = await prisma.mark.findMany({
    where: { studentId },
    include: { exam: { include: { subject: { select: { id: true, name: true } } } } }
  });

  const subjectWise = {};
  for (const mark of marks) {
    const sid = mark.exam.subjectId;
    const subjectName = mark.exam.subject.name;

    if (!subjectWise[sid]) {
      subjectWise[sid] = { subjectId: sid, subjectName, exams: [], totalObtained: 0, totalPossible: 0 };
    }

    subjectWise[sid].exams.push({
      examName: mark.exam.title,
      examType: mark.exam.examType,
      examDate: mark.exam.scheduledDate,
      obtainedMarks: mark.obtainedMarks,
      totalMarks: mark.exam.totalMarks,
      grade: mark.grade
    });
    subjectWise[sid].totalObtained += Number(mark.obtainedMarks);
    subjectWise[sid].totalPossible += mark.exam.totalMarks;
  }

  const subjects = Object.values(subjectWise).map(subject => ({
    ...subject,
    percentage: ((subject.totalObtained / subject.totalPossible) * 100).toFixed(2),
    grade: calculateGrade(subject.totalObtained, subject.totalPossible)
  }));

  res.json({ subjects });
});

// GET /marks/teacher-exams  — exams for the teacher's assigned classes
const getTeacherExams = catchAsync(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  if (!teacherId) throw new AppError(400, { message: 'Teacher not found' });

  const subjectTeachers = await prisma.subjectTeacher.findMany({
    where: { teacherId },
    include: { subject: { select: { classes: { select: { id: true } } } } }
  });
  const classIds = [...new Set(subjectTeachers.flatMap(st => st.subject.classes.map(c => c.id)))];

  const rows = await prisma.exam.findMany({
    where: { classId: { in: classIds } },
    include: examInclude,
    orderBy: { scheduledDate: 'desc' }
  });
  const exams = rows.map(mapExam);

  res.json({ exams });
});

module.exports = {
  getAllExams, getExamById, createExam, updateExam, deleteExam,
  enterMarks, getStudentMarks, getClassMarks, getSubjectWiseMarks, getTeacherExams
};
