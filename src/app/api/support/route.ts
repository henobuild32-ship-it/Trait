import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const tickets = await db.supportTicket.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ success: true, tickets })
  } catch (error) {
    console.error('Support tickets list error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { subject, category, message, priority } = body as {
      subject: string
      category: string
      message: string
      priority?: string
    }

    if (!subject || !category || !message) {
      return NextResponse.json(
        { success: false, message: 'Sujet, catégorie et message requis' },
        { status: 400 }
      )
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId: auth.userId,
        subject,
        category,
        message,
        priority: priority || 'medium',
        status: 'open',
      },
    })

    await db.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: auth.userId,
        message,
      },
    })

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('Support ticket create error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
