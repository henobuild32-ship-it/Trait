import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    const isAdmin = auth.role === 'admin'

    if (ticketId) {
      const ticket = await db.supportTicket.findFirst({
        where: isAdmin ? { id: ticketId } : { id: ticketId, userId: auth.userId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          user: { select: { id: true, name: true, phone: true } },
        },
      })
      if (!ticket) return NextResponse.json({ success: false, message: 'Ticket non trouvé' }, { status: 404 })
      return NextResponse.json({ success: true, ticket })
    }

    const tickets = await db.supportTicket.findMany({
      where: isAdmin ? {} : { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
        user: isAdmin ? { select: { id: true, name: true, phone: true } } : false,
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
