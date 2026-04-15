import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, pseudo, country } = body as {
      userId: string
      name: string
      pseudo: string
      country: string
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && name !== null && { name: name.trim() || null }),
        ...(pseudo !== undefined && pseudo !== null && { pseudo: pseudo.trim() || null }),
        ...(country !== undefined && country !== null && { country: country.trim() || 'US' }),
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        pseudo: user.pseudo,
        country: user.country,
        realBalance: user.realBalance,
        bonusBalance: user.bonusBalance,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
