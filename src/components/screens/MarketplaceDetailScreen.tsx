'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Package,
  Palette,
  LayoutTemplate,
  Wrench,
  MonitorSmartphone,
  Info,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';

const CATEGORY_ICONS: Record<string, typeof Package> = {
  design: Palette,
  template: LayoutTemplate,
  service: Wrench,
  digital_product: MonitorSmartphone,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  design: 'from-rose-400 to-orange-400',
  template: 'from-violet-400 to-purple-400',
  service: 'from-amber-400 to-yellow-400',
  digital_product: 'from-emerald-400 to-teal-400',
  default: 'from-emerald-400 to-cyan-400',
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  seller: { id: string; name: string; pseudo: string } | null;
}

interface PurchaseResult {
  id: string;
  amount: number;
  usedBonus: number;
  usedReal: number;
  status: string;
}

export default function MarketplaceDetailScreen() {
  const { goBack, pageParams, user, setUser } = useAppStore();
  const productId = pageParams.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    if (!productId) {
      goBack();
      return;
    }

    async function fetchProduct() {
      try {
        const res = await fetch('/api/marketplace/products');
        const data = await res.json();
        if (data.success) {
          const found = data.products.find(
            (p: Product) => p.id === productId
          );
          if (found) {
            setProduct(found);
          } else {
            toast.error('Produit introuvable');
            goBack();
          }
        }
      } catch {
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId, goBack]);

  const handlePurchase = async () => {
    if (!product || !user) return;

    setPurchasing(true);
    try {
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, buyerId: user.id }),
      });
      const data = await res.json();

      if (data.success) {
        setPurchaseResult(data.purchase);
        setShowSuccess(true);

        // Update user balance in store
        if (user) {
          const newBonus = Math.max(0, user.bonusBalance - data.purchase.usedBonus);
          const newReal = Math.max(0, user.realBalance - data.purchase.usedReal);
          setUser({ ...user, bonusBalance: newBonus, realBalance: newReal });
        }
      } else {
        toast.error(data.message || 'Erreur lors de l\'achat');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setPurchasing(false);
    }
  };

  const Icon = product
    ? (CATEGORY_ICONS[product.category] || Package)
    : Package;
  const gradient = product
    ? CATEGORY_GRADIENTS[product.category] || CATEGORY_GRADIENTS.default
    : CATEGORY_GRADIENTS.default;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-lg font-semibold">Détails du produit</h1>
          </div>
        </header>
        <div className="flex-1 px-4 py-4 space-y-4">
          <Skeleton className="w-full aspect-[4/3] rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold">Détails du produit</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Product image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full aspect-[4/3] bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}
        >
          <Icon className="size-20 text-white/80" />
        </motion.div>

        {/* Product info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 shrink-0">
              {product.category}
            </Badge>
          </div>

          <p className="text-2xl font-bold text-emerald-600">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </motion.div>

        {/* Seller info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="size-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {product.seller?.name || product.seller?.pseudo || 'Anonyme'}
            </p>
            <p className="text-xs text-muted-foreground">Vendeur</p>
          </div>
        </motion.div>

        {/* Info notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800"
        >
          <Info className="size-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            Votre solde bonus sera utilisé en priorité lors de l&apos;achat.
          </p>
        </motion.div>

        {/* Purchase button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-2"
        >
          <Button
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <ShoppingCart className="size-5" />
                Acheter pour ${product.price.toFixed(2)}
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-center">Achat réussi !</DialogTitle>
            <DialogDescription className="text-center">
              Votre achat a été effectué avec succès.
            </DialogDescription>
          </DialogHeader>

          {purchaseResult && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  ${purchaseResult.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solde bonus utilisé</span>
                <span className="font-medium text-emerald-600">
                  ${purchaseResult.usedBonus.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solde réel utilisé</span>
                <span className="font-medium">
                  ${purchaseResult.usedReal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setShowSuccess(false);
                goBack();
              }}
            >
              Retour au Marketplace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
