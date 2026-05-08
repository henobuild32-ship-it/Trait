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

  // Create demo client users (RDC context for USSD)
  const user1 = await db.user.upsert({
    where: { phone: '+243810000001' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'client',
      country: 'CD',
      realBalance: 50000,
      realBalanceFC: 150000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+243810000001',
      name: 'Jean Mukendi',
      pseudo: 'jean_m',
      country: 'CD',
      realBalance: 50000,
      realBalanceFC: 150000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      password: '1234',
      pin: '0000',
      role: 'client',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const user2 = await db.user.upsert({
    where: { phone: '+243820000002' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'client',
      country: 'CD',
      realBalance: 25000,
      realBalanceFC: 75000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+243820000002',
      name: 'Marie Kabongo',
      pseudo: 'marie_k',
      country: 'CD',
      realBalance: 25000,
      realBalanceFC: 75000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      password: '1234',
      pin: '0000',
      role: 'client',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const user3 = await db.user.upsert({
    where: { phone: '+243830000003' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'client',
      country: 'CD',
      realBalance: 100000,
      realBalanceFC: 300000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+243830000003',
      name: 'Pierre Nsimba',
      pseudo: 'pierre_n',
      country: 'CD',
      realBalance: 100000,
      realBalanceFC: 300000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      password: '1234',
      pin: '0000',
      role: 'client',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  // Create demo agent
  const agent = await db.user.upsert({
    where: { phone: '+243840000004' },
    update: {
      password: '1234',
      pin: '0000',
      role: 'agent',
      agentCode: 'AGT-000001',
      country: 'CD',
      realBalance: 500000,
      realBalanceFC: 1500000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      hasCompletedOnboarding: true,
    },
    create: {
      phone: '+243840000004',
      name: 'Agent TRAIT Kinshasa',
      pseudo: 'agent_kin',
      country: 'CD',
      realBalance: 500000,
      realBalanceFC: 1500000,
      bonusBalance: 10,
      bonusBalanceFC: 0,
      password: '1234',
      pin: '0000',
      role: 'agent',
      agentCode: 'AGT-000001',
      isVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  console.log('✅ Users created:', user1.name, user2.name, user3.name);
  console.log('✅ Agent created:', agent.name, '(Code:', agent.agentCode, ')');

  // Create user settings for all users
  for (const u of [user1, user2, user3, agent]) {
    await db.userSettings.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, ussdLanguage: 'fr', defaultCurrency: 'USD', smsNotifications: false },
    });
  }

  console.log('✅ User settings created for all users');

  // Create sample favorites for user1
  try {
    await db.ussdFavorite.createMany({
      data: [
        { userId: user1.id, label: 'Maman', phone: '+243820000002', type: 'transfer' },
        { userId: user1.id, label: 'Pierre', phone: '+243830000003', type: 'transfer' },
      ],
    });
    console.log('✅ Sample favorites created');
  } catch {
    console.log('ℹ️ Favorites already exist');
  }

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
  console.log('   Client: +243810000001 / 1234 (PIN: 0000) — Jean Mukendi');
  console.log('   Client: +243820000002 / 1234 (PIN: 0000) — Marie Kabongo');
  console.log('   Client: +243830000003 / 1234 (PIN: 0000) — Pierre Nsimba');
  console.log('   Agent:  +243840000004 / 1234 (PIN: 0000, Code: AGT-000001)');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
