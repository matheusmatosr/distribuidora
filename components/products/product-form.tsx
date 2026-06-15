"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CATEGORY_LABELS, UNIT_LABELS } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  product?: Product | null;
  defaultMinStock: number;
  onSaved: () => void;
  onCancel: () => void;
}

/** Formulário de cadastro/edição de produto, incluindo upload de foto. */
export function ProductForm({ product, defaultMinStock, onSaved, onCancel }: ProductFormProps) {
  const supabase = createClient();
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "cerveja");
  const [unit, setUnit] = useState(product?.unit ?? "unidade");
  const [salePrice, setSalePrice] = useState(product?.sale_price?.toString() ?? "");
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() ?? "");
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity?.toString() ?? "0");
  const [minStock, setMinStock] = useState(product?.min_stock?.toString() ?? String(defaultMinStock));
  const [photoUrl, setPhotoUrl] = useState<string | null>(product?.photo_url ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  async function uploadPhoto(userId: string): Promise<string | null> {
    if (!photoFile) return product?.photo_url ?? null;

    const ext = photoFile.name.split(".").pop();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-photos")
      .upload(path, photoFile, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const uploadedPhotoUrl = await uploadPhoto(userId);

      const payload = {
        name: name.trim(),
        category,
        unit,
        sale_price: Number(salePrice),
        cost_price: Number(costPrice || 0),
        stock_quantity: Number(stockQuantity || 0),
        min_stock: Number(minStock || 0),
        photo_url: uploadedPhotoUrl,
      };

      if (isEditing && product) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert({ ...payload, user_id: userId });
        if (insertError) throw insertError;
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {photoUrl ? (
            <Image src={photoUrl} alt="Foto do produto" width={64} height={64} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="text-xs text-muted-foreground">Sem foto</span>
          )}
        </div>
        <div className="flex-1">
          <Label htmlFor="photo">Foto do produto (opcional)</Label>
          <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nome do produto</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Skol Lata 350ml"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as Product["category"])}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="unit">Unidade</Label>
          <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as Product["unit"])}>
            {Object.entries(UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salePrice">Preço de venda (R$)</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            min="0"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="costPrice">Preço de custo (R$)</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stockQuantity">Quantidade em estoque</Label>
          <Input
            id="stockQuantity"
            type="number"
            step="1"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="minStock">Estoque mínimo</Label>
          <Input
            id="minStock"
            type="number"
            step="1"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
