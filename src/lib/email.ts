import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Minaret Network <noreply@minaretnetwork.ca>";

const LOGO = "https://osmlhdskgvigfprzpnrn.supabase.co/storage/v1/object/public/public-assets/minaret-network-logo.png";

function emailWrapper(content: string) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: #14532d; padding: 24px 32px; text-align: center;">
    <img src="${LOGO}" alt="Minaret Network" style="height: 64px; width: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="padding: 32px;">
    ${content}
  </div>
  <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      Minaret Network · Toronto, Ontario · <a href="https://minaretnetwork.ca" style="color: #15803d;">minaretnetwork.ca</a>
    </p>
  </div>
</div>`;
}

function button(label: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: #15803d; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">${label}</a>`;
}

const ADMIN_EMAIL = "salam@minaretnetwork.ca";

export async function sendAdminNewProfileEmail(professionalName: string, category: string) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New profile submitted — ${professionalName} (${category})`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">New profile pending review</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        A new professional profile has been submitted and is waiting for your approval.<br><br>
        <strong>Name:</strong> ${professionalName}<br>
        <strong>Category:</strong> ${category}
      </p>
      ${button("Review in admin panel", "https://minaretnetwork.ca/admin/professionals")}
    `),
  });
}

export async function sendAdminSponsoredApplicationEmail(professionalName: string, category: string, area: string) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Sponsored listing application — ${professionalName}`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">New sponsored listing application</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        A professional has applied for a sponsored placement and is waiting for your approval.<br><br>
        <strong>Name:</strong> ${professionalName}<br>
        <strong>Category:</strong> ${category}<br>
        <strong>Service area:</strong> ${area}
      </p>
      ${button("Review in admin panel", "https://minaretnetwork.ca/admin/sponsored")}
    `),
  });
}

export async function sendAdminFeaturedApplicationEmail(professionalName: string, category: string, region: string) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Featured business application — ${professionalName}`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">New featured business application</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        A professional has applied for a featured business placement and is waiting for your approval.<br><br>
        <strong>Name:</strong> ${professionalName}<br>
        <strong>Category:</strong> ${category}<br>
        <strong>Region:</strong> ${region}
      </p>
      ${button("Review in admin panel", "https://minaretnetwork.ca/admin/featured")}
    `),
  });
}

export async function sendAdminOfferSubmittedEmail(professionalName: string, offerTitle: string, region: string) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Community offer submitted — ${professionalName}`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">New community offer pending review</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        A professional has submitted a community offer and is waiting for your approval.<br><br>
        <strong>Professional:</strong> ${professionalName}<br>
        <strong>Offer title:</strong> ${offerTitle}<br>
        <strong>Region:</strong> ${region}
      </p>
      ${button("Review in admin panel", "https://minaretnetwork.ca/admin/offers")}
    `),
  });
}

export async function sendNewLeadEmail(to: string, firstName: string, details: {
  category: string;
  area: string;
  description: string;
}) {
  const preview = details.description.length > 200
    ? details.description.slice(0, 200).trimEnd() + "…"
    : details.description;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New lead: ${details.category} request in ${details.area} — Minaret Network`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">New service request for you</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Assalamu Alaikum ${firstName},<br><br>
        A community member has submitted a <strong>${details.category}</strong> request in <strong>${details.area}</strong> that matches your listing.
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
        <p style="color: #14532d; font-size: 14px; line-height: 1.7; margin: 0;">${preview}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Log in to view the full request and respond. Contact details are shared once you start a conversation.
      </p>
      ${button("View lead in dashboard", "https://minaretnetwork.ca/dashboard/leads")}
      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
        You're receiving this because your listing matches this request. If you're not interested, you can simply ignore it.
      </p>
    `),
  });
}

export async function sendProfileSubmittedEmail(to: string, firstName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your profile is under review — Minaret Network",
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">Profile received!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Assalamu Alaikum ${firstName},<br><br>
        Thank you for joining Minaret Network. Your professional profile has been submitted and is currently under review by our team.<br><br>
        We typically review profiles within 1–2 business days. You'll receive an email once your profile is approved and live on the directory.
      </p>
      ${button("View your dashboard", "https://minaretnetwork.ca/dashboard/professional")}
      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
        If you have any questions, reply to this email and we'll be happy to help.
      </p>
    `),
  });
}

export async function sendProfileApprovedEmail(to: string, firstName: string, profileUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your profile is live — Minaret Network",
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">You're live on Minaret Network!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Assalamu Alaikum ${firstName},<br><br>
        Great news — your professional profile has been approved and is now live on the Minaret Network directory. Community members can now find and contact you.
      </p>
      ${button("View your profile", profileUrl)}
      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
        You can manage your profile, update your information, and view inquiries from your dashboard.
      </p>
    `),
  });
}

export async function sendAdminNewClaimEmail(businessName: string, claimantName: string, claimantEmail: string) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New profile claim — ${businessName}`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">New profile claim submitted</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Someone has submitted a claim for an unclaimed business listing and is awaiting verification.<br><br>
        <strong>Business:</strong> ${businessName}<br>
        <strong>Claimant:</strong> ${claimantName}<br>
        <strong>Contact:</strong> ${claimantEmail}
      </p>
      ${button("Review claim in admin panel", "https://minaretnetwork.ca/admin/claims")}
    `),
  });
}

export async function sendClaimApprovedEmail(to: string, firstName: string, businessName: string, profileUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your claim for ${businessName} has been approved — Minaret Network`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">Your claim was approved!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Assalamu Alaikum ${firstName},<br><br>
        We have verified your ownership of <strong>${businessName}</strong> on Minaret Network. You now have full control of your listing.
      </p>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Sign in and visit your dashboard to update your profile, add photos, set your availability, and connect with the community.
      </p>
      ${button("Manage your listing", "https://minaretnetwork.ca/dashboard/professional")}
      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
        You can also <a href="${profileUrl}" style="color: #15803d;">view your public profile</a> to see how it appears to the community.
      </p>
    `),
  });
}

export async function sendClaimRejectedEmail(to: string, firstName: string, businessName: string, adminNote?: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Update on your claim for ${businessName} — Minaret Network`,
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">Claim review update</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Assalamu Alaikum ${firstName},<br><br>
        We were unable to verify your ownership claim for <strong>${businessName}</strong> at this time.
        ${adminNote ? `<br><br><strong>Note from our team:</strong> ${adminNote}` : ""}
        <br><br>
        If you believe this is an error or have additional documentation, please reply to this email and we'll be happy to help.
      </p>
    `),
  });
}

export async function sendProfileRejectedEmail(to: string, firstName: string, reason?: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Update on your Minaret Network profile",
    html: emailWrapper(`
      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px;">Profile review update</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Assalamu Alaikum ${firstName},<br><br>
        Thank you for your interest in Minaret Network. After reviewing your profile, we were unable to approve it at this time.
        ${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ""}
        <br><br>
        You're welcome to update your profile and resubmit for review.
      </p>
      ${button("Update your profile", "https://minaretnetwork.ca/dashboard/professional")}
      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
        If you have questions about this decision, reply to this email and we'll be happy to help.
      </p>
    `),
  });
}
