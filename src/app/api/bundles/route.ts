import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await prisma.bundleCategory.findMany({
      include: { products: { where: { active: true } } },
      orderBy: { name: 'asc' },
    })

    if (categories.length === 0) {
      const seedData = [
        {
          name: 'Airtime',
          slug: 'airtime',
          products: [
            { name: 'Orange 500 FC', operator: 'Orange', type: 'airtime', amount: 500, price: 500 },
            { name: 'Orange 1000 FC', operator: 'Orange', type: 'airtime', amount: 1000, price: 1000 },
            { name: 'Orange 2000 FC', operator: 'Orange', type: 'airtime', amount: 2000, price: 2000 },
            { name: 'Orange 5000 FC', operator: 'Orange', type: 'airtime', amount: 5000, price: 5000 },
            { name: 'Airtel 500 FC', operator: 'Airtel', type: 'airtime', amount: 500, price: 500 },
            { name: 'Airtel 1000 FC', operator: 'Airtel', type: 'airtime', amount: 1000, price: 1000 },
            { name: 'Airtel 2000 FC', operator: 'Airtel', type: 'airtime', amount: 2000, price: 2000 },
            { name: 'Airtel 5000 FC', operator: 'Airtel', type: 'airtime', amount: 5000, price: 5000 },
            { name: 'Africell 500 FC', operator: 'Africell', type: 'airtime', amount: 500, price: 500 },
            { name: 'Africell 1000 FC', operator: 'Africell', type: 'airtime', amount: 1000, price: 1000 },
            { name: 'Africell 2000 FC', operator: 'Africell', type: 'airtime', amount: 2000, price: 2000 },
            { name: 'Africell 5000 FC', operator: 'Africell', type: 'airtime', amount: 5000, price: 5000 },
          ],
        },
        {
          name: 'Data',
          slug: 'data',
          products: [
            { name: 'Orange 100MB/500FC', operator: 'Orange', type: 'data', amount: 100, price: 500 },
            { name: 'Orange 500MB/2000FC', operator: 'Orange', type: 'data', amount: 500, price: 2000 },
            { name: 'Orange 1GB/3500FC', operator: 'Orange', type: 'data', amount: 1024, price: 3500 },
            { name: 'Orange 5GB/10000FC', operator: 'Orange', type: 'data', amount: 5120, price: 10000 },
            { name: 'Airtel 100MB/500FC', operator: 'Airtel', type: 'data', amount: 100, price: 500 },
            { name: 'Airtel 500MB/2000FC', operator: 'Airtel', type: 'data', amount: 500, price: 2000 },
            { name: 'Airtel 1GB/3500FC', operator: 'Airtel', type: 'data', amount: 1024, price: 3500 },
            { name: 'Airtel 5GB/10000FC', operator: 'Airtel', type: 'data', amount: 5120, price: 10000 },
            { name: 'Africell 100MB/500FC', operator: 'Africell', type: 'data', amount: 100, price: 500 },
            { name: 'Africell 500MB/2000FC', operator: 'Africell', type: 'data', amount: 500, price: 2000 },
            { name: 'Africell 1GB/3500FC', operator: 'Africell', type: 'data', amount: 1024, price: 3500 },
            { name: 'Africell 5GB/10000FC', operator: 'Africell', type: 'data', amount: 5120, price: 10000 },
          ],
        },
        {
          name: 'DSTV',
          slug: 'dstv',
          products: [
            { name: 'Compact (35 000 FC)', operator: 'DSTV', type: 'tv', amount: 35000, price: 35000 },
            { name: 'Premium (65 000 FC)', operator: 'DSTV', type: 'tv', amount: 65000, price: 65000 },
            { name: 'Access (15 000 FC)', operator: 'DSTV', type: 'tv', amount: 15000, price: 15000 },
          ],
        },
        {
          name: 'Canal+',
          slug: 'canal-plus',
          products: [
            { name: 'Essentiel (15 000 FC)', operator: 'Canal+', type: 'tv', amount: 15000, price: 15000 },
            { name: 'Intégral (35 000 FC)', operator: 'Canal+', type: 'tv', amount: 35000, price: 35000 },
            { name: 'Famille (25 000 FC)', operator: 'Canal+', type: 'tv', amount: 25000, price: 25000 },
          ],
        },
      ]

      for (const cat of seedData) {
        await prisma.bundleCategory.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            products: {
              create: cat.products,
            },
          },
        })
      }

      const seeded = await prisma.bundleCategory.findMany({
        include: { products: { where: { active: true } } },
        orderBy: { name: 'asc' },
      })

      return NextResponse.json({ success: true, categories: seeded })
    }

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Bundles GET error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
