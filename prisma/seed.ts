import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo client users with passwords and PINs
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

  // Create demo agent user
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

  // Create marketplace products
  const products = [
    {
      name: 'UI Kit - Dashboard Finance',
      description: 'Kit UI complet pour tableau de bord financier. Inclus 50+ composants React, graphiques et templates. Design moderne et responsive.',
      price: 3.99,
      category: 'design',
      sellerId: user1.id,
      active: true,
    },
    {
      name: 'Template App E-commerce',
      description: 'Template complet pour application e-commerce mobile. Inclut panier, paiement, catalogue et gestion des commandes.',
      price: 1.99,
      category: 'template',
      sellerId: user1.id,
      active: true,
    },
    {
      name: 'Logo Professionnel',
      description: 'Création de logo professionnel pour votre entreprise. 3 propositions incluses avec fichiers sources (AI, SVG, PNG).',
      price: 5.0,
      category: 'service',
      sellerId: user2.id,
      active: true,
    },
    {
      name: 'Pack Icones Finance',
      description: 'Pack de 200 icones vectorielles sur le thème de la finance et des paiements. Formats SVG et PNG inclus.',
      price: 0.99,
      category: 'design',
      sellerId: user2.id,
      active: true,
    },
    {
      name: 'Formation React Native',
      description: 'Formation complète React Native - 20h de vidéo. Apprenez à créer des applications mobiles cross-platform.',
      price: 9.99,
      category: 'digital_product',
      sellerId: user3.id,
      active: true,
    },
    {
      name: 'Template Landing Page SaaS',
      description: 'Template de landing page moderne pour SaaS. 5 sections, animations, formulaire de contact et pricing table.',
      price: 2.49,
      category: 'template',
      sellerId: user3.id,
      active: true,
    },
    {
      name: 'Design Bannière Réseaux Sociaux',
      description: 'Pack de 10 bannières pour réseaux sociaux (Instagram, Facebook, Twitter). Tailles optimisées pour chaque plateforme.',
      price: 1.49,
      category: 'design',
      sellerId: user1.id,
      active: true,
    },
    {
      name: 'Application de gestion de stock',
      description: 'Application web complète pour la gestion de stock. Dashboard, alertes, rapports et export de données.',
      price: 7.99,
      category: 'digital_product',
      sellerId: user2.id,
      active: true,
    },
  ];

  for (const product of products) {
    await db.marketplaceProduct.upsert({
      where: { id: product.name.toLowerCase().replace(/\s+/g, '-') + '-' + product.category },
      update: {},
      create: product,
    });
  }

  console.log('✅ Marketplace products created:', products.length);

  // Create barter offers
  const barterOffers = [
    {
      title: 'Création de site web',
      description: 'Je propose la création de votre site web professionnel. HTML, CSS, JavaScript, responsive design. 5 pages incluses.',
      category: 'service',
      offeredBy: user1.id,
      wantedItem: 'Formation en photographie ou cours de marketing digital',
    },
    {
      title: 'Cours de anglais en ligne',
      description: 'Professeur bilingue propose des cours d\'anglais en ligne. Tous niveaux, conversation, grammaire, vocabulaire. 1h/semaine.',
      category: 'skill',
      offeredBy: user2.id,
      wantedItem: 'Cours de français ou service de design graphique',
    },
    {
      title: 'Smartphone Samsung Galaxy A54',
      description: 'Smartphone en excellent état, 128GB, couleur noir. Avec coque et film de protection. Vendu car changement de téléphone.',
      category: 'product',
      offeredBy: user3.id,
      wantedItem: 'Tablette ou ordinateur portable',
    },
    {
      title: 'Service de photographie événementielle',
      description: 'Photographe professionnel disponible pour vos événements : mariages, baptêmes, anniversaires. Album photo HD inclus.',
      category: 'service',
      offeredBy: user2.id,
      wantedItem: 'Création de logo ou site vitrine',
    },
    {
      title: 'Guitare acoustique Yamaha',
      description: 'Guitare acoustique Yamaha FG800, très bon état. Ideal pour débutants et intermédiaires. Avec housse et médiators.',
      category: 'product',
      offeredBy: user1.id,
      wantedItem: 'Clavier musical ou cours de piano',
    },
    {
      title: 'Traduction de documents',
      description: 'Service de traduction anglais-français et français-anglais. Documents, articles, lettres. Rapide et professionnel.',
      category: 'service',
      offeredBy: user3.id,
      wantedItem: 'Service de comptabilité ou aide administrative',
    },
  ];

  for (const offer of barterOffers) {
    await db.barterOffer.upsert({
      where: { id: offer.title.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: offer,
    });
  }

  console.log('✅ Barter offers created:', barterOffers.length);

  // Create sample transactions
  const sampleTransactions = [
    {
      type: 'send',
      amount: 25,
      fee: 0.175,
      currency: 'USD',
      status: 'completed',
      senderId: user1.id,
      receiverId: user2.id,
      description: 'Remboursement dîner',
    },
    {
      type: 'send',
      amount: 50,
      fee: 0.35,
      currency: 'USD',
      status: 'completed',
      senderId: user3.id,
      receiverId: user1.id,
      description: 'Paiement freelance',
    },
    {
      type: 'send',
      amount: 10,
      fee: 0.07,
      currency: 'USD',
      status: 'completed',
      senderId: user2.id,
      receiverId: user3.id,
      description: 'Cadeau anniversaire',
    },
    {
      type: 'send',
      amount: 75,
      fee: 0.525,
      currency: 'USD',
      status: 'pending',
      senderId: user1.id,
      receiverId: user3.id,
      description: 'Vêtements',
    },
  ];

  for (const tx of sampleTransactions) {
    await db.transaction.create({ data: tx });
  }

  console.log('✅ Sample transactions created:', sampleTransactions.length);

  // Create sample deposits
  const deposits = [
    { userId: user1.id, amount: 100, currency: 'USD', method: 'mobile_money', status: 'completed' },
    { userId: user1.id, amount: 50, currency: 'USD', method: 'bank_transfer', status: 'completed' },
    { userId: user2.id, amount: 85, currency: 'USD', method: 'mobile_money', status: 'completed' },
    { userId: user3.id, amount: 200, currency: 'USD', method: 'mobile_money', status: 'completed' },
  ];

  for (const dep of deposits) {
    await db.deposit.create({ data: dep });
  }

  console.log('✅ Deposits created:', deposits.length);

  // Create sample notifications for user1
  const notifications = [
    { userId: user1.id, title: 'Argent reçu', message: 'Vous avez reçu 50.00 USD de Yao Agossou', type: 'transfer_received', read: false },
    { userId: user1.id, title: 'Bonus inscription', message: 'Vous avez reçu 10.00 USD de bonus! Utilisable dans la marketplace.', type: 'general', read: true },
    { userId: user1.id, title: 'Dépôt validé', message: 'Votre dépôt de 50.00 USD a été validé avec succès.', type: 'withdrawal_validated', read: false },
  ];

  for (const notif of notifications) {
    await db.notification.create({ data: notif });
  }

  console.log('✅ Notifications created:', notifications.length);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo accounts:');
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
