import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin account
  const admin = await db.admin.upsert({
    where: { username: 'admin' },
    update: { password: 'admin1234' },
    create: {
      username: 'admin',
      password: 'admin1234',
      name: 'Administrateur TRAIT',
      role: 'super_admin',
    },
  });

  console.log('✅ Admin created:', admin.name, `(username: ${admin.username})`);

  // Create demo client users
  const user1 = await db.user.upsert({
    where: { phone: '+22890123456' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'client',
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+22890123456',
      name: 'Kofi Mensah',
      pseudo: 'kofi_m',
      country: 'TG',
      realBalance: 150,
      bonusBalance: 10,
      password: '1234',
      pin: '0000',
      role: 'client',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const user2 = await db.user.upsert({
    where: { phone: '+22507891234' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'client',
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+22507891234',
      name: 'Aminata Diallo',
      pseudo: 'aminata_d',
      country: 'CI',
      realBalance: 85,
      bonusBalance: 10,
      password: '1234',
      pin: '0000',
      role: 'client',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const user3 = await db.user.upsert({
    where: { phone: '+22996012345' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'client',
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+22996012345',
      name: 'Yao Agossou',
      pseudo: 'yao_a',
      country: 'BJ',
      realBalance: 200,
      bonusBalance: 10,
      password: '1234',
      pin: '0000',
      role: 'client',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  // Create demo agent
  const agent = await db.user.upsert({
    where: { phone: '+22897000001' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'agent',
      agentCode: '1700001',
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+22897000001',
      name: 'Komlan Agent',
      pseudo: 'agent_komlan',
      country: 'TG',
      realBalance: 500,
      bonusBalance: 10,
      password: '1234',
      pin: '0000',
      role: 'agent',
      agentCode: '1700001',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  console.log('✅ Users created:', user1.name, user2.name, user3.name);
  console.log('✅ Agent created:', agent.name, '(Code:', agent.agentCode, ')');

  // Log admin creation in activity log
  await db.adminActivityLog.create({
    data: {
      adminId: admin.id,
      action: 'system_init',
      details: 'Initialisation du système avec données de démonstration',
    },
  });

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Comptes de test:');
  console.log('   Admin:  admin / admin1234');
  console.log('   Client: +22890123456 / 1234 (PIN: 0000)');
  console.log('   Client: +22507891234 / 1234 (PIN: 0000)');
  console.log('   Client: +22996012345 / 1234 (PIN: 0000)');
  console.log('   Agent:  +22897000001 / 1234 (PIN: 0000, Code: 1700001)');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
