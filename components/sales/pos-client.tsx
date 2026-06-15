"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductSearch } from "@/components/sales/product-search";
import { formatCurrency, PAYMENT_LABELS } from "@/lib/utils";
import type { PaymentMethod, Product } from "@/lib/types";

interface CartItem {
  product: Product;
  quantity: number;
}

interface PosClientProps {
  products: Product[];
}

export function PosClient({ products }: PosClientProps) {
  const supabase = createClient();
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [cart]
  );

  function addProduct(product: Product) {
    setSuccess(false);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.product.stock_quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const next = Math.min(
            Math.max(item.quantity + delta, 1),
            item.product.stock_quantity
          );
          return { ...item, quantity: next };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  async function handleFinish() {
    if (cart.length === 0) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase.rpc("create_sale", {
      p_customer_name: customerName.trim() || null,
      p_payment_method: paymentMethod,
      p_items: cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setCart([]);
    setCustomerName("");
    setPaymentMethod("dinheiro");
    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="space-y-4 p-4 pt-6 md:p-6 md:pt-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova venda</h1>
        <p className="text-sm text-muted-foreground">Busque o produto, ajuste a quantidade e finalize</p>
      </div>

      <ProductSearch products={products} onSelect={addProduct} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Itens da venda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum produto adicionado ainda.
            </p>
          )}

          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                {item.product.photo_url ? (
                  <Image
                    src={item.product.photo_url}
                    alt={item.product.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.product.sale_price)} cada
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.product.id, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.product.id, 1)}
                  disabled={item.quantity >= item.product.stock_quantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <p className="w-20 shrink-0 text-right text-sm font-semibold">
                {formatCurrency(item.product.sale_price * item.quantity)}
              </p>

              <button
                onClick={() => removeItem(item.product.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remover ${item.product.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div>
            <Label htmlFor="customerName">Cliente (opcional)</Label>
            <Input
              id="customerName"
              placeholder="Nome do cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Forma de pagamento</Label>
            <Select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-base font-medium">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Venda registrada com sucesso!</p>}

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || saving}
            onClick={handleFinish}
          >
            {saving ? "Finalizando..." : "Finalizar venda"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
