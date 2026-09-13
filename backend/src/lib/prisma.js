const { PrismaClient } = require('@prisma/client');

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Prisma 5 no longer coerces string → Int automatically.
// Express route params are always strings, so we coerce here once
// rather than sprinkling parseInt() across every controller.
function coerceIntIds(args) {
  if (!args || typeof args !== 'object') return;
  if (args.where) coerceIntIds(args.where);
  if (args.data)  coerceIntIds(args.data);

  for (const key of Object.keys(args)) {
    const val = args[key];
    // Keys named "id" or ending in "Id" that hold a numeric string → parse
    if ((key === 'id' || key.endsWith('Id')) && typeof val === 'string' && /^\d+$/.test(val)) {
      args[key] = parseInt(val, 10);
    }
    // Recurse into plain objects (but not arrays of scalars)
    else if (val && typeof val === 'object' && !Array.isArray(val)) {
      coerceIntIds(val);
    }
    // Recurse into arrays of objects
    else if (Array.isArray(val)) {
      val.forEach(item => { if (item && typeof item === 'object') coerceIntIds(item); });
    }
  }
}

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      $allOperations({ args, query }) {
        coerceIntIds(args);
        return query(args);
      },
    },
  },
});

// Warm up the connection pool on startup
basePrisma.$connect()
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection error:', err));

module.exports = prisma;
