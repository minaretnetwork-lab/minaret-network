"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/lib/actions/auth";
import { PhoneInput } from "@/components/ui/phone-input";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  whatsappSameAsPhone: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: { firstName: string; lastName: string; phone: string; whatsapp: string };
}

export function ProfileForm({ defaultValues }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const isSame = defaultValues.phone && defaultValues.phone === defaultValues.whatsapp;

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      whatsappSameAsPhone: !!isSame,
    },
  });

  const whatsappSameAsPhone = watch("whatsappSameAsPhone");
  const phone = watch("phone");

  function handleSameToggle(checked: boolean) {
    setValue("whatsappSameAsPhone", checked);
    if (checked) setValue("whatsapp", phone ?? "");
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("phone", e.target.value);
    if (whatsappSameAsPhone) setValue("whatsapp", e.target.value);
  }

  async function onSubmit(data: FormData) {
    try {
      await updateUserProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        whatsapp: data.whatsappSameAsPhone ? data.phone : data.whatsapp,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" {...register("firstName")} className="mt-1.5" />
            {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" {...register("lastName")} className="mt-1.5" />
            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <div className="mt-1.5">
            <PhoneInput
              id="phone"
              value={watch("phone") ?? ""}
              onChange={(val) => { setValue("phone", val); if (whatsappSameAsPhone) setValue("whatsapp", val); }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>WhatsApp Number</Label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
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
              value={watch("whatsapp") ?? ""}
              onChange={(val) => setValue("whatsapp", val)}
            />
          )}
        </div>

        {status === "success" && (
          <p className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            ✅ Profile updated successfully
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Something went wrong. Please try again.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
