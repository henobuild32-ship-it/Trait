import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List child accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, any> = {
      parentId: { not: null },
    };

    if (search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const children = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        cards: {
          select: {
            id: true,
            cardType: true,
            cardNumber: true,
            cvv: true,
            qrCode: true,
            expiryDate: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (error) {
    console.error('Admin list children error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Actions on child accounts and cards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      adminId: string;
      action: 'confirm-delivery' | 'block-card' | 'unblock-card' | 'suspend-card' | 'unsuspend-card' | 'suspend-child' | 'unsuspend-child';
      cardId?: string;
      childId?: string;
      reason?: string;
    };

    const { adminId, action, cardId, childId, reason } = body;

    if (!adminId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres adminId et action requis' },
        { status: 400 }
      );
    }

    // Verify admin
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin non trouvé' },
        { status: 404 }
      );
    }

    // ── CONFIRM DELIVERY (CONFIRM RETRAIT) ───────────────────────────
    if (action === 'confirm-delivery') {
      if (!cardId) {
        return NextResponse.json({ success: false, message: 'cardId requis' }, { status: 400 });
      }

      const card = await db.traitCard.findUnique({
        where: { id: cardId },
        include: { user: true },
      });

      if (!card) {
        return NextResponse.json({ success: false, message: 'Carte non trouvée' }, { status: 404 });
      }

      const updatedCard = await db.traitCard.update({
        where: { id: cardId },
        data: { status: 'delivered' }, // Carte remise
      });

      // Log in AdminActivityLog
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'confirm_child_card_delivery',
          target: cardId,
          details: JSON.stringify({
            childId: card.userId,
            childName: card.user.name,
            cardNumber: card.cardNumber,
          }),
        },
      });

      // Notify parent
      if (card.user.parentId) {
        await db.notification.create({
          data: {
            userId: card.user.parentId,
            title: 'Carte Enfant remise',
            message: `La carte physique TRAIT de ${card.user.name} a été remise par l'administration.`,
            type: 'general',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'La remise de la carte a été confirmée avec succès.',
        card: updatedCard,
      });
    }

    // ── BLOCK / UNBLOCK / SUSPEND CARD ──────────────────────────────
    if (['block-card', 'unblock-card', 'suspend-card', 'unsuspend-card'].includes(action)) {
      if (!cardId) {
        return NextResponse.json({ success: false, message: 'cardId requis' }, { status: 400 });
      }

      let newStatus = 'active';
      if (action === 'block-card') newStatus = 'blocked';
      if (action === 'suspend-card') newStatus = 'suspended';

      const card = await db.traitCard.findUnique({
        where: { id: cardId },
        include: { user: true },
      });

      if (!card) {
        return NextResponse.json({ success: false, message: 'Carte non trouvée' }, { status: 404 });
      }

      const updatedCard = await db.traitCard.update({
        where: { id: cardId },
        data: { status: newStatus },
      });

      // Log activity
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: `card_${action.split('-')[0]}`,
          target: cardId,
          details: JSON.stringify({
            childId: card.userId,
            childName: card.user.name,
            cardNumber: card.cardNumber,
            reason: reason || 'Non spécifié',
          }),
        },
      });

      // Notify parent
      if (card.user.parentId) {
        await db.notification.create({
          data: {
            userId: card.user.parentId,
            title: `Statut carte enfant modifié`,
            message: `Le statut de la carte de ${card.user.name} a été changé à "${newStatus}" par l'administration.`,
            type: 'security',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Statut de la carte mis à jour à "${newStatus}".`,
        card: updatedCard,
      });
    }

    // ── SUSPEND / UNSUSPEND CHILD ACCOUNT ─────────────────────────────
    if (action === 'suspend-child' || action === 'unsuspend-child') {
      if (!childId) {
        return NextResponse.json({ success: false, message: 'childId requis' }, { status: 400 });
      }

      const child = await db.user.findUnique({
        where: { id: childId },
      });

      if (!child || !child.parentId) {
        return NextResponse.json({ success: false, message: 'Compte enfant non trouvé' }, { status: 404 });
      }

      const suspended = action === 'suspend-child';
      const updatedChild = await db.user.update({
        where: { id: childId },
        data: {
          suspended,
          suspensionReason: suspended ? (reason || 'Suspendu par l\'administrateur') : null,
        },
      });

      // Log activity
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: suspended ? 'suspend_child_account' : 'unsuspend_child_account',
          target: childId,
          details: JSON.stringify({
            childName: child.name,
            reason: reason || 'Non spécifié',
          }),
        },
      });

      // Notify parent
      await db.notification.create({
        data: {
          userId: child.parentId,
          title: suspended ? 'Compte enfant suspendu' : 'Compte enfant réactivé',
          message: `Le compte de votre enfant ${child.name} a été ${suspended ? 'suspendu' : 'réactivé'} par l'administration. ${suspended && reason ? `Motif: ${reason}` : ''}`,
          type: 'security',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Compte enfant ${suspended ? 'suspendu' : 'réactivé'} avec succès.`,
        child: updatedChild,
      });
    }

    return NextResponse.json({ success: false, message: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Admin child action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de l\'action administrative' },
      { status: 500 }
    );
  }
}
