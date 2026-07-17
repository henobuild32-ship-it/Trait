import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      return NextResponse.json({ success: false, message: 'ID de transaction requis' }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: { select: { id: true, name: true, pseudo: true, phone: true } },
        receiver: { select: { id: true, name: true, pseudo: true, phone: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction introuvable' }, { status: 404 })
    }

    if (transaction.senderId !== auth.id && transaction.receiverId !== auth.id) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
    }

    const receiptNumber = `RCP-${transaction.id.slice(0, 8).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`

    const receipt = {
      receiptNumber,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        fee: transaction.fee,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      sender: {
        id: transaction.sender.id,
        name: transaction.sender.name,
        pseudo: transaction.sender.pseudo,
        phone: transaction.sender.phone,
      },
      receiver: {
        id: transaction.receiver.id,
        name: transaction.receiver.name,
        pseudo: transaction.receiver.pseudo,
        phone: transaction.receiver.phone,
      },
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, receipt })
  } catch (error) {
    console.error('Receipt POST error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
