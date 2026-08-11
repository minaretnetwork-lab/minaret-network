"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ContactGateModalProps {
  professionalId: string;
  professionalName: string;
  trigger: React.ReactNode;
  mode?: "contact" | "message";
  location?: string;
}

export function ContactGateModal({ professionalId, professionalName, trigger, mode = "contact", location = "" }: ContactGateModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [issueError, setIssueError] = useState("");
  const redirectTo = encodeURIComponent(`/professionals/${professionalId}`);
  const isMessage = mode === "message";

  function storePendingChat() {
    if (!isMessage) return true;

    const trimmedIssue = issue.trim();
    if (trimmedIssue.length < 8) {
      setIssueError("Add a few words about what you need help with first.");
      return false;
    }

    window.sessionStorage.setItem(
      "minaret_ai_pending_chat",
      JSON.stringify({ professionalId, issue: trimmedIssue, location })
    );
    return true;
  }

  function goToAuth(path: "login" | "signup") {
    if (!storePendingChat()) return;

    if (path === "login") {
      router.push(`/auth/login?redirectTo=${redirectTo}`);
      return;
    }

    router.push("/auth/signup");
  }

  return (
    <>
      <div
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            data-modal-content
          >
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
                {isMessage
                  ? "Tell them what you need help with. After sign-in, we'll open the chat for you."
                  : "Create a free account to contact professionals on Minaret Network."}
              </p>

              {isMessage && (
                <div className="mb-5 text-left">
                  <Textarea
                    value={issue}
                    onChange={(event) => {
                      setIssue(event.target.value);
                      setIssueError("");
                    }}
                    placeholder="e.g. I need help setting up Wi‑Fi for our office."
                    className="min-h-24"
                  />
                  {issueError && <p className="mt-2 text-xs text-red-600">{issueError}</p>}
                </div>
              )}

              <div className="space-y-2.5">
                <Button
                  type="button"
                  onClick={() => goToAuth("signup")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-medium"
                >
                  Create a free account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToAuth("login")}
                  className="w-full h-11 border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  I already have an account
                </Button>
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
