import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, clientPhone, amount, currency } = body as {
      agentId: string
      clientPhone: string
      amount: number
      currency: string
    }

    if (!agentId || !clientPhone || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants ou invalides' },
        { status: 400 }
      )
    }

    // Get agent
    const agent = await db.user.findUnique({
      where: { id: agentId },
    })

    if (!agent || agent.role !== 'agent') {
      return NextResponse.json(
        { success: false, message: 'Agent non trouvé' },
        { status: 404 }
      )
    }

    // Get client by phone
    const client = await db.user.findUnique({
      where: { phone: clientPhone.trim() },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, message: 'Client non trouvé' },
        { status: 404 }
      )
    }

    if (client.id === agentId) {
      return NextResponse.json(
        { success: false, message: 'Vous ne pouvez pas effectuer un dépôt pour vous-même' },
        { status: 400 }
      )
    }

    // Create the deposit
    const deposit = await db.deposit.create({
      data: {
        userId: client.id,
        amount,
        currency: currency || 'USD',
        method: 'agent',
        status: 'completed',
        agentId: agent.id,
      },
    })

    // Add amount to client's balance based on currency
    const isFC = (currency || 'USD') === 'FC';
    await db.user.update({
      where: { id: client.id },
      data: isFC
        ? { realBalanceFC: { increment: amount } }
        : { realBalance: { increment: amount } },
    })

    // Create notification for client
    await db.notification.create({
      data: {
        userId: client.id,
        title: 'Dépôt reçu',
        message: `Un dépôt de ${isFC ? amount.toLocaleString('fr-FR') : '$' + amount.toFixed(2)} ${currency || 'USD'} a été effectué par l'agent ${agent.name || agent.pseudo || agent.agentCode || 'N/A'} via ${agent.phone}.`,
        type: 'general',
      },
    })

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        currency: deposit.currency,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
    })
  } catch (error) {
    console.error('Agent deposit error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
