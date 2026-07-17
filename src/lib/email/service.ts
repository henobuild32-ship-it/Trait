import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `TRAIT <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Votre code de vérification TRAIT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; background: #0D5C63; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">T</div>
          <h1 style="color: #0D5C63; font-size: 20px; margin-top: 8px;">TRAIT</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 18px; text-align: center;">Code de vérification</h2>
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 24px;">Utilisez le code ci-dessous pour vérifier votre identité</p>
        <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e5e7eb;">
          <h1 style="font-size: 42px; letter-spacing: 12px; color: #0D5C63; font-family: monospace; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">Ce code expire dans 5 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">© 2026 TRAIT - Fait avec ❤️ en RDC</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, newPassword: string): Promise<void> {
  await transporter.sendMail({
    from: `TRAIT <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Votre nouveau mot de passe TRAIT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; background: #0D5C63; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">T</div>
          <h1 style="color: #0D5C63; font-size: 20px; margin-top: 8px;">TRAIT</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 18px; text-align: center;">Réinitialisation de mot de passe</h2>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">Votre mot de passe a été réinitialisé.</p>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 13px; margin-bottom: 8px;">Votre nouveau mot de passe :</p>
          <p style="font-size: 24px; text-align: center; font-family: monospace; color: #0D5C63; font-weight: bold; margin: 12px 0; letter-spacing: 2px;">${newPassword}</p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">Veuillez changer ce mot de passe après votre prochaine connexion.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">© 2026 TRAIT - Fait avec ❤️ en RDC</p>
      </div>
    `,
  });
}
