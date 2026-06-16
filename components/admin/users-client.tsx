"use client";

import { useState, useTransition } from "react";
import { approveUser, rejectUser } from "@/app/(app)/admin/actions";
import { UserStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Users, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserRow {
  id: string;
  distributor_name: string;
  status: UserStatus;
  is_admin: boolean;
  created_at: string;
  email: string;
}

interface UsersClientProps {
  users: UserRow[];
}

type Tab = "pending" | "approved" | "rejected";

const TAB_CONFIG: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "approved", label: "Aprovados", icon: UserCheck },
  { key: "rejected", label: "Rejeitados", icon: UserX },
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface UserCardProps {
  user: UserRow;
  onApprove?: () => void;
  onReject?: () => void;
  loading: boolean;
}

function UserCard({ user, onApprove, onReject, loading }: UserCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {initials(user.distributor_name || user.email)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.distributor_name || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">Cadastro: {formatDate(user.created_at)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {onApprove && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
            onClick={onApprove}
            disabled={loading}
          >
            <Check className="h-3.5 w-3.5" />
            Aprovar
          </Button>
        )}
        {onReject && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onReject}
            disabled={loading}
          >
            <X className="h-3.5 w-3.5" />
            Rejeitar
          </Button>
        )}
      </div>
    </div>
  );
}

export function UsersClient({ users }: UsersClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [isPending, startTransition] = useTransition();
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const byStatus = {
    pending: users.filter((u) => u.status === "pending" && !u.is_admin),
    approved: users.filter((u) => u.status === "approved"),
    rejected: users.filter((u) => u.status === "rejected"),
  };

  function handleApprove(userId: string) {
    setActionUserId(userId);
    startTransition(async () => {
      await approveUser(userId);
      setActionUserId(null);
    });
  }

  function handleReject(userId: string) {
    setActionUserId(userId);
    startTransition(async () => {
      await rejectUser(userId);
      setActionUserId(null);
    });
  }

  const visibleUsers = byStatus[activeTab];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
          const count = byStatus[key].length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    key === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : key === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {visibleUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhum usuário nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              loading={isPending && actionUserId === user.id}
              onApprove={
                user.status !== "approved"
                  ? () => handleApprove(user.id)
                  : undefined
              }
              onReject={
                user.status !== "rejected"
                  ? () => handleReject(user.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
