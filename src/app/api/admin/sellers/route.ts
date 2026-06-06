import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List sellers with pagination, search, and validation/suspension statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // validated, pending, rejected, suspended, active
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { role: 'seller' };

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { phone: { contains: search.trim() } },
        { businessName: { contains: search.trim() } },
        { location: { contains: search.trim() } },
        { businessType: { contains: search.trim() } },
      ];
    }

    if (status) {
      if (status === 'suspended') {
        where.suspended = true;
      } else if (status === 'active') {
        where.suspended = false;
        where.validationStatus = 'validated';
      } else if (['pending', 'validated', 'rejected'].includes(status)) {
        where.validationStatus = status;
      }
    }

    // Fetch stats of sellers
    const [totalSellers, validatedSellers, pendingSellers, rejectedSellers, suspendedSellers] = await Promise.all([
      db.user.count({ where: { role: 'seller' } }),
      db.user.count({ where: { role: 'seller', validationStatus: 'validated', suspended: false } }),
      db.user.count({ where: { role: 'seller', validationStatus: 'pending' } }),
      db.user.count({ where: { role: 'seller', validationStatus: 'rejected' } }),
      db.user.count({ where: { role: 'seller', suspended: true } }),
    ]);

    // Fetch sellers
    const sellers = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        pseudo: true,
        email: true,
        gender: true,
        city: true,
        country: true,
        role: true,
        businessName: true,
        businessType: true,
        location: true,
        validationStatus: true,
        validationRejectReason: true,
        realBalance: true,
        realBalanceFC: true,
        bonusBalance: true,
        bonusBalanceFC: true,
        isVerified: true,
        suspended: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      sellers,
      stats: {
        totalSellers,
        validatedSellers,
        pendingSellers,
        rejectedSellers,
        suspendedSellers,
      },
      page,
      totalPages: Math.ceil((status ? sellers.length : totalSellers) / limit),
    });
  } catch (error) {
    console.error('Sellers API list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la récupération des vendeurs' },
      { status: 500 }
    );
  }
}

// POST - Suspend, Activate, or Delete a seller with administrative justification message
export async function POST(request: NextRequest) {
  try {
    const { sellerId, adminId, action, reason } = await request.json();

    if (!sellerId || !adminId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: sellerId, adminId, action requis' },
        { status: 400 }
      );
    }

    const seller = await db.user.findUnique({ where: { id: sellerId } });
    if (!seller || seller.role !== 'seller') {
      return NextResponse.json(
        { success: false, message: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    const justification = reason?.trim();
    if (!justification) {
      return NextResponse.json(
        { success: false, message: 'Un message de justification est requis pour cette action' },
        { status: 400 }
      );
    }

    // SUSPEND Action
    if (action === 'suspend') {
      const updated = await db.user.update({
        where: { id: sellerId },
        data: {
          suspended: true,
          suspensionReason: justification,
          validationStatus: 'suspended', // Alignment
        },
      });

      // Log in Admin Activity Logs
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'suspend_seller',
          target: sellerId,
          details: JSON.stringify({
            sellerName: seller.businessName || seller.name || seller.phone,
            justification,
          }),
        },
      });

      // Notify the Seller
      await db.notification.create({
        data: {
          userId: sellerId,
          title: 'Votre compte vendeur a été suspendu ⚠️',
          message: `Votre accès vendeur a été suspendu. Motif : ${justification}`,
          type: 'alert',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Compte vendeur suspendu avec succès',
        seller: {
          id: updated.id,
          suspended: updated.suspended,
          suspensionReason: updated.suspensionReason,
        },
      });
    }

    // ACTIVATE/REACTIVATE Action
    if (action === 'activate' || action === 'reactivate') {
      const updated = await db.user.update({
        where: { id: sellerId },
        data: {
          suspended: false,
          suspensionReason: null,
          validationStatus: 'validated', // Re-validate if suspended
        },
      });

      // Log in Admin Activity Logs
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'activate_seller',
          target: sellerId,
          details: JSON.stringify({
            sellerName: seller.businessName || seller.name || seller.phone,
            justification,
          }),
        },
      });

      // Notify Seller
      await db.notification.create({
        data: {
          userId: sellerId,
          title: 'Votre compte vendeur est réactivé ✓',
          message: `Félicitations, votre compte vendeur a été réactivé. Justification de réactivation : ${justification}`,
          type: 'system',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Compte vendeur activé avec succès',
        seller: {
          id: updated.id,
          suspended: updated.suspended,
          validationStatus: updated.validationStatus,
        },
      });
    }

    // DELETE Action
    if (action === 'delete') {
      // Delete products owned by this seller
      await db.marketplaceProduct.deleteMany({
        where: { sellerId },
      });

      // Delete notifications of this seller
      await db.notification.deleteMany({
        where: { userId: sellerId },
      });

      // Delete user account
      await db.user.delete({
        where: { id: sellerId },
      });

      // Log in Admin Activity Logs
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'delete_seller',
          target: sellerId,
          details: JSON.stringify({
            sellerName: seller.businessName || seller.name || seller.phone,
            justification,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Compte vendeur supprimé définitivement',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non valide. Valeurs possibles: suspend, activate, delete' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Sellers API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la modification du vendeur' },
      { status: 500 }
    );
  }
}
