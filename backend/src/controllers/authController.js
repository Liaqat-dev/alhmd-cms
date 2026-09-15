const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { sendVerificationEmail, sendPasswordResetNotification, sendPasswordResetEmail } = require('../utils/emailService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getUserPermissionNames } = require('../utils/permissions');
const {
    REFRESH_TOKEN_EXPIRY_MS,
    EMAIL_VERIFICATION_EXPIRY_MS,
    PASSWORD_RESET_EXPIRY_MS,
    BCRYPT_ROUNDS,
    MIN_PASSWORD_LENGTH,
    DUMMY_BCRYPT_HASH,
} = require('../config/constants');

// ── Token helpers ─────────────────────────────────────────────────────────────

const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

// `id` is either a User.id (role ADMIN/TEACHER) or a Student.id (role STUDENT)
const generateAccessToken = (id, role) =>
    jwt.sign({id, role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

const generateRawRefreshToken = () =>
    crypto.randomBytes(64).toString('hex');

// The staff portal and student portal are separate frontends that both talk
// to this same backend host — browsers scope cookies by host, not by the
// calling page's origin/port. Using one cookie name for both would let
// whichever app logs in last silently overwrite the other's session cookie
// in the shared browser cookie jar. Distinct names keep the two fully
// independent even though they share a backend.
const REFRESH_COOKIE = 'refreshToken';
const STUDENT_REFRESH_COOKIE = 'studentRefreshToken';

const setRefreshCookie = (res, token, cookieName = REFRESH_COOKIE) => {
    res.cookie(cookieName, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
        path: '/',
    });
};

const clearRefreshCookie = (res, cookieName = REFRESH_COOKIE) => {
    res.clearCookie(cookieName, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
    });
};

// Seconds until access token expires (for frontend refresh scheduling)
const getAccessTokenExpiresIn = () => {
    const raw = process.env.JWT_EXPIRES_IN || '15m';
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const [, n, unit] = match;
    const map = {s: 1, m: 60, h: 3600, d: 86400};
    return parseInt(n, 10) * (map[unit] || 60);
};

const shapeStudentUser = (student) => {
    const {password: _pw, ...rest} = student;
    return {
        id: student.id,
        role: 'STUDENT',
        email: student.email,
        profilePicUrl: student.profilePicUrl,
        profilePicPublicId: student.profilePicPublicId,
        student: rest,
    };
};

// ── Shared: issue / re-issue verification token ───────────────────────────────

const issueVerificationToken = async (userId, email, name) => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

    await prisma.emailVerification.upsert({
        where: {userId},
        update: {tokenHash, expiresAt, createdAt: new Date()},
        create: {userId, tokenHash, expiresAt},
    });

    await sendVerificationEmail(email, name, rawToken);
};

// ── Login (Admin / Teacher — by email) ────────────────────────────────────────

const login = catchAsync(async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        throw new AppError(400, {message: 'Email and password are required'});
    }

    const user = await prisma.user.findUnique({
        where: {email},
        include: {admin: true, teacher: true},
    });

    // Constant-time dummy compare prevents timing-based user enumeration
    const dummyHash = DUMMY_BCRYPT_HASH;
    const passwordToCheck = user ? user.password : dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCheck);

    if (!user || !isPasswordValid) {
        throw new AppError(401, {message: 'Invalid credentials'});
    }

    if (user.email && !user.isVerified) {
        const name = user.admin?.name || user.teacher?.name || 'User';
        try {
            await issueVerificationToken(user.id, user.email, name);
        } catch (_) { /* non-blocking */
        }
        throw new AppError(
            403,
            {message: 'Email not verified. A new verification link has been sent to your email.'},
            'EMAIL_NOT_VERIFIED',
        );
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const rawRefreshToken = generateRawRefreshToken();
    const family = crypto.randomUUID();

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(rawRefreshToken),
            userId: user.id,
            family,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
    });

    setRefreshCookie(res, rawRefreshToken, REFRESH_COOKIE);

    const {password: _pw, ...userWithoutPassword} = user;
    const permissions = await getUserPermissionNames(user);

    res.json({
        message: 'Login successful',
        accessToken,
        expiresIn: getAccessTokenExpiresIn(),
        user: {...userWithoutPassword, permissions},
    });
});

// ── Student login (by roll number) ────────────────────────────────────────────

