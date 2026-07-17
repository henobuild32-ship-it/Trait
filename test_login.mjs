import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const p = new PrismaClient();
try {
  const user = await p.user.findUnique({ where: { phone: '+243810000001' } });
  console.log('User found:', !!user);
  if (user) {
    console.log('Password hash:', user.password?.substring(0, 20) + '...');
    // Test bcrypt
    try {
      const valid = await bcrypt.compare('1234', user.password);
      console.log('Password valid:', valid);
    } catch(e) {
      console.log('bcrypt error:', e.message);
    }
  }
  
  // Test security log
  try {
    await p.securityLog.create({
      data: {
        action: 'test',
        details: 'test from local script',
        riskLevel: 'low',
      },
    });
    console.log('SecurityLog write: OK');
  } catch(e) {
    console.log('SecurityLog error:', e.message);
  }

  // Test admin find
  const admin = await p.admin.findUnique({ where: { username: 'admin' } });
  console.log('Admin found:', !!admin);
  if (admin) {
    try {
      const valid = await bcrypt.compare('admin1234', admin.password);
      console.log('Admin password valid:', valid);
    } catch(e) {
      console.log('Admin bcrypt error:', e.message);
    }
  }

  console.log('All checks done');
} catch(e) {
  console.log('Error:', e.message);
  console.log('Stack:', e.stack?.substring(0, 500));
} finally {
  await p.$disconnect();
}
