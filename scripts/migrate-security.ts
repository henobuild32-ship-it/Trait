// Migration script: hash existing plain-text passwords and PINs
// Run: npx ts-node scripts/migrate-security.ts
// Or: npx prisma db push && npx ts-node scripts/migrate-security.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting security migration...\n');

  // 1. Migrate passwords
  const usersWithPlainPassword = await prisma.user.findMany({
    where: {
      password: { not: null },
      NOT: { password: { startsWith: '$2' } },
    },
    select: { id: true, password: true, phone: true },
  });

  console.log(`📝 Found ${usersWithPlainPassword.length} users with plain-text passwords`);

  for (const user of usersWithPlainPassword) {
    if (!user.password) continue;
    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    console.log(`  ✅ ${user.phone} -> password hashed`);
  }

  // 2. Migrate PINs
  const usersWithPlainPin = await prisma.user.findMany({
    where: {
      pin: { not: null },
      NOT: { pin: { startsWith: '$2' } },
    },
    select: { id: true, pin: true, phone: true },
  });

  console.log(`\n📝 Found ${usersWithPlainPin.length} users with plain-text PINs`);

  for (const user of usersWithPlainPin) {
    if (!user.pin) continue;
    const hashed = await bcrypt.hash(user.pin, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { pin: hashed },
    });
    console.log(`  ✅ ${user.phone} -> PIN hashed`);
  }

  // 3. Reset pinAttempts for all users
  await prisma.user.updateMany({
    where: { pinAttempts: { gt: 0 } },
    data: { pinAttempts: 0 },
  });
  console.log(`\n🔄 PIN attempts reset for all users`);

  // 4. Unblock any temporarily blocked users
  await prisma.user.updateMany({
    where: { tempBlocked: true },
    data: { tempBlocked: false, pinAttempts: 0 },
  });
  console.log(`🔄 Temporarily blocked users unblocked`);

  console.log(`\n✅ Security migration complete!`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