const studentLogin = catchAsync(async (req, res) => {
    const {rollNumber, password} = req.body;

    if (!rollNumber || !password) {
        throw new AppError(400, {message: 'Roll number and password are required'});
    }

    const student = await prisma.student.findUnique({where: {rollNumber}});

    const dummyHash = DUMMY_BCRYPT_HASH;
    const passwordToCheck = student ? student.password : dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCheck);

    if (!student || !isPasswordValid) {
        throw new AppError(401, {message: 'Invalid credentials'});
    }

    const accessToken = generateAccessToken(student.id, 'STUDENT');
    const rawRefreshToken = generateRawRefreshToken();
    const family = crypto.randomUUID();

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(rawRefreshToken),
            studentId: student.id,
            family,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
    });

    setRefreshCookie(res, rawRefreshToken, STUDENT_REFRESH_COOKIE);

    res.json({
        message: 'Login successful',
        accessToken,
        expiresIn: getAccessTokenExpiresIn(),
        user: {...shapeStudentUser(student), permissions: []},
    });
});

// ── Verify email ──────────────────────────────────────────────────────────────

const verifyEmail = catchAsync(async (req, res) => {
    const {token} = req.query;

    if (!token || typeof token !== 'string' || token.length > 128) {
        throw new AppError(400, {token: 'Invalid verification token'});
    }

    const tokenHash = hashToken(token);

    const record = await prisma.emailVerification.findFirst({
        where: {tokenHash},
        include: {user: true},
    });

    if (!record) {
        throw new AppError(400, {token: 'Invalid or expired verification link'});
    }

    if (record.expiresAt < new Date()) {
        await prisma.emailVerification.delete({where: {id: record.id}});
        throw new AppError(
            400,
            {token: 'Verification link has expired. Please request a new one.'},
            'TOKEN_EXPIRED',
        );
    }

    if (record.user.isVerified) {
        await prisma.emailVerification.delete({where: {id: record.id}});
        return res.json({message: 'Email already verified. You can log in.'});
    }

    await prisma.$transaction([
        prisma.user.update({where: {id: record.userId}, data: {isVerified: true}}),
        prisma.emailVerification.delete({where: {id: record.id}}),
    ]);

    res.json({message: 'Email verified successfully. You can now log in.'});
});

// ── Resend verification ───────────────────────────────────────────────────────

const resendVerification = catchAsync(async (req, res) => {
    const {email} = req.body;

    if (!email) {
        throw new AppError(400, {email: 'Email is required'});
    }

    // Always return the same response to prevent user enumeration
    const user = await prisma.user.findUnique({
        where: {email},
        include: {admin: true, teacher: true},
    });

    if (user && !user.isVerified) {
        const name = user.admin?.name || user.teacher?.name || 'User';
        try {
            await issueVerificationToken(user.id, email, name);
        } catch (_) { /* swallow */
        }
    }

    res.json({
        message: 'If that email is registered and unverified, a new verification link has been sent.',
    });
});

