import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || '';
    const active = searchParams.get('active');

    const where: any = {};

    if (category) where.category = category;
    if (active === 'true') where.active = true;
    if (active === 'false') where.active = false;

    const [products, total] = await Promise.all([
      db.marketplaceProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, pseudo: true } },
        },
      }),
      db.marketplaceProduct.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin market list error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: create/update/delete/toggle product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, action } = body;

    if (!adminId || !action) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // CREATE product
    if (action === 'create') {
      const { name, description, price, category, imageUrl } = body;

      if (!name || !description || !price || !category) {
        return NextResponse.json(
          { success: false, message: 'Nom, description, prix et catégorie requis' },
          { status: 400 }
        );
      }

      const product = await db.marketplaceProduct.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          category,
          imageUrl: imageUrl || null,
          active: true,
        },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'publish_product',
          target: product.id,
          details: `Produit publié: "${name}" - ${price} USD (${category})`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Produit publié avec succès',
        product,
      });
    }

    // UPDATE product
    if (action === 'update') {
      const { productId, name, description, price, category, imageUrl } = body;

      if (!productId) {
        return NextResponse.json(
          { success: false, message: 'ID produit requis' },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (price) updateData.price = parseFloat(price);
      if (category) updateData.category = category;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

      const product = await db.marketplaceProduct.update({
        where: { id: productId },
        data: updateData,
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'update_product',
          target: productId,
          details: `Produit modifié: "${product.name}"`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Produit modifié',
        product,
      });
    }

    // TOGGLE active status
    if (action === 'toggle') {
      const { productId } = body;

      const product = await db.marketplaceProduct.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Produit non trouvé' },
          { status: 404 }
        );
      }

      const updated = await db.marketplaceProduct.update({
        where: { id: productId },
        data: { active: !product.active },
      });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: product.active ? 'deactivate_product' : 'activate_product',
          target: productId,
          details: `Produit "${product.name}" ${product.active ? 'désactivé' : 'activé'}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Produit ${updated.active ? 'activé' : 'désactivé'}`,
        product: updated,
      });
    }

    // DELETE product
    if (action === 'delete') {
      const { productId } = body;

      const product = await db.marketplaceProduct.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Produit non trouvé' },
          { status: 404 }
        );
      }

      await db.marketplaceProduct.delete({ where: { id: productId } });

      await db.adminActivityLog.create({
        data: {
          adminId,
          action: 'delete_product',
          target: productId,
          details: `Produit "${product.name}" supprimé`,
        },
      });

      return NextResponse.json({ success: true, message: 'Produit supprimé' });
    }

    return NextResponse.json(
      { success: false, message: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin market action error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
