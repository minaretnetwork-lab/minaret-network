"use client";

import { useState, useTransition, useRef } from "react";
import { promoteToAdmin, demoteAdmin, toggleAdminActive, searchUsers } from "@/lib/actions/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, ShieldOff, PowerOff, Power, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  role: string;
  isActive: boolean;
}

interface SearchUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  role: string;
}

function RowActions({ admin }: { admin: AdminUser }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"demote" | "suspend" | null>(null);
  const router = useRouter();

  function act(fn: () => Promise<void>) {
    startTransition(async () => {
      try { await fn(); router.refresh(); } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    });
  }

  if (confirm === "demote") return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs text-gray-500">Remove admin access?</span>
      <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={pending} onClick={() => act(() => demoteAdmin(admin.id))}>
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, remove"}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirm(null)}>Cancel</Button>
    </div>
  );

  if (confirm === "suspend") return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs text-gray-500">{admin.isActive ? "Suspend this admin?" : "Reinstate this admin?"}</span>
      <Button size="sm" variant={admin.isActive ? "destructive" : "default"} className="h-7 text-xs" disabled={pending}
        onClick={() => act(() => toggleAdminActive(admin.id, !admin.isActive))}>
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : admin.isActive ? "Suspend" : "Reinstate"}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirm(null)}>Cancel</Button>
    </div>
  );

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="sm" variant="ghost"
        className="h-7 text-xs text-gray-500 hover:text-amber-600 gap-1"
        onClick={() => setConfirm("suspend")}
      >
        {admin.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
        {admin.isActive ? "Suspend" : "Reinstate"}
      </Button>
      <Button
        size="sm" variant="ghost"
        className="h-7 text-xs text-gray-500 hover:text-red-600 gap-1"
        onClick={() => setConfirm("demote")}
      >
        <ShieldOff className="h-3.5 w-3.5" />
        Remove
      </Button>
    </div>
  );
}

function AddAdmin() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(val: string) {
    setQuery(val);
    setSuccess(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsers(val);
        setResults(res);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  async function handlePromote(user: SearchUser) {
    setPromoting(user.id);
    try {
      await promoteToAdmin(user.id);
      setSuccess(`${user.displayName ?? user.email} is now an admin.`);
      setQuery("");
      setResults([]);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setPromoting(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />}
      </div>

      {success && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          ✓ {success}
        </p>
      )}

      {results.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {results.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {((u.displayName ?? u.firstName ?? u.email ?? "?")?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {u.displayName ?? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.email)}
                </p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-shrink-0"
                disabled={promoting === u.id}
                onClick={() => handlePromote(u)}
              >
                {promoting === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Make Admin
              </Button>
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-3">No users found matching &quot;{query}&quot;</p>
      )}
    </div>
  );
}

export const AdminsClient = { RowActions, AddAdmin };
