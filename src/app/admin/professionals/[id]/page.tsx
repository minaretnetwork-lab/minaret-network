import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveProfessional, getProfessionalForAdmin, rejectProfessional, suspendProfessional } from "@/lib/actions/admin";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDate } from "@/lib/utils";

const STATUS_UI: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending Review", classes: "bg-amber-100 text-amber-700 border-amber-200" },
  WITHDRAWN: { label: "Called Back for Edits", classes: "bg-blue-100 text-blue-700 border-blue-200" },
  APPROVED: { label: "Approved", classes: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Rejected", classes: "bg-red-100 text-red-700 border-red-200" },
  SUSPENDED: { label: "Suspended", classes: "bg-gray-100 text-gray-600 border-gray-200" },
};

export const metadata = { title: "Professional Application Details" };

export default async function AdminProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const professional = await getProfessionalForAdmin(id);
  if (!professional) notFound();

  const applicantName =
    professional.user.displayName ??
    [professional.user.firstName, professional.user.lastName].filter(Boolean).join(" ") ??
    professional.user.email;
  const status = STATUS_UI[professional.status] ?? STATUS_UI.PENDING;
  const mapsUrl = professional.businessAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.businessAddress)}`
    : null;

  async function approveAction() {
    "use server";
    await approveProfessional(id);
    redirect(`/admin/professionals/${id}`);
  }

  async function suspendAction() {
    "use server";
    await suspendProfessional(id);
    redirect(`/admin/professionals/${id}`);
  }

  async function rejectAction(formData: FormData) {
    "use server";
    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason) return;
    await rejectProfessional(id, reason);
    redirect(`/admin/professionals/${id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/professionals"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to professionals
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                {status.label}
              </span>
              <span className="text-xs text-gray-400">Submitted {formatDate(professional.submittedAt)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {professional.businessName || applicantName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{applicantName}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CategoryIcon slug={professional.category.slug} className="h-4 w-4" />
                {professional.category.name}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {professional.status !== "APPROVED" && professional.status !== "WITHDRAWN" && (
              <form action={approveAction}>
                <Button type="submit" className="gap-1.5 bg-green-600 text-white hover:bg-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
              </form>
            )}
            {professional.status === "APPROVED" && (
              <form action={suspendAction}>
                <Button type="submit" variant="outline" className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50">
                  <AlertCircle className="h-4 w-4" />
                  Suspend
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="space-y-6">
          <Card title="Application details" icon={<User className="h-4 w-4" />}>
            <Info label="Title" value={professional.title} />
            <Info label="Business" value={professional.businessName} />
            <Info label="Bio" value={professional.bio} multiline />
            <Info label="Years of experience" value={professional.yearsOfExperience ? `${professional.yearsOfExperience}+ years` : null} />
            <Info label="Qualifications" value={professional.qualifications} multiline />
            <Info label="Licenses" value={professional.licenses} multiline />
          </Card>

          <Card title="Where & when" icon={<MapPin className="h-4 w-4" />}>
            <Info label="Service areas" value={professional.serviceAreas.map((area) => area.name).join(", ")} multiline />
            <Info label="Business address" value={professional.businessAddress} href={mapsUrl} multiline />
            <Info label="Walk-ins" value={professional.acceptsWalkIns ? "Yes, accepts walk-ins" : "No / not specified"} />
            <Info label="Availability" value={professional.availability} multiline />
            <Info label="Languages" value={professional.languages.join(", ")} />
          </Card>

          <Card title="Mosque affiliation" icon={<Building2 className="h-4 w-4" />}>
            <Info label="Mosque" value={professional.mosque?.name} />
            <Info label="City" value={professional.mosque?.city} />
            <Info label="Address" value={professional.mosque?.address} multiline />
            <Info label="Website" value={professional.mosque?.website} href={professional.mosque?.website ?? null} />
            <Info
              label="Verification channel"
              value={
                professional.mosque
                  ? [professional.mosque.communityChannelType, professional.mosque.communityChannelName].filter(Boolean).join(" — ") || null
                  : "No mosque selected"
              }
              href={professional.mosque?.communityChannelLink ?? null}
            />
          </Card>

          {professional.status === "PENDING" && (
            <Card title="Reject application" icon={<XCircle className="h-4 w-4" />}>
              <form action={rejectAction} className="space-y-3">
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder="Explain why this application is being rejected…"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-gray-700 dark:bg-gray-900"
                />
                <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
                  Reject application
                </Button>
              </form>
            </Card>
          )}
        </section>

        <aside className="space-y-6">
          <Card title="Applicant contact" icon={<Mail className="h-4 w-4" />}>
            <Info label="Name" value={applicantName} />
            <Info label="Email" value={professional.user.email} href={`mailto:${professional.user.email}`} />
            <Info label="Phone" value={professional.user.phone ?? professional.phone} href={professional.user.phone || professional.phone ? `tel:${professional.user.phone ?? professional.phone}` : null} />
            <Info label="WhatsApp" value={professional.user.whatsapp ?? professional.whatsapp} />
            <Info label="Preferred contact" value={professional.user.preferredContact?.toLowerCase()} />
            <Info label="Business email" value={professional.email} href={professional.email ? `mailto:${professional.email}` : null} />
            <Info label="Business phone" value={professional.phone} href={professional.phone ? `tel:${professional.phone}` : null} />
            <Info label="Website" value={professional.website} href={professional.website} icon={<Globe className="h-3.5 w-3.5" />} />
          </Card>

          <Card title="Badges & recommendations" icon={<Award className="h-4 w-4" />}>
            <Info label="Badges" value={professional.badges.map((badge) => badge.type.replaceAll("_", " ")).join(", ")} multiline />
            <Info label="Approved recommendations" value={String(professional.recommendations.length)} />
          </Card>

          <Card title="Images" icon={<Star className="h-4 w-4" />}>
            <ImagePreview label="Profile photo" src={professional.photoUrl} />
            <ImagePreview label="Business logo" src={professional.logoUrl} />
            <Info label="Gallery photos" value={String(professional.galleryImages.length)} />
          </Card>

          <Card title="Timeline" icon={<Calendar className="h-4 w-4" />}>
            <Info label="Submitted" value={formatDate(professional.submittedAt)} />
            <Info label="Approved" value={professional.approvedAt ? formatDate(professional.approvedAt) : null} />
            <Info label="Created" value={formatDate(professional.createdAt)} />
            <Info label="Updated" value={formatDate(professional.updatedAt)} />
            {professional.rejectionReason && <Info label="Rejection reason" value={professional.rejectionReason} multiline />}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <span className="text-emerald-700 dark:text-emerald-300">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Info({
  label,
  value,
  href,
  multiline = false,
  icon,
}: {
  label: string;
  value?: string | number | null;
  href?: string | null;
  multiline?: boolean;
  icon?: React.ReactNode;
}) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[9.5rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className={`min-w-0 text-gray-900 dark:text-white ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
        {href && display !== "—" ? (
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
            {icon}
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}

function ImagePreview({ label, src }: { label: string; src: string | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-24 w-32 rounded-xl border border-gray-200 object-cover" />
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
    </div>
  );
}
