"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteCurrentUserAccount, updateUserProfile } from "@/lib/actions/auth";
import { PhoneInput } from "@/components/ui/phone-input";

interface Props {
  defaultValues: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    whatsapp: string;
    preferredContact?: "EMAIL" | "PHONE" | "WHATSAPP";
  };
}

export function ProfileForm({ defaultValues }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "error">("idle");
  const [deleteError, setDeleteError] = useState("");
  const [firstName, setFirstName] = useState(defaultValues.firstName);
  const [lastName, setLastName] = useState(defaultValues.lastName);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [whatsapp, setWhatsapp] = useState(defaultValues.whatsapp);
  const [preferredContact, setPreferredContact] = useState<Props["defaultValues"]["preferredContact"]>(defaultValues.preferredContact);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(
    !!defaultValues.phone && defaultValues.phone === defaultValues.whatsapp
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  useEffect(() => {
    setFirstName(defaultValues.firstName);
    setLastName(defaultValues.lastName);
    setPhone(defaultValues.phone);
    setWhatsapp(defaultValues.whatsapp);
    setPreferredContact(defaultValues.preferredContact);
    setWhatsappSameAsPhone(!!defaultValues.phone && defaultValues.phone === defaultValues.whatsapp);
  }, [defaultValues]);

  function handleSameToggle(checked: boolean) {
    setWhatsappSameAsPhone(checked);
    if (checked) setWhatsapp(phone ?? "");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const nextErrors: { firstName?: string; lastName?: string } = {};

    if (!trimmedFirstName) nextErrors.firstName = "First name is required";
    if (!trimmedLastName) nextErrors.lastName = "Last name is required";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await updateUserProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phone,
        whatsapp: whatsappSameAsPhone ? phone : whatsapp,
        preferredContact,
      });
      setStatus("success");
      setErrors({});
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setDeleteStatus("idle");
      setDeleteError("");
      await deleteCurrentUserAccount(deleteConfirm);
      window.location.href = "/?account=deleted";
    } catch (err) {
      setDeleteStatus("error");
      setDeleteError(err instanceof Error ? err.message : "Could not delete your account. Please try again.");
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1.5"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1.5"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="accountEmail">Login Email</Label>
            <Input
              id="accountEmail"
              type="email"
              value={defaultValues.email}
              readOnly
              className="mt-1.5 bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-300"
            />
            <p className="mt-1 text-xs text-gray-400">This is the email used to sign in to your account.</p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="mt-1.5">
              <PhoneInput
                id="phone"
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (whatsappSameAsPhone) setWhatsapp(val);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <label className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={whatsappSameAsPhone}
                onChange={(e) => handleSameToggle(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Same as phone number</span>
            </label>
            {!whatsappSameAsPhone && (
              <PhoneInput
                value={whatsapp}
                onChange={(val) => setWhatsapp(val)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Default preferred contact method</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                ["EMAIL", "Email"],
                ["PHONE", "Phone call"],
                ["WHATSAPP", "WhatsApp"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreferredContact(value as "EMAIL" | "PHONE" | "WHATSAPP")}
                  className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                    preferredContact === value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Used to prefill future service requests.</p>
          </div>

          {status === "success" && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20">
              Profile updated successfully
            </p>
          )}
          {status === "error" && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              Something went wrong. Please try again.
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="bg-green-600 text-white hover:bg-green-700">
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>

      <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/20">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-red-800/80 dark:text-red-200/80">
          This permanently removes your account, professional listings, service requests, and message history from Minaret Network.
          You will be signed out after deletion.
        </p>

        <div className="mt-4 space-y-2">
          <Label htmlFor="deleteConfirm" className="text-red-950 dark:text-red-100">
            Type DELETE to confirm
          </Label>
          <Input
            id="deleteConfirm"
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            className="bg-white dark:bg-gray-950"
            autoComplete="off"
          />
        </div>

        {deleteStatus === "error" && (
          <p className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {deleteError}
          </p>
        )}

        <Button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== "DELETE"}
          className="mt-4 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete my account
        </Button>
      </section>
    </div>
  );
}
