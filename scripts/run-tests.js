const { execSync } = require('child_process');

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // Type check
  run('pnpm exec tsc --noEmit');

  // Ensure Prisma client is generated
  run('pnpm exec prisma generate');

  // Apply migrations (creates local sqlite dev.db)
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
  run('pnpm exec prisma migrate deploy');

  // Seed DB
  run('pnpm run db:seed');

  // Run basic DB query test
  run('node scripts/query-db.js');

  console.log('All tests passed');
} catch (e) {
  console.error('Tests failed');
  process.exit(1);
}
