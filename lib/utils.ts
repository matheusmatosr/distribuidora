import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductCategory } from "./types";

/** Combina classes do Tailwind evitando conflitos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Agrupa itens por categoria, na ordem definida em CATEGORY_LABELS. */
export function groupByCategory<T extends { category: ProductCategory }>(
  items: T[]
): { category: ProductCategory; items: T[] }[] {
  const groups = new Map<ProductCategory, T[]>();
  for (const item of items) {
    const list = groups.get(item.category);
    if (list) {
      list.push(item);
    } else {
      groups.set(item.category, [item]);
    }
  }
  return (Object.keys(CATEGORY_LABELS) as ProductCategory[])
    .filter((category) => groups.has(category))
    .map((category) => ({ category, items: groups.get(category)! }));
}

/** Formata um número como moeda brasileira (R$). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata uma data ISO para o formato dd/mm/aaaa. */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Formata uma data ISO para o formato dd/mm/aaaa hh:mm. */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Rótulos amigáveis para as categorias de produto. */
export const CATEGORY_LABELS: Record<string, string> = {
  cerveja: "Cerveja",
  refrigerante: "Refrigerante",
  agua: "Água",
  suco: "Suco",
  vinho: "Vinho",
  destilado: "Destilado",
  outros: "Outros",
};

/** Cores por categoria de produto, usadas nos badges. */
export const CATEGORY_COLORS: Record<string, string> = {
  cerveja: "border-transparent bg-amber-100 text-amber-800",
  refrigerante: "border-transparent bg-red-100 text-red-800",
  agua: "border-transparent bg-sky-100 text-sky-800",
  suco: "border-transparent bg-orange-100 text-orange-800",
  vinho: "border-transparent bg-purple-100 text-purple-800",
  destilado: "border-transparent bg-yellow-100 text-yellow-900",
  outros: "border-transparent bg-slate-100 text-slate-800",
};

/** Rótulos amigáveis para as unidades de produto. */
export const UNIT_LABELS: Record<string, string> = {
  unidade: "Unidade",
  pack6: "Pack c/ 6",
  pack12: "Pack c/ 12",
  fardo: "Fardo",
  garrafa: "Garrafa",
  lata: "Lata",
};

/** Rótulos amigáveis para as formas de pagamento. */
export const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
};
