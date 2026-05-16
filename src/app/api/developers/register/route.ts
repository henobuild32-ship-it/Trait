import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// POST - Developer registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      company,
      email,
      phone,
      country,
      appName,
      projectType,
      description,
      siteUrl,
      estimatedUsers,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !country || !appName || !projectType || !estimatedUsers) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Champs requis manquants: fullName, email, phone, country, appName, projectType, estimatedUsers',
        },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingDeveloper = await db.developer.findUnique({
      where: { email },
    });

    if (existingDeveloper) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé pour une inscription développeur' },
        { status: 409 }
      );
    }

    // Create developer record with status: pending
    const developer = await db.developer.create({
      data: {
        fullName,
        company: company || null,
        email,
        phone,
        country,
        appName,
        projectType,
        description: description || null,
        siteUrl: siteUrl || null,
        estimatedUsers: Number(estimatedUsers),
        status: 'pending',
      },
    });

    // Create AdminActivityLog (optional, may fail if no system admin)
    try {
      await db.adminActivityLog.create({
        data: {
          adminId: 'system',
          action: 'developer_register',
          target: developer.id,
          details: `Nouvelle demande développeur: ${fullName} (${email}) - Application: ${appName} (${projectType})`,
        },
      });
    } catch { /* system admin not found, skip */ }

    // Create GlobalNotification for admin (optional)
    try {
      await db.globalNotification.create({
        data: {
          adminId: 'system',
          title: 'Nouvelle demande développeur',
          message: `${fullName} a soumis une demande de compte développeur pour l'application "${appName}" (${projectType}). Pays: ${country}. Email: ${email}`,
          type: 'alert',
          sentToAll: false,
        },
      });
    } catch { /* skip */ }

    return NextResponse.json({
      success: true,
      message: 'Demande de compte développeur soumise avec succès',
      developer: {
        id: developer.id,
        fullName: developer.fullName,
        email: developer.email,
        appName: developer.appName,
        status: developer.status,
      },
    });
  } catch (error) {
    console.error('Developer registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
