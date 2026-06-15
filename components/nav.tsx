"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  BarChart3,
  Settings,
  Beer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/vendas", label: "Vender", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Config.", icon: Settings },
];

// Itens exibidos na barra inferior (mobile). Mantemos só os mais usados
// para que o registro de venda esteja sempre a 1 toque de distância.
const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

interface NavProps {
  distributorName: string;
}

export function Nav({ distributorName }: NavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar - desktop */}
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/15">
            <Beer className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{distributorName}</p>
            <p className="text-xs text-sidebar-foreground/60">StockBebidas</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <LogoutButton />
        </div>
      </aside>

      {/* Bottom nav - mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-sidebar-border bg-sidebar md:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-sidebar-primary" : "text-sidebar-foreground/60"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
