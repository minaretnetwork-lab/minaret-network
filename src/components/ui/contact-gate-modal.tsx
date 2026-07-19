"use client";

import { useState } from "react";
import Link from "next/link";
import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactGateModalProps {
  professionalId: string;
  professionalName: string;
  trigger: React.ReactNode;
}

export function ContactGateModal({ professionalId, professionalName, trigger }: ContactGateModalProps) {
  const [open, setOpen] = useState(false);
  const redirectTo = encodeURIComponent(`/professionals/${professionalId}`);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Connect with {professionalName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Create a free account to contact professionals on Minaret Network.
              </p>

              <div className="space-y-2.5">
                <Link href={`/auth/signup`} className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-medium">
                    Create a free account
                  </Button>
                </Link>
                <Link href={`/auth/login?redirectTo=${redirectTo}`} className="block">
                  <Button variant="outline" className="w-full h-11 border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300">
                    I already have an account
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Free to join · No spam · Mosque community only
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
