"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  supabaseId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  whatsapp: string | null;
  preferredContact: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  professionals: Array<{
    id: string;
    businessName: string | null;
    title: string | null;
    status: string;
    profileViews: number;
    category: { name: string };
  }>;
  openRequests: number;
  openConversations: number;
  _count: {
    professionals: number;
    serviceRequests: number;
    requesterConversations: number;
    sentMessages: number;
    recommendations: number;
    categorySuggestions: number;
  };
};

const ROLE_OPTIONS = ["ALL", "MEMBER", "PROFESSIONAL", "ADMIN", "SUPER_ADMIN"];

type SortKey = "user" | "role" | "contact" | "listings" | "requests" | "messages" | "joined" | "activity";
type SortDirection = "asc" | "desc";

const ROLE_BADGE: Record<string, string> = {
  MEMBER: "bg-gray-100 text-gray-700 border-gray-200",
  PROFESSIONAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  SUPER_ADMIN: "bg-amber-100 text-amber-800 border-amber-200",
};

function formatTorontoDateTime(date: Date | string) {
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

function displayName(user: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return user.displayName ?? (fullName || user.email);
}

function normalize(value: string | null | undefined) {
  return value?.toLowerCase().trim() ?? "";
}

function hasApprovedProfessionalListing(user: AdminUserRow) {
  return user.professionals.some((professional) => professional.status === "APPROVED");
}

function displayedRoles(user: AdminUserRow) {
  const hasProfessionalRole = hasApprovedProfessionalListing(user);
  const primaryRole = user.role === "MEMBER" && hasProfessionalRole ? "PROFESSIONAL" : user.role;
  return hasProfessionalRole && primaryRole !== "PROFESSIONAL"
    ? [primaryRole, "PROFESSIONAL"]
    : [primaryRole];
}

function sortValue(user: AdminUserRow, key: SortKey): string | number {
  switch (key) {
    case "user":
      return normalize(displayName(user));
    case "role":
      return displayedRoles(user).join(" ");
    case "contact":
      return normalize(user.phone || user.whatsapp || user.email);
    case "listings":
      return user._count.professionals;
    case "requests":
      return user._count.serviceRequests;
    case "messages":
      return user._count.sentMessages;
    case "joined":
      return new Date(user.createdAt).getTime();
    case "activity":
      return new Date(user.lastActivityAt).getTime();
  }
}

function SortableColumnHeader({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey | null;
  sortDirection: SortDirection;
  onSort: (column: SortKey) => void;
}) {
  const active = sortKey === column;
  const SortIcon = active ? (sortDirection === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      className="px-4 py-3 font-semibold"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="group inline-flex items-center gap-1.5 rounded-sm text-left transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        title={`Sort ${label} ${active && sortDirection === "asc" ? "descending" : "ascending"}`}
      >
        <span>{label}</span>
        <SortIcon className={`h-3.5 w-3.5 ${active ? "text-emerald-600" : "text-gray-300 group-hover:text-emerald-500"}`} />
      </button>
    </th>
  );
}

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(column: SortKey) {
    if (sortKey === column) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(column);
    setSortDirection("asc");
  }

  const filteredUsers = useMemo(() => {
    const needle = normalize(query);

    const matches = users.filter((user) => {
      const userRoles = displayedRoles(user);
      const matchesRole = role === "ALL" || userRoles.includes(role);
      if (!matchesRole) return false;
      if (!needle) return true;

      const listingText = user.professionals
        .map((professional) => [
          professional.businessName,
          professional.title,
          professional.status,
          professional.category.name,
        ].filter(Boolean).join(" "))
        .join(" ");

      return [
        displayName(user),
        user.email,
        user.phone,
        user.whatsapp,
        user.preferredContact,
        user.role,
        ...userRoles,
        listingText,
        user.supabaseId,
      ].some((value) => normalize(value).includes(needle));
    });

    if (!sortKey) return matches;

    return [...matches].sort((left, right) => {
      const leftValue = sortValue(left, sortKey);
      const rightValue = sortValue(right, sortKey);
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), "en-CA", { numeric: true, sensitivity: "base" });
      if (comparison !== 0) return sortDirection === "asc" ? comparison : -comparison;
      return displayName(left).localeCompare(displayName(right), "en-CA", { sensitivity: "base" });
    });
  }, [query, role, sortDirection, sortKey, users]);

  const activeCount = filteredUsers.filter((user) => user.isActive).length;
  const professionalCount = filteredUsers.filter(hasApprovedProfessionalListing).length;
  const adminCount = filteredUsers.filter((user) => user.role === "ADMIN" || user.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registered accounts, contact details, roles, and activity signals.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{filteredUsers.length}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Shown</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{professionalCount}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Pros</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{adminCount}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Admins</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, phone, listing..."
            className="h-10 pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => {
            const active = role === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                  active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300",
                ].join(" ")}
              >
                {option === "ALL" ? "All roles" : option.replace("_", " ")}
              </button>
            );
          })}
          {(query || role !== "ALL") && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setRole("ALL");
              }}
              className="rounded-full"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <UserRound className="mx-auto mb-3 h-9 w-9 text-gray-300" />
          <p className="text-sm text-gray-400">
            No users match{query ? ` “${query}”` : " this filter"}.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-[1260px] w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
                <tr>
                  <SortableColumnHeader label="User" column="user" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Role" column="role" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Contact" column="contact" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Listings" column="listings" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Requests" column="requests" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Messages" column="messages" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Joined" column="joined" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableColumnHeader label="Last activity" column="activity" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => {
                  const name = displayName(user);
                  const primaryListing = user.professionals[0];
                  const totalProfileViews = user.professionals.reduce((sum, professional) => sum + professional.profileViews, 0);
                  const userRoles = displayedRoles(user);

                  return (
                    <tr key={user.id} className="align-top transition hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            {name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                            <p className="truncate text-xs text-gray-500">{user.email}</p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              ID {user.supabaseId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {userRoles.map((userRole) => (
                              <span
                                key={userRole}
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[userRole] ?? ROLE_BADGE.MEMBER}`}
                              >
                                {userRole.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className={user.isActive ? "text-emerald-700" : "text-gray-500"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {user.emailVerified && (
                              <Badge variant="outline" className="gap-1 text-blue-700">
                                <ShieldCheck className="h-3 w-3" />
                                Provider verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                          <p>Phone: {user.phone || "—"}</p>
                          <p>WhatsApp: {user.whatsapp || "—"}</p>
                          <p className="text-gray-400">Prefers {user.preferredContact?.toLowerCase() ?? "not set"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{user._count.professionals}</p>
                          {primaryListing ? (
                            <div className="text-xs text-gray-500">
                              <p className="max-w-44 truncate">{primaryListing.businessName ?? primaryListing.title ?? primaryListing.category.name}</p>
                              <p>{primaryListing.status} · {totalProfileViews} views</p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No listings</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user._count.serviceRequests}</p>
                          <p>{user.openRequests} open</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user._count.sentMessages}</p>
                          <p>{user.openConversations} open chats</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        <p>{formatTorontoDateTime(user.createdAt)}</p>
                        <p className="mt-1 text-gray-400">Toronto time</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        <p>{formatTorontoDateTime(user.lastActivityAt)}</p>
                        <p className="mt-1 text-gray-400">Toronto time</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {activeCount < filteredUsers.length && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
              Showing {filteredUsers.length} users, including {filteredUsers.length - activeCount} inactive account{filteredUsers.length - activeCount === 1 ? "" : "s"}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
