import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  const r = await db.appVersion.upsert({
    where: { version: '2.0.0' },
    update: { isCurrent: true, downloadUrl: '/downloads/trait.apk' },
    create: { version: '2.0.0', isCurrent: true, downloadUrl: '/downloads/trait.apk', description: 'Version 2.0' }
  });
  console.log('OK:', r.version);
} catch(e) { console.error(e); }
finally { await db.$disconnect(); }
