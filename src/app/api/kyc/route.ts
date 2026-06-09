import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Constants ───────────────────────────────────────────────────────

const DAILY_TRANSACTION_LIMIT = 10;

// ─── GET - Check user KYC status and daily transaction count ────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId requis' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        kycRejectReason: true,
        kycDocumentType: true,
        name: true,
        phone: true,
        email: true,
        photoId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Count today's transactions (all types)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [sentCount, receivedCount, depositCount, withdrawalCount, internationalCount] = await Promise.all([
      db.transaction.count({
        where: {
          senderId: userId,
          createdAt: { gte: todayStart },
          status: { in: ['completed', 'pending'] },
        },
      }),
      db.transaction.count({
        where: {
          receiverId: userId,
          createdAt: { gte: todayStart },
          status: { in: ['completed', 'pending'] },
        },
      }),
      db.deposit.count({
        where: {
          userId,
          createdAt: { gte: todayStart },
          status: { in: ['completed', 'pending'] },
        },
      }),
      db.withdrawal.count({
        where: {
          userId,
          createdAt: { gte: todayStart },
          status: { in: ['completed', 'pending'] },
        },
      }),
      db.internationalTransfer.count({
        where: {
          userId,
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    // We count only outbound actions (sent transfers + withdrawals + international)
    const dailyTransactions = sentCount + withdrawalCount + internationalCount;
    const dailyLimit = DAILY_TRANSACTION_LIMIT;

    return NextResponse.json({
      success: true,
      kyc: {
        status: user.kycStatus,
        submittedAt: user.kycSubmittedAt,
        verifiedAt: user.kycVerifiedAt,
        rejectReason: user.kycRejectReason,
        documentType: user.kycDocumentType,
      },
      security: {
        dailyTransactions,
        dailyLimit,
        remainingToday: Math.max(0, dailyLimit - dailyTransactions),
        limitReached: dailyTransactions >= dailyLimit,
      },
    });
  } catch (error) {
    console.error('KYC status check error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── POST - Submit KYC verification ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId: string;
      documentType: string;
      documentUrl: string;
      selfieUrl: string;
    };

    const { userId, documentType, documentUrl, selfieUrl } = body;

    if (!userId || !documentType || !documentUrl || !selfieUrl) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs sont requis: documentType, documentUrl, selfieUrl' },
        { status: 400 }
      );
    }

    const validTypes = ['passport', 'id_card', 'driver_license'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, message: 'Type de document invalide. Types acceptés: passport, id_card, driver_license' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true, email: true, kycStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Prevent duplicate submissions when already verified
    if (user.kycStatus === 'verified') {
      return NextResponse.json(
        { success: false, message: 'Votre identité est déjà vérifiée' },
        { status: 400 }
      );
    }

    const now = new Date();
    const kycData = {
      name: user.name,
      phone: user.phone,
      email: user.email,
      documentType,
      documentUrl,
      selfieUrl,
      submittedAt: now.toISOString(),
      verificationMode: 'automatic_document_and_selfie_presence_check',
    };

    await db.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'verified',
        kycSubmittedAt: now,
        kycVerifiedAt: now,
        kycRejectReason: null,
        kycDocumentType: documentType,
        kycDocumentUrl: documentUrl,
        kycSelfieUrl: selfieUrl,
        kycData: JSON.stringify(kycData),
      },
    });

    await db.securityLog.create({
      data: {
        userId,
        action: 'kyc_verified',
        details: JSON.stringify(kycData),
        riskLevel: 'low',
      },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId,
        title: 'Vérification KYC soumise',
        message: `Votre demande de vérification d'identité a été soumise avec succès. Vous serez notifié une fois la vérification terminée. Type de document: ${documentType}.`,
        type: 'security',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demande KYC soumise avec succès',
      kycStatus: 'verified',
    });
  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
