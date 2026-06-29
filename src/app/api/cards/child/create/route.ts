import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/security';
import { requireUser, hashPin } from '@/lib/auth';
import { randomInt, randomBytes } from 'crypto';

function maskCardNumber(num: string): string {
  return num.length >= 4 ? `****${num.slice(-4)}` : num;
}

function generateCardNumber(): string {
  const prefix = '4927';
  let remaining = '';
  for (let i = 0; i < 12; i++) {
    remaining += randomInt(0, 10).toString();
  }
  return prefix + remaining;
}

function generateCVV(): string {
  let cvv = '';
  for (let i = 0; i < 3; i++) {
    cvv += randomInt(0, 10).toString();
  }
  return cvv;
}

function generateExpiryDate(): string {
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 3, now.getMonth(), 1);
  const month = (expiry.getMonth() + 1).toString().padStart(2, '0');
  const year = expiry.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
}

function generateQRCode(cardId: string): string {
  return `TRAIT-QR-${cardId}-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { parentId, childName, cardType, pin } = body as {
      parentId: string;
      childName: string;
      cardType: 'USD' | 'FC';
      pin?: string;
    };

    if (!parentId || !childName || !cardType) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: parentId, childName et cardType sont requis' },
        { status: 400 }
      );
    }

    if (auth.userId !== parentId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    const trimmedName = childName.trim();
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmedName)) {
      return NextResponse.json(
        { success: false, message: "Le nom de l'enfant ne doit contenir que des lettres" },
        { status: 400 }
      );
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, message: "Le PIN de l'enfant est obligatoire et doit contenir exactement 4 chiffres" },
        { status: 400 }
      );
    }

    // Verify parent exists
    const parent = await db.user.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, message: 'Parent non trouvé' },
        { status: 404 }
      );
    }

    // Generate a unique virtual phone number for the child
    let childPhone = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 50) {
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
      childPhone = `+24388${randomDigits}`;
      const existing = await db.user.findUnique({ where: { phone: childPhone } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la génération du numéro pour l\'enfant' },
        { status: 500 }
      );
    }

    // Generate unique pseudo
    const pseudo = `${childName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(100 + Math.random() * 900)}`;

    // Create child user
    const child = await db.user.create({
      data: {
        phone: childPhone,
        name: trimmedName,
        pseudo,
        country: parent.country || 'CD',
        role: 'client', // child is a client for compatibility
        pin: await hashPin(pin),
        password: parent.password || '1234', // default password or parent password
        realBalance: 0,
        realBalanceFC: 0,
        bonusBalance: 0, // 0 as required
        bonusBalanceFC: 0,
        parentId,
        isVerified: true,
        hasCompletedOnboarding: true,
      },
    });

    // Generate unique card details
    let cardNumber = generateCardNumber();
    let cardAttempts = 0;
    while (await db.traitCard.findUnique({ where: { cardNumber } }) && cardAttempts < 10) {
      cardNumber = generateCardNumber();
      cardAttempts++;
    }

    const cvv = generateCVV();
    const expiryDate = generateExpiryDate();

    // Create CardRequest + TraitCard
    const cardRequest = await db.cardRequest.create({
      data: {
        userId: child.id,
        cardType,
        status: 'approved',
      },
    });

    const card = await db.traitCard.create({
      data: {
        userId: child.id,
        cardRequestId: cardRequest.id,
        cardType,
        cardNumber,
        cvv,
        qrCode: generateQRCode(cardRequest.id),
        expiryDate,
        status: 'pending_retrieval', // En attente de retrait
      },
    });

    // Log the creation
    await logSecurityEvent({
      userId: parentId,
      action: 'child_account_created',
      details: JSON.stringify({
        childId: child.id,
        childName,
        childPhone,
        cardId: card.id,
        cardType,
        cardNumber: maskCardNumber(cardNumber),
      }),
      riskLevel: 'low',
    });

    // Notification for parent
    await db.notification.create({
      data: {
        userId: parentId,
        title: 'Compte Enfant créé',
        message: `Le compte de votre enfant ${childName} a été créé avec succès avec la carte ${cardType} ****${cardNumber.slice(-4)}.`,
        type: 'general',
      },
    });

    // Message/Notification for child
    await db.notification.create({
      data: {
        userId: child.id,
        title: 'Bienvenue sur TRAIT',
        message: `Ton compte enfant a été configuré par ton parent. Ta carte TRAIT ${cardType} est prête !`,
        type: 'general',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Félicitations ! La carte TRAIT de ${childName} a été créée avec succès.

Rendez-vous à l'administration TRAIT pour récupérer la carte physique de votre enfant.

La carte est actuellement active avec un solde de 0 USD et 0 CDF. Vous pouvez commencer à l'utiliser après l'avoir rechargée.`,
      child: {
        id: child.id,
        name: child.name,
        phone: child.phone,
      },
      card: {
        id: card.id,
        cardType: card.cardType,
        cardNumber: maskCardNumber(card.cardNumber),
        status: card.status,
      },
    });
  } catch (error) {
    console.error('Create child account error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la création du compte enfant' },
      { status: 500 }
    );
  }
}
