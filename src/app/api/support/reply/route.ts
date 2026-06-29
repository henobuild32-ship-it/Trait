import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { ticketId, message } = body as {
      ticketId: string
      message: string
    }

    if (!ticketId || !message) {
      return NextResponse.json(
        { success: false, message: 'ticketId et message requis' },
        { status: 400 }
      )
    }

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket non trouvé' }, { status: 404 })
    }

    if (ticket.userId !== auth.userId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
    }

    const newMessage = await db.supportMessage.create({
      data: {
        ticketId,
        senderId: auth.userId,
        message,
      },
    })

    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'waiting_response' },
    })

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error) {
    console.error('Support reply error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
