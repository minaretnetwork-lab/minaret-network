import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Minaret Network <noreply@minaretnetwork.ca>";

const LOGO = "https://osmlhdskgvigfprzpnrn.supabase.co/storage/v1/object/public/public-assets/minaret-network-logo.png";

function emailWrapper(content: string) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: #14532d; padding: 24px 32px; text-align: center;">
    <img src="${LOGO}" alt="Minaret Network" style="height: 64px; width: auto;" />
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
