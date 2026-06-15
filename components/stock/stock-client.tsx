"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ClipboardList, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, CATEGORY_LABELS, UNIT_LABELS, cn, groupByCategory } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface StockClientProps {
  products: Product[];
}

export function StockClient({ products }: StockClientProps) {
  const [search, setSearch] = useState("");
  const [showShoppingList, setShowShoppingList] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, search]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock_quantity <= p.min_stock),
    [products]
  );

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  return (
    <div className="space-y-4 p-4 pt-6 md:p-6 md:pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produto(s) · {lowStockProducts.length} com estoque baixo
          </p>
        </div>
        <Button
          variant={showShoppingList ? "default" : "outline"}
          className="gap-2"
          onClick={() => setShowShoppingList((v) => !v)}
          disabled={lowStockProducts.length === 0}
        >
          <ClipboardList className="h-4 w-4" />
          Lista de compras
        </Button>
      </div>

      {showShoppingList && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Sugestão de compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts.map((product) => {
              const suggested = Math.max(product.min_stock * 2 - product.stock_quantity, product.min_stock);
              return (
                <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Atual: {product.stock_quantity} · Mínimo: {product.min_stock}
                    </p>
                  </div>
                  <Badge variant="warning">
                    Comprar {suggested} {UNIT_LABELS[product.unit]}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-6">
        {grouped.map(({ category, items }) => (
          <div key={category} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {items.map((product) => {
                const isLowStock = product.stock_quantity <= product.min_stock;
                return (
                  <Card key={product.id} className={cn(isLowStock && "border-amber-300 bg-amber-50")}>
                    <CardContent className="flex items-center gap-3 p-4 sm:p-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted sm:h-24 sm:w-24">
                        {product.photo_url ? (
                          <Image
                            src={product.photo_url}
                            alt={product.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isLowStock && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />}
                          <p className="truncate font-medium">{product.name}</p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge className={CATEGORY_COLORS[product.category]}>{CATEGORY_LABELS[product.category]}</Badge>
                          <Badge variant="outline">{UNIT_LABELS[product.unit]}</Badge>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn("text-lg font-bold", isLowStock && "text-amber-600")}>
                          {product.stock_quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">mín: {product.min_stock}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
}
