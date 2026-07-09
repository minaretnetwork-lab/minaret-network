"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMosque, updateMosque, toggleMosqueActive } from "@/lib/actions/mosques";
import { Building2, ExternalLink, ChevronDown, ChevronUp, Plus } from "lucide-react";

type Mosque = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  website: string | null;
  communityChannelType: string | null;
  communityChannelName: string | null;
  communityChannelLink: string | null;
  isActive: boolean;
  _count: { professionals: number };
};

const CHANNEL_TYPES = ["WhatsApp", "Telegram", "Facebook Group", "Discord", "Other"];

function MosqueForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Mosque>;
  onSave: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    address: initial?.address ?? "",
    website: initial?.website ?? "",
    communityChannelType: initial?.communityChannelType ?? "WhatsApp",
    communityChannelName: initial?.communityChannelName ?? "",
    communityChannelLink: initial?.communityChannelLink ?? "",
  });

  const inputClass = "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full";

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Mosque Name *</Label>
          <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Al-Falah Islamic Centre" />
        </div>
        <div>
          <Label>City</Label>
          <Input className="mt-1" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Keswick" />
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input className="mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Keswick, ON" />
      </div>
      <div>
        <Label>Mosque Website</Label>
        <Input className="mt-1" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://mosque.com" />
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Community Channel (used to verify affiliation)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Channel Type</Label>
            <select
              value={form.communityChannelType}
              onChange={(e) => setForm({ ...form, communityChannelType: e.target.value })}
              className={`mt-1 ${inputClass}`}
            >
              {CHANNEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Group Name</Label>
            <Input className="mt-1" value={form.communityChannelName} onChange={(e) => setForm({ ...form, communityChannelName: e.target.value })} placeholder="Al-Falah Community" />
          </div>
          <div>
            <Label>Invite Link</Label>
            <Input className="mt-1" type="url" value={form.communityChannelLink} onChange={(e) => setForm({ ...form, communityChannelLink: e.target.value })} placeholder="https://chat.whatsapp.com/…" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Admins will use this link to check if a professional is a member before confirming their affiliation badge.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-green-600 hover:bg-green-700 text-white">
          {saving ? "Saving…" : "Save Mosque"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function MosqueManagement({ mosques: initial }: { mosques: Mosque[] }) {
  const [mosques, setMosques] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleCreate(data: Record<string, string>) {
    await createMosque(data as Parameters<typeof createMosque>[0]);
    setAdding(false);
  }

  async function handleUpdate(id: string, data: Record<string, string>) {
    await updateMosque(id, data);
    setEditingId(null);
  }

  async function handleToggle(id: string, current: boolean) {
    setToggling(id);
    await toggleMosqueActive(id, !current);
    setToggling(null);
  }

  return (
    <div className="space-y-4">
      {/* Add new */}
      {adding ? (
        <div className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-green-600" /> Add Mosque
          </h3>
          <MosqueForm onSave={handleCreate} onCancel={() => setAdding(false)} />
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add Mosque
        </Button>
      )}

      {/* Mosque list */}
      {mosques.map((mosque) => (
        <div
          key={mosque.id}
          className={`bg-white dark:bg-gray-900 border rounded-xl p-5 ${
            mosque.isActive ? "border-gray-200 dark:border-gray-800" : "border-gray-100 dark:border-gray-900 opacity-60"
          }`}
        >
          {editingId === mosque.id ? (
            <>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Edit: {mosque.name}</h3>
              <MosqueForm
                initial={mosque}
                onSave={(data) => handleUpdate(mosque.id, data)}
                onCancel={() => setEditingId(null)}
              />
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{mosque.name}</h3>
                  {!mosque.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
                  )}
                  <span className="text-xs text-gray-400">{mosque._count.professionals} professional{mosque._count.professionals !== 1 ? "s" : ""}</span>
                </div>
                {mosque.city && <p className="text-sm text-gray-500 mt-0.5">{mosque.city}</p>}

                {/* Community channel */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {mosque.communityChannelName && (
                    <span className="text-xs text-gray-500">
                      {mosque.communityChannelType}: <span className="font-medium">{mosque.communityChannelName}</span>
                    </span>
                  )}
                  {mosque.communityChannelLink && (
                    <a
                      href={mosque.communityChannelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Open group
                    </a>
                  )}
                  {!mosque.communityChannelName && !mosque.communityChannelLink && (
                    <span className="text-xs text-amber-600">⚠ No community channel set — add one so admins can verify affiliations</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => setEditingId(mosque.id)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={toggling === mosque.id}
                  onClick={() => handleToggle(mosque.id, mosque.isActive)}
                  className={mosque.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}
                >
                  {mosque.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {mosques.length === 0 && !adding && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400">No mosques yet. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}
