import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { rate } = body as { rate: number }

    if (!rate || rate <= 0 || rate > 10000) {
      return NextResponse.json(
        { success: false, message: 'Taux invalide (doit être entre 0 et 10000)' },
        { status: 400 }
      )
    }

    await db.systemConfig.upsert({
      where: { key: 'exchange_rate_usd_fc' },
      update: { value: String(rate) },
      create: { key: 'exchange_rate_usd_fc', value: String(rate) },
    })

    return NextResponse.json({ success: true, message: 'Taux de change mis à jour', rate })
  } catch (error) {
    console.error('Update exchange rate error:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
