const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {parseId, parseIds} = require('../utils/helpers');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Include shape for fetching a teacher's subject assignments
const teacherSubjectInclude = {
    morningSubjects: {
        include: {
            subject: {
                include: {classes: {select: {id: true, name: true}}}
            }
        }
    }
};

// Maps raw teacher (with morningSubjects) to UI-expected shape:
//   teacher.classes        → [{ classId, class: { id, name } }]
//   teacher.teacherSubjects → [{ subjectId, subject: { classId, name } }]
// A subject can now span multiple classes, so each subject-class pair the
// teacher is assigned to becomes its own teacherSubjects entry.
function mapTeacher(t) {
    const teacherSubjects = [];
    const classMap = new Map();

    (t.morningSubjects || []).forEach(ms => {
        const subjectClasses = ms.subject.classes || [];
        if (subjectClasses.length === 0) {
            // Subject isn't linked to any class yet — still surface the assignment
            teacherSubjects.push({subjectId: ms.subjectId, subject: {classId: null, name: ms.subject.name}});
            return;
        }
        subjectClasses.forEach(cls => {
            teacherSubjects.push({subjectId: ms.subjectId, subject: {classId: cls.id, name: ms.subject.name}});
            if (!classMap.has(cls.id)) {
                classMap.set(cls.id, {
                    classId: cls.id,
                    class: {id: cls.id, name: cls.name}
                });
            }
        });
    });

    return {
        ...t,
        classes: [...classMap.values()],
        teacherSubjects
    };
}

// Assigns subjects to a teacher from classAssignments: [{ classId, subjectIds }]
async function applyClassAssignments(teacherId, classAssignments, {replaceExisting = false} = {}) {
    if (!classAssignments || classAssignments.length === 0) {
        // Still clear existing assignments if replacing
        if (replaceExisting) {
            const tid = parseId(teacherId);
            await prisma.morningSubjectTeacher.deleteMany({where: {teacherId: tid}});
        }
        return;
    }

    const tid = parseId(teacherId);
    const morningEntries = [];

    for (const {subjectIds = []} of classAssignments) {
        const parsedSubjectIds = parseIds(subjectIds);
        for (const subjectId of parsedSubjectIds) {
            morningEntries.push({subjectId, teacherId: tid});
        }
    }

    // Check for subjects already assigned to a DIFFERENT teacher BEFORE any writes
    if (morningEntries.length > 0) {
        const subjectIds = [...new Set(morningEntries.map(e => e.subjectId))];
        const conflicts = await prisma.morningSubjectTeacher.findMany({
            where: {subjectId: {in: subjectIds}, teacherId: {not: tid}},
            include: {
                teacher: {select: {name: true}},
                subject: {select: {name: true, classes: {select: {name: true}}}}
            }
        });
        if (conflicts.length > 0) {
            const c = conflicts[0];
            const classNames = c.subject.classes.map(cl => cl.name).join(', ') || 'N/A';
            throw new AppError(400, {
                message: `Subject "${c.subject.name}" in class "${classNames}" is already assigned to ${c.teacher.name}`
            });
        }
    }

    // All conflict checks passed — delete old assignments (if replacing), then write new ones
    if (replaceExisting) {
        await prisma.morningSubjectTeacher.deleteMany({where: {teacherId: tid}});
    }
    if (morningEntries.length > 0) {
        await prisma.morningSubjectTeacher.createMany({data: morningEntries, skipDuplicates: true});
    }
}

// ── Controllers ───────────────────────────────────────────────────────────────

const getAllTeachers = catchAsync(async (req, res) => {
    const {search, page = 1, limit = 1000} = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
        where.OR = [
            {name: {contains: search, mode: 'insensitive'}},
            {user: {email: {contains: search, mode: 'insensitive'}}}
        ];
    }

    const [teachers, total] = await Promise.all([
        prisma.teacher.findMany({
            where,
            include: {
                user: {select: {id: true, email: true, isVerified: true, createdAt: true, profilePicUrl: true}},
                qualifications: {orderBy: {endYear: 'desc'}},
                ...teacherSubjectInclude
            },
            orderBy: {createdAt: 'desc'},
            skip,
            take: limitNum
        }),
        prisma.teacher.count({where})
    ]);

    res.json({teachers: teachers.map(mapTeacher), total, page: pageNum, limit: limitNum});
});

const getTeacherById = catchAsync(async (req, res) => {
    const {id} = req.params;

    const teacher = await prisma.teacher.findUnique({
        where: {id},
        include: {
            user: {select: {id: true, email: true, isVerified: true, createdAt: true, profilePicUrl: true}},
            qualifications: {orderBy: {endYear: 'desc'}},
            ...teacherSubjectInclude
        }
    });

    if (!teacher) throw new AppError(404, 'Teacher not found');

    res.json({teacher: mapTeacher(teacher)});
});

