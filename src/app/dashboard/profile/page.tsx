"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        reset({
          firstName: user.user_metadata.first_name ?? "",
          lastName: user.user_metadata.last_name ?? "",
          phone: user.user_metadata.phone ?? "",
        });
      }
      setLoading(false);
    });
  }, [reset]);

  async function onSubmit(data: FormData) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          full_name: `${data.firstName} ${data.lastName}`,
        },
      });
      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (loading) {
    return <div className="h-32 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} className="mt-1.5" />
              {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} className="mt-1.5" />
              {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" {...register("phone")} className="mt-1.5" placeholder="+1 416 555 0000" />
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
    </div>
  );
}
