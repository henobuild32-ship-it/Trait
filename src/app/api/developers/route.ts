import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// Helper: generate secure random string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// GET - List developers with optional status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};

    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      where.status = status;
    }

    const developers = await db.developer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        apiKeys: {
          select: {
            id: true,
            publicKey: true,
            mode: true,
            isActive: true,
            createdAt: true,
          },
        },
        commissions: {
          select: {
            id: true,
            amount: true,
            commission: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    // Add computed fields
    const enrichedDevelopers = developers.map((dev) => ({
      ...dev,
      apiKeysCount: dev.apiKeys.length,
      totalCommissions: dev.commissions.reduce((sum, c) => sum + c.commission, 0),
      // Mask secret keys for security
      apiKeys: dev.apiKeys.map((key) => ({
        ...key,
        secretKeyPreview: 'sk_live_****',
      })),
    }));

    return NextResponse.json({
      success: true,
      developers: enrichedDevelopers,
    });
  } catch (error) {
    console.error('Developers list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Admin actions on developers
export async function POST(request: NextRequest) {
  try {
    const { adminId, action, developerId, reason } = await request.json();

    if (!adminId || !action || !developerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paramètres manquants: adminId, action, developerId requis',
        },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'suspend', 'reactivate', 'generate-keys'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: `Action non reconnue. Actions possibles: ${validActions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const developer = await db.developer.findUnique({
      where: { id: developerId },
      include: { apiKeys: true },
    });

    if (!developer) {
      return NextResponse.json(
        { success: false, message: 'Développeur non trouvé' },
        { status: 404 }
      );
    }

    // APPROVE action
    if (action === 'approve') {
      const updated = await db.developer.update({
        where: { id: developerId },
        data: { status: 'approved' },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'approve_developer',
          target: developerId,
          details: `Développeur approuvé: ${developer.fullName} (${developer.email}) - Application: ${developer.appName}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Développeur approuvé avec succès',
        developer: {
          id: updated.id,
          status: updated.status,
        },
      });
    }

    // REJECT action
    if (action === 'reject') {
      const updated = await db.developer.update({
        where: { id: developerId },
        data: {
          status: 'rejected',
          rejectReason: reason || 'Demande rejetée par l\'administration',
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reject_developer',
          target: developerId,
          details: `Développeur rejeté: ${developer.fullName} (${developer.email}) - Motif: ${reason || 'Non spécifié'}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Développeur rejeté',
        developer: {
          id: updated.id,
          status: updated.status,
          rejectReason: updated.rejectReason,
        },
      });
    }

    // SUSPEND action
    if (action === 'suspend') {
      const updated = await db.developer.update({
        where: { id: developerId },
        data: {
          status: 'suspended',
          rejectReason: reason || 'Suspendu par l\'administration',
        },
      });

      // Deactivate all API keys
      await db.developerApiKey.updateMany({
        where: { developerId },
        data: { isActive: false },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'suspend_developer',
          target: developerId,
          details: `Développeur suspendu: ${developer.fullName} (${developer.email}) - Motif: ${reason || 'Non spécifié'} - ${developer.apiKeys.length} clé(s) API désactivée(s)`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Développeur suspendu',
        developer: {
          id: updated.id,
          status: updated.status,
        },
      });
    }

    // REACTIVATE action
    if (action === 'reactivate') {
      const updated = await db.developer.update({
        where: { id: developerId },
        data: {
          status: 'approved',
          rejectReason: null,
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'reactivate_developer',
          target: developerId,
          details: `Développeur réactivé: ${developer.fullName} (${developer.email})`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Développeur réactivé avec succès',
        developer: {
          id: updated.id,
          status: updated.status,
        },
      });
    }

    // GENERATE-KEYS action
    if (action === 'generate-keys') {
      if (developer.status !== 'approved') {
        return NextResponse.json(
          { success: false, message: 'Impossible de générer des clés pour un développeur non approuvé' },
          { status: 400 }
        );
      }

      const publicKey = `pk_live_${generateRandomString(24)}`;
      const secretKey = `sk_live_${generateRandomString(32)}`;

      const apiKey = await db.developerApiKey.create({
        data: {
          developerId,
          publicKey,
          secretKey,
          mode: 'live',
          isActive: true,
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'generate_api_keys',
          target: developerId,
          details: `Clés API générées pour ${developer.fullName} (${developer.email}) - Clé publique: ${publicKey}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Clés API générées avec succès',
        apiKey: {
          id: apiKey.id,
          publicKey,
          secretKey, // Only returned once at generation
          mode: apiKey.mode,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Action non traitée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Developer action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
