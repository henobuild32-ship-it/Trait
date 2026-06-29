import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const config = await db.systemConfig.findUnique({
      where: { key: 'exchange_rate_usd_fc' },
    })

    const rate = config ? parseFloat(config.value) : 2850

    return NextResponse.json({ success: true, rate })
  } catch (error) {
    console.error('Exchange rate error:', error)
    return NextResponse.json({ success: true, rate: 2850 })
  }
}
