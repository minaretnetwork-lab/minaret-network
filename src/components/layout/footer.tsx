import Link from "next/link";
import { MinaretLogo } from "@/components/ui/minaret-logo";

export function Footer() {
  return (
    <footer className="bg-[#0a2e1a] text-white/60 mt-auto">
      <div className="container mx-auto px-4 lg:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-5">
              <MinaretLogo />
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-white/50">
              Connecting mosque communities with community-affiliated professionals across the GTA.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-lora)" }}>Find help</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/professionals", label: "All Professionals" },
                { href: "/categories", label: "Browse Categories" },
                { href: "/request", label: "Request a Professional" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-lora)" }}>Join us</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/professionals/register", label: "Register as Professional" },
                { href: "/advertise", label: "Advertise with Us" },
                { href: "/auth/login", label: "Member Login" },
                { href: "/auth/signup", label: "Create Account" },
                { href: "/mission", label: "Our Mission" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Minaret Network. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
            <Link href="/terms" className="hover:text-emerald-400">Terms</Link>
            <Link href="/privacy" className="hover:text-emerald-400">Privacy</Link>
            <span>
              Location data ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400"
              >
                OpenStreetMap contributors
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
