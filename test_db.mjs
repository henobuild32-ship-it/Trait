import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const count = await p.user.count();
  console.log('Users:', count);
  const adminCount = await p.admin.count();
  console.log('Admins:', adminCount);
  console.log('Database OK');
} catch(e) {
  console.log('Error:', e.message);
} finally {
  await p.$disconnect();
}
