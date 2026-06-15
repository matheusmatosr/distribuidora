"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, UNIT_LABELS } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

/** Campo de busca com autocomplete por nome, otimizado para toque/mobile. */
export function ProductSearch({ products, onSelect }: ProductSearchProps) {
  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return [];
    return products.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 8);
  }, [products, term]);

  function handleSelect(product: Product) {
    onSelect(product);
    setTerm("");
    setFocused(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por nome..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="pl-9"
        />
      </div>

      {focused && term.trim() && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-card shadow-md">
          {matches.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          )}
          {matches.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              disabled={product.stock_quantity <= 0}
              className="flex w-full items-center justify-between gap-2 border-b p-3 text-left last:border-0 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {product.photo_url ? (
                    <Image
                      src={product.photo_url}
                      alt={product.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {UNIT_LABELS[product.unit]} · estoque: {product.stock_quantity}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold">{formatCurrency(product.sale_price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
