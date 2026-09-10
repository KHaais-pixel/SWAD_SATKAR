"use client";
import { useEffect, useState, type FormEvent } from "react";
import { site } from "@/data/site";
import { fmtDate, toCsv, type Reservation, type Status } from "@/lib/reservations";
import { cn } from "@/lib/cn";
import { StaffGallery } from "@/components/StaffGallery";
import { StaffPrices } from "@/components/StaffPrices";

type Tab = "reservations" | "gallery" | "prices";
const TABS: Array<[Tab, string]> = [["reservations", "RESERVATIONS"], ["gallery", "GALLERY"], ["prices", "PRICES"]];

const FILTERS: Array<{ key: Status | "all"; label: string }> = [
  { key: "all", label: "ALL" }, { key: "pending", label: "PENDING" }, { key: "confirmed", label: "CONFIRMED" }, { key: "seated", label: "SEATED" }, { key: "declined", label: "DECLINED" },
];
const BADGE: Record<Status, string> = {
  pending: "bg-[rgb(201_162_74/0.16)] text-[#8a6512]",
  confirmed: "bg-[rgb(20_90_60/0.12)] text-[#1b6b48]",
  seated: "bg-navy/10 text-navy",
  declined: "bg-[rgb(180_69_58/0.12)] text-brick",
};

/**
 * The staff panel: a passcode, then three tabs. Reservation requests live in
 * this browser; the gallery and the prices are saved on the server and go
 * straight to the website.
 */
export function StaffPanel() {
  const [auth, setAuth] = useState(!site.staff.requireCode);
  const [code, setCode] = useState("");
  const [granted, setGranted] = useState(site.staff.requireCode ? "" : site.staff.passcode);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("reservations");

  const unlock = (e: FormEvent) => {
    e.preventDefault();
    if (code === site.staff.passcode) { setAuth(true); setGranted(code); setCode(""); setError(false); } else setError(true);
  };

  if (!auth) {
    return (
      <section className="mx-auto max-w-[420px] px-[22px] py-[clamp(40px,7vw,90px)]">
        <form onSubmit={unlock} className="rounded-[14px] border border-navy/[0.12] bg-white p-8">
          <h2 className="display text-[22px] text-navy">Staff access</h2>
          <p className="mb-[22px] mt-[10px] text-[13.5px] leading-[1.6] text-muted">Enter the staff passcode to see reservation requests, add photographs to the gallery and change prices.</p>
          <label className="sr-only" htmlFor="staff-code">Passcode</label>
          <input id="staff-code" type="password" value={code} onChange={(e) => { setCode(e.target.value); setError(false); }} placeholder="Passcode" autoComplete="current-password" className="field" aria-invalid={error} aria-describedby={error ? "code-error" : undefined} />
          {error && <p id="code-error" role="alert" className="mt-3 text-[13px] text-brick">Incorrect passcode.</p>}
          <button type="submit" className="btn btn-navy mt-[18px] w-full py-[15px]">Enter</button>
        </form>
      </section>
    );
  }

  return (
    <section className="wrap-wide pb-[clamp(60px,9vw,100px)] pt-[clamp(24px,4vw,44px)]">
      <div role="tablist" aria-label="Staff panel sections" className="mb-7 flex flex-wrap gap-[10px] border-b border-navy/10 pb-5">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full border px-[18px] py-[12px] font-mono text-[10px] tracking-[0.18em]", tab === k ? "border-navy bg-navy text-parchment" : "border-navy/20 bg-white text-navy")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "reservations" && <Reservations code={granted} />}
      {tab === "gallery" && <StaffGallery code={granted} />}
      {tab === "prices" && <StaffPrices code={granted} />}
    </section>
  );
}

/**
 * Reservation requests, read from the server rather than from this browser:
 * a request made on a guest's telephone has to be visible to whoever is on
 * the floor here.
 */
