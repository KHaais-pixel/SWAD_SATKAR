"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AREAS, GUESTS, TIMES, fmtDate, load, newReservation, save, type Reservation } from "@/lib/reservations";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-[9px]">
    <span className="field-label">{label}</span>
    {children}
  </label>
);

const EMPTY = { name: "", phone: "", email: "", date: "", time: "7:00 PM", guests: "2 guests", area: "No preference", note: "" };

/** A request, not a booking: it waits in the staff panel until someone calls back. */
export function BookForm() {
  const [f, setF] = useState(EMPTY);
  const [done, setDone] = useState<Reservation | null>(null);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.phone.trim() || !f.date) return;
    const rec = newReservation({ ...f, name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), note: f.note.trim() });
    save([rec, ...load()]);
    setDone(rec);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    const rows = [
      ["REFERENCE", done.ref], ["NAME", done.name], ["PHONE", done.phone], ["EMAIL", done.email || "—"],
      ["DATE", fmtDate(done.date)], ["TIME", done.time], ["GUESTS", done.guests], ["SEATING", done.area], ["STATUS", "Awaiting confirmation"],
    ];
    return (
      <div role="status" className="rounded-2xl border border-gold/55 bg-white p-[clamp(30px,5vw,54px)] text-center [animation:ssRise_.5s_ease_both]">
        <div aria-hidden className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full border border-gold text-[24px] text-gold-ink">◆</div>
        <h2 className="display mt-[22px] text-[clamp(23px,3.4vw,34px)] text-navy">Request received</h2>
        <p className="mt-[14px] text-[15.5px] leading-[1.7] text-slate">
          Your table is <strong>not confirmed yet</strong>. Our team reviews requests in the staff panel and will call you back to confirm.
        </p>
        <dl className="mx-auto mt-[26px] max-w-[440px] overflow-hidden rounded-[10px] border border-navy/[0.12] text-left">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-[14px] border-b border-navy/[0.08] px-4 py-3 text-[14px] last:border-b-0">
              <dt className="pt-[3px] font-mono text-[10px] tracking-[0.16em] text-gold-ink">{k}</dt>
              <dd className="m-0 text-right text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-[28px] flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => { setDone(null); setF(EMPTY); }} className="btn btn-outline px-[26px] py-[14px] tracking-[0.14em]">
            Make another request
          </button>
          <Link href="/" className="btn btn-navy px-[26px] py-[14px] tracking-[0.14em]">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-navy/[0.12] bg-white p-[clamp(24px,4vw,44px)] shadow-[0_24px_60px_rgba(14,42,74,.1)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5">
        <Field label="Name *"><input required value={f.name} onChange={set("name")} placeholder="Your full name" autoComplete="name" className="field" /></Field>
        <Field label="Phone *"><input required type="tel" value={f.phone} onChange={set("phone")} placeholder="98XXXXXXXX" autoComplete="tel" className="field" /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={set("email")} placeholder="you@email.com" autoComplete="email" className="field" /></Field>
        <Field label="Date *"><input required type="date" value={f.date} onChange={set("date")} className="field" /></Field>
        <Field label="Time *">
          <select required value={f.time} onChange={set("time")} className="field">
            {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Guests *">
          <select value={f.guests} onChange={set("guests")} className="field">
            {GUESTS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Seating">
          <select value={f.area} onChange={set("area")} className="field">
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>
      <label className="mt-5 flex flex-col gap-[9px]">
        <span className="field-label">Special requests</span>
        <textarea value={f.note} onChange={set("note")} rows={4} placeholder="Birthday, seating preference, dietary needs, khaja set for a group…" className="field resize-y leading-[1.6]" />
      </label>
      <div className="mt-[26px] flex flex-wrap items-center justify-between gap-[18px] border-t border-navy/10 pt-6">
        <p className="max-w-[44ch] text-[13px] leading-[1.6] text-muted">Requests are held in the staff panel until a member of our team confirms by phone. No table is booked automatically.</p>
        <button type="submit" data-cursor="RESERVE" className="btn btn-navy display px-[38px] py-[18px] text-[16px] normal-case tracking-[0.1em]">
          Book a Table
        </button>
      </div>
    </form>
  );
}
