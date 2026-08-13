"use client";

import { useMemo, useState, useTransition } from "react";
import { promoteToAdmin, promoteToSuperAdmin, demoteAdmin, toggleAdminActive } from "@/lib/actions/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Power, PowerOff, Search, Shield, ShieldOff, Star, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";

export interface AdminManagedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string | Date;
  professionals: Array<{
    id: string;
    businessName: string | null;
  }>;
}

function getDisplayName(user: AdminManagedUser) {
  return user.displayName ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email);
}

function getRoleTags(user: AdminManagedUser) {
  const tags: Array<{ label: string; className: string; icon?: React.ComponentType<{ className?: string }> }> = [];

  tags.push({
    label: "Member",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    icon: UserRound,
  });

  if (user.professionals.length > 0) {
    tags.push({
      label: "Professional",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: Star,
    });
  }

  if (user.role === "ADMIN") {
    tags.push({
      label: "Admin",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Shield,
    });
  }

  if (user.role === "SUPER_ADMIN") {
    tags.push({
      label: "Super Admin",
      className: "bg-amber-100 text-amber-800 border-amber-200",
      icon: Crown,
    });
  }

  return tags;
}

function formatTorontoDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  }).format(new Date(date));
}

function UserActions({ user }: { user: AdminManagedUser }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"demote" | "suspend" | null>(null);
  const router = useRouter();

  function run(action: () => Promise<void>, successMessage?: string) {
    startTransition(async () => {
      try {
        await action();
        if (successMessage) {
          window.alert(successMessage);
        }
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  if (confirm === "demote") {
    return (
      <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-xs text-red-700">Remove elevated access for this user?</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => demoteAdmin(user.id), "Access level updated.")}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, remove"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (confirm === "suspend") {
    return (
      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">
          {user.isActive ? "Suspend this user account?" : "Reinstate this user account?"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={user.isActive ? "destructive" : "default"}
            disabled={pending}
            onClick={() => run(() => toggleAdminActive(user.id, !user.isActive), "Status updated.")}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.isActive ? "Suspend" : "Reinstate"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && (
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={pending}
          onClick={() => run(() => promoteToAdmin(user.id), "User is now an admin.")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
          Make Admin
        </Button>
      )}

      {user.role !== "SUPER_ADMIN" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => promoteToSuperAdmin(user.id), "User is now a super admin.")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5" />}
          Make Super Admin
        </Button>
      )}

      {user.role === "ADMIN" && (
        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setConfirm("demote")}>
          <ShieldOff className="h-3.5 w-3.5" />
          Remove Admin
        </Button>
      )}

      {user.role !== "SUPER_ADMIN" && (
        <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-800" onClick={() => setConfirm("suspend")}>
          {user.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          {user.isActive ? "Suspend" : "Reinstate"}
        </Button>
      )}
    </div>
  );
}

export function AdminManagementClient({ users }: { users: AdminManagedUser[] }) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((user) => {
      const tags = getRoleTags(user).map((tag) => tag.label.toLowerCase()).join(" ");
      const listings = user.professionals.map((professional) => professional.businessName ?? "").join(" ");
      return [
        getDisplayName(user),
        user.email,
        user.role,
        tags,
        listings,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [query, users]);

  const counts = {
    members: users.length,
    professionals: users.filter((user) => user.professionals.length > 0).length,
    admins: users.filter((user) => user.role === "ADMIN").length,
    superAdmins: users.filter((user) => user.role === "SUPER_ADMIN").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{counts.members}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400">Users</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">{counts.professionals}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400">Professionals</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{counts.admins}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400">Admins</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xl font-bold text-amber-700">{counts.superAdmins}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400">Super Admins</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users, email, listing, or role…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {getDisplayName(user).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{getDisplayName(user)}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Joined {formatTorontoDateTime(user.createdAt)} Toronto time
                    </p>
                  </div>
                  <Badge variant="outline" className={user.isActive ? "text-emerald-700" : "text-gray-500"}>
                    {user.isActive ? "Active" : "Suspended"}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {getRoleTags(user).map((tag) => {
                    const Icon = tag.icon;
                    return (
                      <span
                        key={`${user.id}-${tag.label}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tag.className}`}
                      >
                        {Icon ? <Icon className="h-3 w-3" /> : null}
                        {tag.label}
                      </span>
                    );
                  })}
                </div>

                {user.professionals.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Approved listings:</span>{" "}
                    {user.professionals.map((professional) => professional.businessName || "Unnamed listing").join(", ")}
                  </div>
                )}

                <div className="mt-4">
                  <UserActions user={user} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
            No users match that search.
          </div>
        )}
      </div>
    </div>
  );
}
