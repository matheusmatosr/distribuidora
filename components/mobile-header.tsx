"use client";

import Link from "next/link";
import { Beer, Users } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

interface MobileHeaderProps {
  distributorName: string;
  isAdmin: boolean;
}

export function MobileHeader({ distributorName, isAdmin }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/15">
          <Beer className="h-4 w-4 text-sidebar-primary" />
        </div>
        <span className="truncate text-sm font-semibold">{distributorName}</span>
      </div>
      <div className="flex items-center gap-1">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1 rounded-md px-2 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Gerenciar Usuários"
          >
            <Users className="h-4 w-4" />
          </Link>
        )}
        <LogoutButton className="px-2" />
      </div>
    </header>
  );
}
