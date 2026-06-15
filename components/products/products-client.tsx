"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ProductForm } from "@/components/products/product-form";
import { CATEGORY_COLORS, CATEGORY_LABELS, UNIT_LABELS, formatCurrency, groupByCategory } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductsClientProps {
  initialProducts: Product[];
  defaultMinStock: number;
}

export function ProductsClient({ initialProducts, defaultMinStock }: ProductsClientProps) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, search]);

  const groupedProducts = useMemo(() => groupByCategory(filteredProducts), [filteredProducts]);

  async function refreshProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });
    setProducts((data ?? []) as Product[]);
  }

  function openCreateModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleSaved() {
    setModalOpen(false);
    setEditingProduct(null);
    await refreshProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Excluir o produto "${product.name}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setDeletingId(product.id);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setDeletingId(null);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  return (
    <div className="space-y-4 p-4 pt-6 md:p-6 md:pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

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
        {groupedProducts.map(({ category, items }) => (
          <div key={category} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => {
                const isLowStock = product.stock_quantity <= product.min_stock;
                return (
                  <Card key={product.id}>
                    <CardContent className="flex gap-3 p-4 sm:p-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
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

                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium leading-tight">{product.name}</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(product)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              aria-label={`Editar ${product.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              disabled={deletingId === product.id}
                              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Excluir ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <Badge className={CATEGORY_COLORS[product.category]}>{CATEGORY_LABELS[product.category]}</Badge>
                          <Badge variant="outline">{UNIT_LABELS[product.unit]}</Badge>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-sm font-semibold">{formatCurrency(product.sale_price)}</p>
                          <p className={`text-sm ${isLowStock ? "font-semibold text-amber-600" : "text-muted-foreground"}`}>
                            Estoque: {product.stock_quantity}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Editar produto" : "Novo produto"}
      >
        <ProductForm
          product={editingProduct}
          defaultMinStock={defaultMinStock}
          onSaved={handleSaved}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
