const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { scheduleRefreshTokenCleanup } = require('./utils/tokenCleanup');

dotenv.config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const subjectRoutes = require('./routes/subjects');
const announcementRoutes = require('./routes/announcements');
const timetableRoutes = require('./routes/timetable');
const feeRoutes = require('./routes/fees');
const marksRoutes = require('./routes/marks');
const reportRoutes = require('./routes/reports');
const salaryRoutes = require('./routes/salaries');
const studentExpenseRoutes = require('./routes/studentExpenses');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const paymentInfoRoutes = require('./routes/paymentInfo');

const app = express();

// Trust the first proxy (required on Render / any reverse-proxy host so that
// express-rate-limit can read X-Forwarded-For correctly)
app.set('trust proxy', 1);

// ── CORS: must come before any route handlers ──────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
    : ["http://localhost:5173", "http://localhost:5174"]

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
    },
    credentials: true, // Required for httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing & cookies ────────────────────────────────────────────────────
app.use(express.json({limit: '1mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/student-expenses', studentExpenseRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/payment-info', paymentInfoRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({status: 'ok', message: 'Server is running'});
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Prune expired/revoked refresh tokens at boot and every 24 hours so the
    // table (which rotates a row on every token refresh) never grows unbounded.
    scheduleRefreshTokenCleanup();

    // Keep-alive: ping own health endpoint every 10 minutes to prevent Render free tier spin-down
    if (process.env.RENDER_EXTERNAL_URL) {
        const keepAliveUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
        setInterval(async () => {
            try {
                const https = require('https');
                https.get(keepAliveUrl, (res) => {
                    console.log(`[Keep-alive] Pinged ${keepAliveUrl} — status: ${res.statusCode}`);
                }).on('error', (err) => {
                    console.warn('[Keep-alive] Ping failed:', err.message);
                });
            } catch (err) {
                console.warn('[Keep-alive] Error:', err.message);
            }
        }, 10 * 60 * 1000); // every 10 minutes
    }
});