// ── Refresh token (rotation + family reuse detection) ─────────────────────────
// Staff (Admin/Teacher) and Student each read/write their OWN cookie — see the
// REFRESH_COOKIE / STUDENT_REFRESH_COOKIE comment above. `expectStudent`
// enforces that a cookie can only ever resolve to its matching account type,
// so a stale or crossed-over cookie value can't authenticate as the wrong kind
// of account.
const runRefresh = async (req, res, {cookieName, expectStudent}) => {
    const incomingToken = req.cookies?.[cookieName];

    if (!incomingToken) {
        throw new AppError(401, {message: 'No refresh token'}, 'NO_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(incomingToken);

    const storedToken = await prisma.refreshToken.findUnique({where: {tokenHash}});

    if (!storedToken || Boolean(storedToken.studentId) !== expectStudent) {
        clearRefreshCookie(res, cookieName);
        throw new AppError(401, {message: 'Invalid refresh token'}, 'INVALID_TOKEN');
    }

    // Reuse detection: revoked token used again → token theft suspected
    if (storedToken.isRevoked) {
        await prisma.refreshToken.updateMany({
            where: {family: storedToken.family, isRevoked: false},
            data: {isRevoked: true},
        });
        clearRefreshCookie(res, cookieName);
        throw new AppError(
            401,
            {message: 'Token reuse detected. All sessions have been revoked for your security.'},
            'TOKEN_REUSE',
        );
    }

    if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.update({where: {id: storedToken.id}, data: {isRevoked: true}});
        clearRefreshCookie(res, cookieName);
        throw new AppError(401, {message: 'Refresh token expired'}, 'TOKEN_EXPIRED');
    }

    let responseUser, tokenId, tokenRole;

    if (expectStudent) {
        const student = await prisma.student.findUnique({where: {id: storedToken.studentId}});
        if (!student) {
            clearRefreshCookie(res, cookieName);
            throw new AppError(401, {message: 'Account not active'}, 'ACCOUNT_INACTIVE');
        }
        responseUser = {...shapeStudentUser(student), permissions: []};
        tokenId = student.id;
        tokenRole = 'STUDENT';
    } else {
        const user = await prisma.user.findUnique({
            where: {id: storedToken.userId},
            include: {admin: {select: {id: true, name: true}}, teacher: {select: {id: true, name: true}}},
        });
        if (!user || (user.email && !user.isVerified)) {
            clearRefreshCookie(res, cookieName);
            throw new AppError(401, {message: 'Account not active'}, 'ACCOUNT_INACTIVE');
        }
        const {password: _pw, ...rest} = user;
        // Recomputed fresh on every refresh (not carried over from the old
        // token/response) so a permission change takes effect the next time
        // this account's access token rotates, without needing to re-login.
        const permissions = await getUserPermissionNames(user);
        responseUser = {...rest, permissions};
        tokenId = user.id;
        tokenRole = user.role;
    }

    // Rotate: revoke old, create new in same family
    const newRawToken = generateRawRefreshToken();
    const newTokenHash = hashToken(newRawToken);

    await prisma.$transaction([
        prisma.refreshToken.update({where: {id: storedToken.id}, data: {isRevoked: true}}),
        prisma.refreshToken.create({
            data: {
                tokenHash: newTokenHash,
                ...(expectStudent ? {studentId: storedToken.studentId} : {userId: storedToken.userId}),
                family: storedToken.family,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
            },
        }),
    ]);

    setRefreshCookie(res, newRawToken, cookieName);

    const newAccessToken = generateAccessToken(tokenId, tokenRole);

    res.json({
        accessToken: newAccessToken,
        expiresIn: getAccessTokenExpiresIn(),
        user: responseUser,
    });
};

const refreshToken = catchAsync((req, res) => runRefresh(req, res, {cookieName: REFRESH_COOKIE, expectStudent: false}));

const studentRefreshToken = catchAsync((req, res) => runRefresh(req, res, {cookieName: STUDENT_REFRESH_COOKIE, expectStudent: true}));

// ── Logout ────────────────────────────────────────────────────────────────────

// Kept with explicit try/catch: even if DB revocation fails, the client must
// still be logged out (cookie cleared + 200 returned).
const runLogout = async (req, res, cookieName) => {
    try {
        const incomingToken = req.cookies?.[cookieName];
        if (incomingToken) {
            const tokenHash = hashToken(incomingToken);
            await prisma.refreshToken.updateMany({
                where: {tokenHash, isRevoked: false},
                data: {isRevoked: true},
            });
        }
    } catch (_) { /* non-blocking — still log out client */
    }

    clearRefreshCookie(res, cookieName);
    res.json({message: 'Logged out successfully'});
};

const logout = (req, res) => runLogout(req, res, REFRESH_COOKIE);

const studentLogout = (req, res) => runLogout(req, res, STUDENT_REFRESH_COOKIE);

// ── Logout all devices ────────────────────────────────────────────────────────

const logoutAll = catchAsync(async (req, res) => {
    const isStudent = req.user.role === 'STUDENT';
    const where = isStudent
        ? {studentId: req.user.id, isRevoked: false}
        : {userId: req.user.id, isRevoked: false};

    await prisma.refreshToken.updateMany({where, data: {isRevoked: true}});

    clearRefreshCookie(res, isStudent ? STUDENT_REFRESH_COOKIE : REFRESH_COOKIE);
    res.json({message: 'Logged out from all devices'});
});

// ── Profile ───────────────────────────────────────────────────────────────────

const getProfile = catchAsync(async (req, res) => {
    const {password: _pw, ...userWithoutPassword} = req.user;
    const permissions = await getUserPermissionNames(req.user);
    res.json({user: {...userWithoutPassword, permissions}});
});

// ── Change password (self-service, any authenticated account) ────────────────

const changePassword = catchAsync(async (req, res) => {
    const {currentPassword, newPassword} = req.body;
    const isStudent = req.user.role === 'STUDENT';
    const id = req.user.id;

    if (!currentPassword || !newPassword) {
        throw new AppError(400, {message: 'Current and new password are required'});
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(400, {newPassword: 'New password must be at least 8 characters'});
    }

    const account = isStudent
        ? await prisma.student.findUnique({where: {id}})
        : await prisma.user.findUnique({where: {id}});
    if (!account) throw new AppError(404, 'Account not found');

    const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
    if (!isPasswordValid) {
        throw new AppError(401, {currentPassword: 'Current password is incorrect'});
    }

    if (currentPassword === newPassword) {
        throw new AppError(400, {newPassword: 'New password must differ from current password'});
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const revokeWhere = isStudent ? {studentId: id, isRevoked: false} : {userId: id, isRevoked: false};

    // Invalidate ALL refresh tokens (force re-login on all devices)
    await prisma.$transaction(isStudent ? [
        prisma.student.update({where: {id}, data: {password: hashedPassword}}),
        prisma.refreshToken.updateMany({where: revokeWhere, data: {isRevoked: true}}),
    ] : [
        prisma.user.update({where: {id}, data: {password: hashedPassword}}),
        prisma.refreshToken.updateMany({where: revokeWhere, data: {isRevoked: true}}),
    ]);

    clearRefreshCookie(res, isStudent ? STUDENT_REFRESH_COOKIE : REFRESH_COOKIE);
    res.json({message: 'Password changed successfully. Please log in again.'});
});

// ── Reset password (admin only — for a teacher/admin User or a Student) ──────

const resetPassword = catchAsync(async (req, res) => {
    const {userId, studentId, newPassword} = req.body;

    if ((!userId && !studentId) || !newPassword) {
        throw new AppError(400, {message: 'A target account and new password are required'});
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(400, {newPassword: 'Password must be at least 8 characters'});
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    if (studentId) {
        const student = await prisma.student.findUnique({where: {id: studentId}});
        if (!student) throw new AppError(404, 'Student not found');

        await prisma.$transaction([
            prisma.student.update({where: {id: studentId}, data: {password: hashedPassword}}),
            prisma.refreshToken.updateMany({where: {studentId, isRevoked: false}, data: {isRevoked: true}}),
        ]);

        if (student.email) {
            sendPasswordResetNotification(student.email, student.name).catch(() => {
            });
        }
    } else {
        const targetUser = await prisma.user.findUnique({
            where: {id: userId},
            include: {admin: true, teacher: true},
        });
        if (!targetUser) throw new AppError(404, 'User not found');

        await prisma.$transaction([
            prisma.user.update({where: {id: userId}, data: {password: hashedPassword}}),
            prisma.refreshToken.updateMany({where: {userId, isRevoked: false}, data: {isRevoked: true}}),
        ]);

        if (targetUser.email) {
            const name = targetUser.admin?.name || targetUser.teacher?.name || 'User';
            sendPasswordResetNotification(targetUser.email, name).catch(() => {
            });
        }
    }

    res.json({message: 'Password reset. The account will need to log in again.'});
});

// ── Forgot password (public, self-service — Admin/Teacher by email) ──────────

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const successMsg = 'If an account with that email exists, a password reset link has been sent.';

    if (!email) throw new AppError(400, { email: 'Email is required' });

    const user = await prisma.user.findUnique({
        where: { email },
        include: { admin: true, teacher: true },
    });

    // Always respond identically to prevent user enumeration
    if (!user || !user.isVerified) {
        return res.json({ message: successMsg });
    }

    // Invalidate any existing reset tokens for this user (one active token at a time)
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await prisma.passwordReset.create({
        data: { userId: user.id, tokenHash, expiresAt },
    });

    const name = user.admin?.name || user.teacher?.name || 'User';
    sendPasswordResetEmail(email, name, rawToken, 'staff').catch(() => { /* non-blocking */ });

    res.json({ message: successMsg });
});

// ── Student forgot password (public, self-service — by email) ────────────────

const studentForgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const successMsg = 'If a student account with that email exists, a password reset link has been sent.';

    if (!email) throw new AppError(400, { email: 'Email is required' });

    const student = await prisma.student.findUnique({ where: { email } });

    // Always respond identically to prevent user enumeration
    if (!student) {
        return res.json({ message: successMsg });
    }

    await prisma.passwordReset.deleteMany({ where: { studentId: student.id } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await prisma.passwordReset.create({
        data: { studentId: student.id, tokenHash, expiresAt },
    });

    sendPasswordResetEmail(email, student.name, rawToken, 'student').catch(() => { /* non-blocking */ });

    res.json({ message: successMsg });
});

// ── Reset password via token (public, from email link) ────────────────────────
// Shared by both flows — the stored record itself says whether it belongs to
// a User (admin/teacher) or a Student.

const resetPasswordWithToken = catchAsync(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        throw new AppError(400, { message: 'Token and new password are required' });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(400, { newPassword: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const tokenHash = hashToken(token);
    const record = await prisma.passwordReset.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt) {
        throw new AppError(400, { message: 'Invalid or already used reset link' }, 'INVALID_RESET_TOKEN');
    }

    if (record.expiresAt < new Date()) {
        throw new AppError(400, { message: 'Reset link has expired. Please request a new one.' }, 'RESET_TOKEN_EXPIRED');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    if (record.studentId) {
        await prisma.$transaction([
            prisma.student.update({ where: { id: record.studentId }, data: { password: hashedPassword } }),
            prisma.passwordReset.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
            prisma.refreshToken.updateMany({ where: { studentId: record.studentId, isRevoked: false }, data: { isRevoked: true } }),
        ]);
    } else {
        await prisma.$transaction([
            prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } }),
            prisma.passwordReset.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
            prisma.refreshToken.updateMany({ where: { userId: record.userId, isRevoked: false }, data: { isRevoked: true } }),
        ]);
    }

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
});

