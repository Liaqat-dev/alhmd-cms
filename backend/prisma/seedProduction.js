// Production seed: creates ONLY the permission catalog, the `super_admin`
// role (holding every permission) and the two admin accounts (unverified,
// both assigned `super_admin`). Nothing else is seeded. Idempotent.
//
//   node prisma/seedProduction.js
//   npm run seed:prod
//
// Credentials come from the environment so no password is committed:
//   ADMIN_1_PASSWORD, ADMIN_2_PASSWORD

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

const ADMINS = [
  { email: 'dev.liaqat13@gmail.com', name: 'Liaqat',  passwordEnv: 'ADMIN_1_PASSWORD' },
  { email: 'meemsheen8@gmail.com',   name: 'Maryam',  passwordEnv: 'ADMIN_2_PASSWORD' },
];

// Keep in sync with the catalog in prisma/seed.js.
const CRUD_RESOURCES = [
  { key: 'students',          category: 'Students',           label: 'students' },
  { key: 'teachers',          category: 'Teachers',           label: 'teachers' },
  { key: 'classes',           category: 'Classes',            label: 'classes' },
  { key: 'subjects',          category: 'Subjects',           label: 'subjects' },
  { key: 'timetable',         category: 'Timetable',          label: 'timetable entries' },
  { key: 'attendance',        category: 'Attendance',         label: 'student attendance records' },
  { key: 'teacherAttendance', category: 'Teacher Attendance', label: 'teacher attendance records' },
  { key: 'marks',             category: 'Marks',              label: 'exams and marks' },
  { key: 'fees',              category: 'Fees',               label: 'fee challans' },
  { key: 'salaries',          category: 'Salaries',           label: 'teacher salaries' },
  { key: 'announcements',     category: 'Announcements',      label: 'announcements' },
  { key: 'reports',           category: 'Reports',            label: 'student reports' },
];
const CRUD_ACTIONS = [
  { suffix: 'view', verb: 'View' }, { suffix: 'create', verb: 'Create' },
  { suffix: 'edit', verb: 'Edit' }, { suffix: 'delete', verb: 'Delete' },
];

const PERMISSION_DEFS = [];
for (const r of CRUD_RESOURCES) {
  for (const a of CRUD_ACTIONS) {
    PERMISSION_DEFS.push({ name: `${r.key}.${a.suffix}`, category: r.category, description: `${a.verb} ${r.label}` });
  }
}
PERMISSION_DEFS.push(
  { name: 'users.view',   category: 'Users & Roles', description: 'View user accounts' },
  { name: 'users.manage', category: 'Users & Roles', description: 'Assign roles to user accounts' },
  { name: 'roles.view',   category: 'Users & Roles', description: 'View roles and permissions' },
  { name: 'roles.create', category: 'Users & Roles', description: 'Create roles' },
  { name: 'roles.edit',   category: 'Users & Roles', description: 'Edit roles and their permissions' },
  { name: 'roles.delete', category: 'Users & Roles', description: 'Delete roles' },
);

async function main() {
  const permissionIds = [];
  for (const p of PERMISSION_DEFS) {
    const row = await prisma.permission.upsert({
      where: { name: p.name },
      update: { category: p.category, description: p.description },
      create: p,
    });
    permissionIds.push({ id: row.id });
  }
  console.log('✓ permissions:', permissionIds.length);

  const superAdmin = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: { permissions: { set: permissionIds } },
    create: { name: 'super_admin', description: 'Full access to all system features', permissions: { connect: permissionIds } },
  });
  console.log('✓ role: super_admin');

  for (const a of ADMINS) {
    const password = process.env[a.passwordEnv];
    if (!password) throw new Error(`${a.passwordEnv} is not set`);

    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { isSuperAdmin: true, roles: { connect: { id: superAdmin.id } } } });
      console.log('• exists, role ensured:', a.email);
      continue;
    }

    await prisma.user.create({
      data: {
        email: a.email,
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
        role: 'ADMIN',
        isVerified: false,
        isSuperAdmin: true,
        admin: { create: { name: a.name } },
        roles: { connect: { id: superAdmin.id } },
      },
    });
    console.log('✓ admin created:', a.email);
  }
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
