import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/security';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validation input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Nom d'utilisateur et mot de passe requis" },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await db.admin.findUnique({
      where: { username },
    });

    // If admin not found
    if (!admin) {
      await logSecurityEvent({
        adminId: null,
        action: 'login_failed',
        details: JSON.stringify({ username, reason: 'user_not_found' }),
        riskLevel: 'medium',
      });

      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Check password (SECURE VERSION)
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      await logSecurityEvent({
        adminId: admin.id,
        action: 'login_failed',
        details: JSON.stringify({ username, reason: 'invalid_password' }),
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

    // Activity log
    await db.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: 'login',
        details: 'Connexion administrateur réussie',
      },
    });

    // Security log success
    await logSecurityEvent({
      adminId: admin.id,
      action: 'login',
      details: JSON.stringify({
        username,
        adminName: admin.name,
      }),
      riskLevel: 'low',
    });

    // Response
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
      {
        success: false,
        message: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}