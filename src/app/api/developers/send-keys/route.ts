import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, developerId, publicKey, secretKey, webhookUrl, email, name, appName } = body;

    if (!adminId || !developerId || !publicKey || !secretKey || !email) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Verify admin
    const admin = await db.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin non trouvé' },
        { status: 403 }
      );
    }

    // Verify developer exists
    const developer = await db.developer.findUnique({ where: { id: developerId } });
    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Développeur non trouvé' },
        { status: 404 }
      );
    }

    const webhookLabel = webhookUrl ? `\n\n🔗 URL Webhook : ${webhookUrl}` : '';

    const emailBody = `Bonjour ${name || 'Développeur'},

Félicitations ! Votre demande d'intégration à l'API TRAIT a été approuvée.

Voici vos clés API de production pour l'application "${appName || 'Votre application'}" :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 CLÉ PUBLIQUE
${publicKey}

🔐 CLÉ SECRÈTE
${secretKey}${webhookLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT :
• Ne partagez JAMAIS votre clé secrète.
• Conservez-la dans un endroit sécurisé (variables d'environnement).
• La clé publique peut être utilisée côté client.

📚 Documentation :
• Guide d'intégration : https://trait-rho.vercel.app/pay/guide
• API Sandbox : https://sandbox.trait.cd/api/v1
• API Production : https://api.trait.cd/v1

💰 Frais : 1,5% par transaction traitée via votre intégration.

Pour toute question, contactez notre équipe support.

Cordialement,
L'équipe TRAIT`;

    // In production, send via email service (SendGrid, etc.)
    // For now, log and store the email
    console.log('=== EMAIL TO:', email, '===');
    console.log(emailBody);
    console.log('=== END EMAIL ===');

    // Create a notification for the developer
    await db.notification.create({
      data: {
        userId: developerId,
        title: 'Clés API TRAIT reçues',
        message: `Vos clés API pour "${appName || 'Votre application'}" ont été générées et envoyées à ${email}.`,
        type: 'system',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Clés envoyées à ${email}`,
      emailTo: email,
      emailPreview: emailBody.substring(0, 100) + '...',
    });
  } catch (error) {
    console.error('Send keys email error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi des clés' },
      { status: 500 }
    );
  }
}
