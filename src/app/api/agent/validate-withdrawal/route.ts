import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { withdrawalId, action } = body as {
      withdrawalId: string
      action: 'validate' | 'refuse'
    }

    if (!withdrawalId || !action || !['validate', 'refuse'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants ou invalides' },
        { status: 400 }
      )
    }

    // Find the withdrawal
    const withdrawal = await db.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        user: { select: { id: true, name: true, phone: true, realBalance: true, realBalanceFC: true } },
      },
    })

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Retrait non trouvé' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Ce retrait a déjà été traité' },
        { status: 400 }
      )
    }

    if (action === 'validate') {
      // The withdrawal was already deducted when created (pending status)
      // Just mark as completed
      const updated = await db.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'completed' },
      })

      // Create notification for client
      await db.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Retrait validé',
          message: `Votre retrait de $${withdrawal.amount.toFixed(2)} a été validé. Montant net: $${(withdrawal.amount - withdrawal.fee).toFixed(2)}.`,
          type: 'withdrawal_validated',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Retrait validé avec succès',
        withdrawal: {
          id: updated.id,
          status: updated.status,
        },
      })
    }

    if (action === 'refuse') {
      // Refund the client: add back amount + fee
      await db.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'failed' },
      })

      // Refund the client's balance based on currency
      const isFC = withdrawal.currency === 'FC';
      await db.user.update({
        where: { id: withdrawal.userId },
        data: isFC
          ? { realBalanceFC: { increment: withdrawal.amount + withdrawal.fee } }
          : { realBalance: { increment: withdrawal.amount + withdrawal.fee } },
      })

      // Create notification for client
      await db.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Retrait refusé',
          message: `Votre retrait de $${withdrawal.amount.toFixed(2)} a été refusé. Le montant a été remboursé sur votre solde.`,
          type: 'general',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Retrait refusé',
        withdrawal: {
          id: withdrawalId,
          status: 'failed',
        },
      })
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Validate withdrawal error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
