import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: Create or get chat for an offer
// POST: Send message to a chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, offerId, initiatedBy, senderId, content } = body as {
      chatId?: string
      offerId?: string
      initiatedBy?: string
      senderId?: string
      content?: string
    }

    // Case 1: Create or get chat for an offer
    if (offerId && initiatedBy && !content) {
      const offer = await db.barterOffer.findUnique({
        where: { id: offerId },
      })

      if (!offer) {
        return NextResponse.json(
          { success: false, message: 'Offer not found' },
          { status: 404 }
        )
      }

      // Check if a chat already exists between the initiator and the offer creator
      const existingChat = await db.barterChat.findFirst({
        where: {
          offerId,
          initiatedBy,
        },
        include: {
          participants: true,
        },
      })

      if (existingChat) {
        return NextResponse.json({
          success: true,
          chat: {
            id: existingChat.id,
            offerId: existingChat.offerId,
            initiatedBy: existingChat.initiatedBy,
            createdAt: existingChat.createdAt,
          },
        })
      }

      // Create new chat
      const chat = await db.barterChat.create({
        data: {
          offerId,
          initiatedBy,
        },
      })

      // Add both participants
      await db.barterChatParticipant.create({
        data: { chatId: chat.id, userId: initiatedBy },
      })
      await db.barterChatParticipant.create({
        data: { chatId: chat.id, userId: offer.offeredBy },
      })

      // Notify the offer owner
      await db.notification.create({
        data: {
          userId: offer.offeredBy,
          title: 'New Barter Chat',
          message: `Someone started a chat about your offer: "${offer.title}"`,
          type: 'barter_accepted',
        },
      })

      return NextResponse.json({
        success: true,
        chat: {
          id: chat.id,
          offerId: chat.offerId,
          initiatedBy: chat.initiatedBy,
          createdAt: chat.createdAt,
        },
      })
    }

    // Case 2: Send message to a chat
    if (chatId && senderId && content) {
      const chat = await db.barterChat.findUnique({
        where: { id: chatId },
      })

      if (!chat) {
        return NextResponse.json(
          { success: false, message: 'Chat not found' },
          { status: 404 }
        )
      }

      const message = await db.barterMessage.create({
        data: {
          chatId,
          senderId,
          content: content.trim(),
        },
      })

      return NextResponse.json({
        success: true,
        message: {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        },
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid request. Provide offerId+initiatedBy to create chat, or chatId+senderId+content to send message.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Barter chat POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get messages for a chat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')

    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'Chat ID is required' },
        { status: 400 }
      )
    }

    const messages = await db.barterMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        chatId: m.chatId,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
