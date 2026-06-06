import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List sellers with optional validation status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: any = { role: 'seller' };

    if (status && ['pending', 'validated', 'rejected', 'suspended'].includes(status)) {
      where.validationStatus = status;
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
        { businessName: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
        { businessType: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const sellers = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        pseudo: true,
        businessName: true,
        businessType: true,
        location: true,
        email: true,
        gender: true,
        city: true,
        country: true,
        photoId: true,
        validationStatus: true,
        validationRejectReason: true,
        realBalance: true,
        bonusBalance: true,
        suspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      sellers,
    });
  } catch (error) {
    console.error('Seller validation list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Validate/reject/hold seller
export async function POST(request: NextRequest) {
  try {
    const { adminId, action, sellerId, reason } = await request.json();

    if (!adminId || !action || !sellerId) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: adminId, action, sellerId requis' },
        { status: 400 }
      );
    }

    const seller = await db.user.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return NextResponse.json(
        { success: false, message: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    const justification = reason?.trim() || '';

    // VALIDATE action
    if (action === 'validate') {
      const updated = await db.user.update({
        where: { id: sellerId },
        data: {
          validationStatus: 'validated',
          isVerified: true,
          validationRejectReason: justification || 'Bienvenue dans le réseau de vendeurs TRAIT !',
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'validate_seller',
          target: sellerId,
          details: JSON.stringify({
            sellerName: seller.businessName || seller.name || seller.phone,
            message: justification || 'Validé sans message spécifique',
          }),
        },
      });

      // Create notification for the seller
      await db.notification.create({
        data: {
          userId: sellerId,
          title: 'Compte vendeur validé ✓',
          message: justification || `Félicitations ${seller.businessName || seller.name} ! Votre compte vendeur a été validé par l'administrateur TRAIT. Vous pouvez maintenant accéder à votre tableau de bord vendeur.`,
          type: 'system',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Vendeur validé avec succès',
        seller: {
          id: updated.id,
          name: updated.name,
          businessName: updated.businessName,
          validationStatus: updated.validationStatus,
          validationRejectReason: updated.validationRejectReason,
        },
      });
    }

    // REJECT action
    if (action === 'reject') {
      if (!justification) {
        return NextResponse.json(
          { success: false, message: 'Une raison/justification du refus est requise' },
          { status: 400 }
        );
      }

      const updated = await db.user.update({
        where: { id: sellerId },
        data: {
          validationStatus: 'rejected',
          validationRejectReason: justification,
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_seller',
          target: sellerId,
          details: JSON.stringify({
            sellerName: seller.businessName || seller.name || seller.phone,
            reason: justification,
          }),
        },
      });

      // Create notification for the seller
      await db.notification.create({
        data: {
          userId: sellerId,
          title: 'Demande vendeur refusée',
          message: `Votre demande de compte vendeur a été refusée. Motif: ${justification}`,
          type: 'system',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Vendeur refusé',
        seller: {
          id: updated.id,
          validationStatus: updated.validationStatus,
          validationRejectReason: updated.validationRejectReason,
        },
      });
    }

    // HOLD action (put on hold)
    if (action === 'hold' || action === 'pending') {
      if (!justification) {
        return NextResponse.json(
          { success: false, message: 'Une justification pour la mise en attente est requise' },
          { status: 400 }
        );
      }

      const updated = await db.user.update({
        where: { id: sellerId },
        data: {
          validationStatus: 'pending',
          validationRejectReason: justification,
        },
      });

      // Create admin activity log
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'hold_seller',
          target: sellerId,
          details: JSON.stringify({
            sellerName: seller.businessName || seller.name || seller.phone,
            reason: justification,
          }),
        },
      });

      // Create notification for the seller
      await db.notification.create({
        data: {
          userId: sellerId,
          title: 'Demande vendeur en attente',
          message: `Votre demande de compte vendeur a été mise en attente par l'administrateur. Motif/Remarque : ${justification}`,
          type: 'system',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Vendeur mis en attente',
        seller: {
          id: updated.id,
          validationStatus: updated.validationStatus,
          validationRejectReason: updated.validationRejectReason,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue. Actions possibles: validate, reject, hold' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Seller validation action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