// Normalizes incoming qualification rows into Prisma create-input shape
function mapQualificationsInput(qualifications) {
    if (!Array.isArray(qualifications)) return [];
    return qualifications
        .filter(q => q && q.degreeTitle)
        .map(q => ({
            degreeTitle: q.degreeTitle,
            institute: q.institute || '',
            startYear: parseInt(q.startYear, 10),
            endYear: parseInt(q.endYear, 10),
            totalMarksOrGpa: String(q.totalMarksOrGpa ?? ''),
            obtainedMarksOrGpa: String(q.obtainedMarksOrGpa ?? ''),
        }));
}

const createTeacher = catchAsync(async (req, res) => {
    const {
        email,
        password,
        name,
        phone,
        address,
        joiningDate,
        classAssignments,
        additionalPay,
        basicSalary,
        bonus,
        qualifications
    } = req.body;

    if (!email || !password || !name) {
        throw new AppError(400, {message: 'Email, password, and name are required'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: 'TEACHER',
            isVerified: false,
            teacher: {
                create: {
                    name, phone, address,
                    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
                    additionalPay: additionalPay ? parseFloat(additionalPay) : 0,
                    basicSalary: basicSalary ? parseInt(basicSalary) : 0,
                    bonus: bonus ? parseInt(bonus) : 0,
                    qualifications: {create: mapQualificationsInput(qualifications)}
                }
            }
        },
        include: {teacher: true}
    });

    await applyClassAssignments(user.teacher.id, classAssignments);

    const teacher = await prisma.teacher.findUnique({
        where: {id: user.teacher.id},
        include: {
            user: {select: {id: true, email: true, isVerified: true, createdAt: true, profilePicUrl: true}},
            qualifications: {orderBy: {endYear: 'desc'}},
            ...teacherSubjectInclude
        }
    });

    res.status(201).json({message: 'Teacher created successfully', teacher: mapTeacher(teacher)});
});

const updateTeacher = catchAsync(async (req, res) => {
    const {id} = req.params;
    const {
        email,
        name,
        phone,
        address,
        joiningDate,
        classAssignments,
        additionalPay,
        basicSalary,
        bonus,
        qualifications
    } = req.body;

    const existingTeacher = await prisma.teacher.findUnique({where: {id}});
    if (!existingTeacher) throw new AppError(404, 'Teacher not found');

    if (email !== undefined) {
        await prisma.user.update({
            where: {id: existingTeacher.userId},
            data: {email}
        });
    }

    await prisma.teacher.update({
        where: {id},
        data: {
            ...(name !== undefined && {name}),
            ...(phone !== undefined && {phone}),
            ...(address !== undefined && {address}),
            ...(joiningDate && {joiningDate: new Date(joiningDate)}),
            ...(additionalPay !== undefined && {additionalPay: parseFloat(additionalPay)}),
            ...(basicSalary !== undefined && {basicSalary: parseInt(basicSalary) || 0}),
            ...(bonus !== undefined && {bonus: parseInt(bonus) || 0}),
            ...(qualifications !== undefined && {
                qualifications: {
                    deleteMany: {},
                    create: mapQualificationsInput(qualifications)
                }
            })
        }
    });

    // Rebuild class/subject assignments if provided.
    // applyClassAssignments runs all conflict checks first, then writes —
    // so we only delete existing assignments once we know the new ones are valid.
    if (classAssignments !== undefined) {
        const tid = parseId(id);
        await applyClassAssignments(tid, classAssignments, {replaceExisting: true});
    }

    const teacher = await prisma.teacher.findUnique({
        where: {id},
        include: {
            user: {select: {id: true, email: true, isVerified: true}},
            qualifications: {orderBy: {endYear: 'desc'}},
            ...teacherSubjectInclude
        }
    });

    res.json({message: 'Teacher updated successfully', teacher: mapTeacher(teacher)});
});

const deleteTeacher = catchAsync(async (req, res) => {
    const {id} = req.params;

    const teacher = await prisma.teacher.findUnique({where: {id}, include: {user: true}});
    if (!teacher) throw new AppError(404, 'Teacher not found');

    await prisma.user.delete({where: {id: teacher.userId}});

    res.json({message: 'Teacher deleted successfully'});
});

// GET /teachers/my-classes — for teacher role: returns their class+subject pairs for attendance
const getTeacherClasses = catchAsync(async (req, res) => {
    const teacherId = req.user.teacher?.id;
    if (!teacherId) throw new AppError(400, {message: 'Teacher profile not found'});

    const rows = await prisma.morningSubjectTeacher.findMany({
        where: {teacherId},
        include: {
            subject: {
                include: {classes: {select: {id: true, name: true}}}
            }
        }
    });
    const classSubjectPairs = [];
    rows.forEach(r => {
        (r.subject.classes || []).forEach(cls => {
            classSubjectPairs.push({
                key: `${cls.id}:${r.subjectId}`,
                classId: cls.id,
                className: cls.name,
                subjectId: r.subjectId,
                subjectName: r.subject.name
            });
        });
    });

    res.json({classes: classSubjectPairs});
});

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherClasses
};
