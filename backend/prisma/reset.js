// Wipes every row from the database so it can be seeded from scratch.
// Destructive and irreversible — run it only against a development database.
//
//   node prisma/reset.js --yes
//   npm run db:reset -- --yes

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Prisma's own bookkeeping table is not application data.
const KEEP = new Set(['_prisma_migrations']);

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error('Refusing to run: this deletes every row. Pass --yes to confirm.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run against NODE_ENV=production.');
    process.exit(1);
  }

  const url = process.env.DATABASE_URL || '';
  console.log(`Resetting ${url.replace(/\/\/[^@]*@/, '//***@') || '(DATABASE_URL unset)'}`);

  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  const targets = tables
    .map(t => t.tablename)
    .filter(name => !KEEP.has(name));

  if (targets.length === 0) {
    console.log('No tables to reset.');
    return;
  }

  // One TRUNCATE for all of them: CASCADE clears the foreign keys between
  // them in any order, and RESTART IDENTITY puts the id counters back to 1.
  const quoted = targets.map(name => `"public"."${name}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

  console.log(`✓ Cleared ${targets.length} tables: ${targets.sort().join(', ')}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
