import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      );
    }

    const admin = await db.admin.findUnique({
      where: { username },
    });

    if (!admin || admin.password !== password) {
      // Log failed login attempt
      await logSecurityEvent({
        adminId: admin?.id,
        action: 'login_failed',
        details: JSON.stringify({ username, reason: 'invalid_credentials' }),
        riskLevel: 'medium',
      });
      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Update last login
    await db.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Log activity + security log
    await db.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: 'login',
        details: 'Connexion administrateur réussie',
      },
    });

    await logSecurityEvent({
      adminId: admin.id,
      action: 'login',
      details: JSON.stringify({ username, adminName: admin.name }),
      riskLevel: 'low',
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
