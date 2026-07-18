const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const r = await db.appVersion.upsert({
    where: { version: '2.0.0' },
    update: { isCurrent: true, downloadUrl: '/downloads/trait.apk' },
    create: { version: '2.0.0', isCurrent: true, downloadUrl: '/downloads/trait.apk', description: 'Version 2.0 avec USSD 28 menus, QR natif, permissions Android' }
  });
  console.log('OK:', r.version);
  await db.\();
}
main().catch(e => { console.error(e); db.\(); });
