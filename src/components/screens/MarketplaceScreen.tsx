'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Package,
  Palette,
  LayoutTemplate,
  Wrench,
  MonitorSmartphone,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

const CATEGORIES = [
  { key: '', label: 'Tout', icon: ShoppingBag },
  { key: 'design', label: 'Design', icon: Palette },
  { key: 'template', label: 'Templates', icon: LayoutTemplate },
  { key: 'service', label: 'Services', icon: Wrench },
  { key: 'digital_product', label: 'Digital', icon: MonitorSmartphone },
];

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

export default function MarketplaceScreen() {
  const { navigateTo } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const url = activeCategory
        ? `/api/marketplace/products?category=${activeCategory}`
        : '/api/marketplace/products';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    );
  }, [search, products]);

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.key === category);
    return cat ? cat.icon : Package;
  };

  const getGradient = (category: string) =>
    CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.default;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('home')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <ShoppingCart className="size-5 text-emerald-600" />
            <h1 className="text-lg font-semibold">Marketplace</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="size-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Aucun produit</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search
                ? 'Aucun produit ne correspond à votre recherche'
                : 'Aucun produit disponible dans cette catégorie'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product, index) => {
                const Icon = getCategoryIcon(product.category);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Image placeholder */}
                      <div
                        className={`aspect-square bg-gradient-to-br ${getGradient(
                          product.category
                        )} flex items-center justify-center relative cursor-pointer`}
                        onClick={() =>
                          navigateTo('marketplace-detail', {
                            productId: product.id,
                          })
                        }
                      >
                        <Icon className="size-10 text-white/80" />
                        <Badge className="absolute top-2 right-2 bg-white/20 text-white border-0 text-[10px] backdrop-blur-sm">
                          {product.category}
                        </Badge>
                      </div>

                      <div className="p-3 space-y-2">
                        <h3 className="font-medium text-sm leading-tight line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-emerald-600 font-bold text-base">
                          ${product.price.toFixed(2)}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          par {product.seller?.name || product.seller?.pseudo || 'Anonyme'}
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() =>
                            navigateTo('marketplace-detail', {
                              productId: product.id,
                            })
                          }
                        >
                          Acheter
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
