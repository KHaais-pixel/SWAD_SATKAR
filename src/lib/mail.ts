import nodemailer from "nodemailer";
import { site } from "@/data/site";
import { fmtDate, type Reservation } from "@/lib/reservations";

/**
 * Mail over the domain's own SMTP server. The settings come from the
 * environment so no address or password is ever in the repository; on the
 * cPanel host they live in ~/swadsatkar-app/.env, written 0600.
 *
 *   SMTP_HOST      mail.swadsatkar.com
 *   SMTP_PORT      465 (implicit TLS) or 587 (STARTTLS)
 *   SMTP_USER      the full mailbox address that sends
 *   SMTP_PASS      its password
 *   MAIL_FROM      what the guest sees in From:, defaults to SMTP_USER
 *   MAIL_BCC       optional; the restaurant's copy of every request
 *
 * With SMTP_HOST unset, mail is disabled and sending is a no-op that says so.
 * A booking must be stored whether or not the mail server is reachable, so
 * every function here reports failure instead of throwing.
 */
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

export const mailConfigured = Boolean(host && user && pass);

const transport = () =>
  nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: user as string, pass: pass as string },
    // the host's own mail server, reached from the machine it runs on
    tls: { servername: host },
  });

export interface MailResult {
  sent: boolean;
  /** why not, when sent is false — logged, never shown to the guest */
  reason?: string;
}

/** The plain-text body. Kept short: a reference, the details, and what happens next. */
function confirmationText(r: Reservation): string {
  return [
    `Dear ${r.name},`,
    ``,
    `We have your table request at ${site.name}. It is not confirmed yet — we will telephone you on ${r.phone} to confirm it.`,
    ``,
    `Reference   ${r.ref}`,
    `Date        ${fmtDate(r.date)}`,
    `Time        ${r.time}`,
    `Guests      ${r.guests}`,
    `Seating     ${r.area}`,
    ...(r.note ? [`Request     ${r.note}`] : []),
    ``,
    `If anything above is wrong, reply to this email or call us on ${site.phone}.`,
    ``,
    `${site.name}`,
    `${site.address.street}, ${site.address.locality}`,
    `${site.phone}`,
  ].join("\n");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function confirmationHtml(r: Reservation): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:9px 14px;border-bottom:1px solid #e6e9ee;font:11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#8a6d3b">${esc(k)}</td>` +
    `<td style="padding:9px 14px;border-bottom:1px solid #e6e9ee;font:15px/1.5 Georgia,serif;color:#14213d;text-align:right">${esc(v)}</td></tr>`;
  const rows = [
    ["REFERENCE", r.ref], ["DATE", fmtDate(r.date)], ["TIME", r.time],
    ["GUESTS", r.guests], ["SEATING", r.area], ...(r.note ? [["REQUEST", r.note]] : []),
  ].map(([k, v]) => row(k, v)).join("");
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;padding:28px 16px">
<table role="presentation" style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6e9ee;border-radius:12px;border-collapse:separate">
<tr><td style="padding:30px 26px 8px">
<p style="margin:0 0 6px;font:11px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.2em;color:#8a6d3b">RESERVATIONS</p>
<h1 style="margin:0;font:400 26px/1.25 Georgia,serif;color:#14213d">Request received</h1>
<p style="margin:14px 0 0;font:15px/1.65 Georgia,serif;color:#40506b">Dear ${esc(r.name)}, we have your table request. It is <strong>not confirmed yet</strong> — we will telephone you on ${esc(r.phone)} to confirm it.</p>
</td></tr>
<tr><td style="padding:18px 26px 4px"><table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e6e9ee;border-radius:8px">${rows}</table></td></tr>
<tr><td style="padding:18px 26px 30px">
<p style="margin:0;font:14px/1.65 Georgia,serif;color:#40506b">If anything above is wrong, reply to this email or call us on ${esc(site.phone)}.</p>
<p style="margin:18px 0 0;font:13px/1.6 Georgia,serif;color:#7c879b">${esc(site.name)}<br>${esc(`${site.address.street}, ${site.address.locality}`)}<br>${esc(site.phone)}</p>
</td></tr></table></body></html>`;
}

/** The guest's confirmation. Never throws: a booking is kept even if mail fails. */
export async function sendBookingConfirmation(r: Reservation): Promise<MailResult> {
  if (!r.email) return { sent: false, reason: "no email address given" };
  if (!mailConfigured) return { sent: false, reason: "SMTP is not configured" };
  try {
    await transport().sendMail({
      from: process.env.MAIL_FROM || `"${site.name}" <${user}>`,
      to: r.email,
      bcc: process.env.MAIL_BCC || undefined,
      replyTo: site.email || undefined,
      subject: `Your table request at ${site.name} — ${r.ref}`,
      text: confirmationText(r),
      html: confirmationHtml(r),
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** Proves the settings work without booking anything. Used by scripts/test-smtp.mjs. */
export async function verifyMail(): Promise<MailResult> {
  if (!mailConfigured) return { sent: false, reason: "SMTP is not configured" };
  try {
    await transport().verify();
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
