"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ReConsentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
    >
      {pending ? "Saving…" : "Accept and Continue"}
    </Button>
  );
}
