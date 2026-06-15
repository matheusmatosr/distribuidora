"use client";

import { Beer } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

interface MobileHeaderProps {
  distributorName: string;
}

/** Cabeçalho fixo no topo, visível apenas em telas pequenas. */
export function MobileHeader({ distributorName }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/15">
          <Beer className="h-4 w-4 text-sidebar-primary" />
        </div>
        <span className="truncate text-sm font-semibold">{distributorName}</span>
      </div>
      <LogoutButton className="px-2" />
    </header>
  );
}