function Reservations({ code }: { code: string }) {
  const [res, setRes] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const call = async (init: RequestInit & { url?: string }) => {
    setError("");
    try {
      const r = await fetch(init.url || "/api/reservations", { ...init, headers: { ...init.headers, "x-staff-code": code } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error || "Could not reach the server"); return null; }
      return d as { items: Reservation[] };
    } catch {
      setError("Could not reach the server");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let live = true;
    call({ method: "GET" }).then((d) => { if (live && d) setRes(d.items); });
    return () => { live = false; };
    // the passcode is fixed for the life of the panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = async (id: string, s: Status) => {
    const d = await call({ method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: s }) });
    if (d) setRes(d.items);
  };
  const remove = async (id: string) => {
    const d = await call({ method: "DELETE", url: `/api/reservations?id=${encodeURIComponent(id)}` });
    if (d) setRes(d.items);
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(res)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "swad-satkar-reservations.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const rows = filter === "all" ? res : res.filter((r) => r.status === filter);
  const stats = [
    ["TOTAL", res.length], ["PENDING", res.filter((r) => r.status === "pending").length],
    ["CONFIRMED", res.filter((r) => r.status === "confirmed").length],
    ["GUESTS REQUESTED", res.reduce((a, r) => a + (parseInt(r.guests, 10) || 0), 0)],
  ] as const;
  return (
    <div>
      {error && (
        <p role="alert" className="mb-5 rounded-[10px] border border-[#b3261e]/35 bg-[#b3261e]/[0.06] px-4 py-3 text-[14px] text-[#8c1d18]">{error}</p>
      )}
      <dl className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[14px]">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-[10px] border border-navy/10 bg-white px-5 py-[18px]">
            <dt className="font-mono text-[10.5px] tracking-[0.22em] text-gold-ink">{k}</dt>
            <dd className="display m-0 mt-2 text-[30px] leading-none text-navy">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mb-[18px] flex flex-wrap items-center gap-[10px]">
        {FILTERS.map((ft) => (
          <button
            key={ft.key}
            type="button"
            onClick={() => setFilter(ft.key)}
            aria-pressed={filter === ft.key}
            className={cn("rounded-full border px-4 py-[11px] font-mono text-[10px] tracking-[0.16em]", filter === ft.key ? "border-navy bg-navy text-parchment" : "border-navy/20 bg-white text-navy")}
          >
            {ft.label}
          </button>
        ))}
        <div className="flex-1" />
        <button type="button" onClick={exportCsv} className="rounded-full border border-navy/20 bg-white px-4 py-[11px] font-mono text-[10px] tracking-[0.16em] text-navy">EXPORT CSV</button>
      </div>
      {rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <article className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-start gap-[18px] rounded-xl border border-navy/[0.12] bg-white px-[22px] py-5">
                <div>
                  <p className="font-mono text-[10.5px] tracking-[0.2em] text-gold-ink">{r.ref}</p>
                  <h3 className="display mt-[7px] text-[20px] font-normal text-navy">{r.name}</h3>
                  <p className="mt-[5px] text-[13.5px] text-slate-light">{r.phone || "—"}</p>
                  <p className="mt-[3px] text-[13px] text-muted">{r.email || "No email given"}</p>
                </div>
                <div>
                  <p className="font-mono text-[10.5px] tracking-[0.2em] text-gold-ink">WHEN</p>
                  <p className="mt-[7px] text-[15px] font-medium text-ink">{fmtDate(r.date)} · {r.time}</p>
                  <p className="mt-[5px] text-[13.5px] text-slate-light">{r.guests} · {r.area}</p>
                </div>
                <div>
                  <p className="font-mono text-[10.5px] tracking-[0.2em] text-gold-ink">REQUEST</p>
                  <p className="mt-[7px] text-[13.5px] leading-[1.6] text-slate">{r.note || "No special request"}</p>
                  <p className="mt-[7px] text-[11.5px] text-faint">Received {new Date(r.created).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex flex-col items-start gap-[10px]">
                  <span className={cn("rounded-[6px] px-[11px] py-[7px] font-mono text-[10.5px] uppercase tracking-[0.16em]", BADGE[r.status])}>{r.status}</span>
                  <div className="flex flex-wrap gap-[6px]">
                    <button type="button" onClick={() => status(r.id, "confirmed")} className="rounded-[6px] bg-navy px-3 py-[9px] font-mono text-[10.5px] tracking-[0.14em] text-parchment">CONFIRM</button>
                    <button type="button" onClick={() => status(r.id, "seated")} className="rounded-[6px] border border-navy/25 bg-white px-3 py-[9px] font-mono text-[10.5px] tracking-[0.14em] text-navy">SEATED</button>
                    <button type="button" onClick={() => status(r.id, "declined")} className="rounded-[6px] border border-brick/35 bg-white px-3 py-[9px] font-mono text-[10.5px] tracking-[0.14em] text-brick">DECLINE</button>
                    <button type="button" onClick={() => remove(r.id)} className="rounded-[6px] border border-navy/[0.12] bg-transparent px-3 py-[9px] font-mono text-[10.5px] tracking-[0.14em] text-slate-light">DELETE</button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-navy/20 bg-white p-[clamp(36px,6vw,70px)] text-center">
          <p className="display text-[21px] text-navy">{loading ? "Reading requests…" : "No requests in this view"}</p>
          <p className="mt-[10px] text-[14px] text-muted">
            {loading ? "One moment." : "Submit one from the reservations page to see it appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