// ── Register admin (first-time setup protection) ──────────────────────────────

const registerAdmin = catchAsync(async (req, res) => {
    const existingAdmin = await prisma.user.findFirst({where: {role: 'ADMIN'}});
    if (existingAdmin) {
        throw new AppError(403, {message: 'Admin already exists. Contact your system administrator.'});
    }

    const {email, password, name} = req.body;

    if (!email || !password || !name) {
        throw new AppError(400, {message: 'Email, password, and name are required'});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new AppError(400, {email: 'Invalid email address'});
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(400, {password: 'Password must be at least 8 characters'});
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Authorization is fully permission-driven — there is no hardcoded
    // ADMIN bypass (see utils/permissions.js). So the very first admin must
    // be given a Role that actually holds every permission, or they'd be
    // locked out of everything immediately after registering, with no one
    // else able to fix it (Role/User management is itself permission-gated).
    // `prisma/seed.js` normally creates this "Administrator" role, but this
    // endpoint has to be able to bootstrap it too, for a freshly migrated
    // database that hasn't been seeded yet.
    // NOTE: if the Permission catalog itself is empty (a schema-migrated but
    // never-seeded database), this creates an Administrator role with no
    // permissions to connect — `npm run seed` populates the catalog and is
    // the expected first step in this app's deploy flow; this endpoint is a
    // fallback for registering an admin without running it, not a
    // replacement for it.
    const allPermissions = await prisma.permission.findMany({select: {id: true}});
    const adminRole = await prisma.role.upsert({
        where: {name: 'Administrator'},
        update: {permissions: {set: allPermissions}},
        create: {
            name: 'Administrator',
            description: 'Full access to all system features',
            permissions: {connect: allPermissions},
        },
    });

    // P2002 (duplicate email) bubbles up to the global error handler automatically
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: false,
            admin: {create: {name}},
            roles: {connect: {id: adminRole.id}},
        },
        include: {admin: true},
    });

    try {
        await issueVerificationToken(user.id, email, name);
    } catch (emailError) {
        console.error('Verification email failed:', emailError.message);
    }

    const {password: _pw, ...userWithoutPassword} = user;

    res.status(201).json({
        message: 'Admin account created. Check your email to verify before logging in.',
        user: userWithoutPassword,
    });
});

module.exports = {
    login,
    studentLogin,
    verifyEmail,
    resendVerification,
    refreshToken,
    studentRefreshToken,
    logout,
    studentLogout,
    logoutAll,
    getProfile,
    changePassword,
    resetPassword,
    forgotPassword,
    studentForgotPassword,
    resetPasswordWithToken,
    registerAdmin,
    issueVerificationToken, // exported so teacher controllers can call it
};
