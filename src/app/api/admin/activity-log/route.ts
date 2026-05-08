import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    const where: any = {};

    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      db.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: { select: { name: true, username: true } },
        },
      }),
      db.adminActivityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin activity log error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
