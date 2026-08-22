"use client";

import { Phone, Mail, Globe, MessageCircle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactGateModal } from "@/components/ui/contact-gate-modal";
import { incrementContactClick } from "@/lib/actions/sponsored";

interface Props {
  professionalId: string;
  professionalName: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  websiteLabel?: string | null;
  whatsapp?: string | null;
  whatsappHref?: string | null;
  isLoggedIn: boolean;
  existingConversationId?: string | null;
}

function track(professionalId: string, type: "phone" | "email" | "whatsapp") {
  const key = `contact_click_${professionalId}_${type}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}
  incrementContactClick(professionalId, type).catch(() => {});
}

export function ContactLinks({
  professionalId,
  professionalName,
  phone,
  email,
  website,
  websiteLabel,
  whatsapp,
  whatsappHref,
  isLoggedIn,
  existingConversationId,
}: Props) {
  return (
    <>
      <div className="mt-5 space-y-2">
        {phone && (
          isLoggedIn ? (
            <a
              href={`tel:${phone}`}
              onClick={() => track(professionalId, "phone")}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-700 w-full justify-center"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              {phone}
            </a>
          ) : (
            <a href={`/auth/login?redirectTo=/professionals/${professionalId}`} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 w-full justify-center">
              <Lock className="h-4 w-4 flex-shrink-0" />
              Sign in to see phone
            </a>
          )
        )}
        {email && (
          isLoggedIn ? (
            <a
              href={`mailto:${email}`}
              onClick={() => track(professionalId, "email")}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-700 w-full justify-center break-all"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              {email}
            </a>
          ) : (
            <a href={`/auth/login?redirectTo=/professionals/${professionalId}`} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 w-full justify-center">
              <Lock className="h-4 w-4 flex-shrink-0" />
              Sign in to see email
            </a>
          )
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-700 w-full justify-center">
            <Globe className="h-4 w-4 flex-shrink-0" />
            {websiteLabel ?? website}
          </a>
        )}
      </div>

      {whatsapp && (
        isLoggedIn ? (
          <a
            href={whatsappHref ?? `https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(professionalId, "whatsapp")}
            className="mt-4 flex"
          >
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
        ) : (
          <div className="mt-4">
            <ContactGateModal
              professionalId={professionalId}
              professionalName={professionalName}
              trigger={
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              }
            />
          </div>
        )
      )}

      {isLoggedIn && existingConversationId && (
        <Link href={`/dashboard/messages/${existingConversationId}`} className="mt-2 flex">
          <Button variant="outline" className="w-full gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <MessageCircle className="h-4 w-4" />
            Continue chat
          </Button>
        </Link>
      )}
    </>
  );
}
