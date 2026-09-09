"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BAR_LISTS, SMOKING, SPIRITS, THAI, THAKALI, type Category, type Spirit } from "@/data/menus";
import { cn } from "@/lib/cn";

type Lists = "thakali" | "thai" | "bar";
type SpiritCol = "b" | "m30" | "m60" | "h" | "q";
interface Overrides {
  thakali: Record<string, string>;
  thai: Record<string, string>;
  bar: Record<string, string>;
  spirits: Record<string, Partial<Record<SpiritCol, string>>>;
}
const EMPTY: Overrides = { thakali: {}, thai: {}, bar: {}, spirits: {} };
const key = (cat: string, item: string) => `${cat}/${item}`;
const COLS: Array<[SpiritCol, string]> = [["b", "BOTTLE"], ["m30", "30ML"], ["m60", "60ML"], ["h", "HALF"], ["q", "QTR"]];
const TABS: Array<[Lists | "spirits", string]> = [["thakali", "THAKALI"], ["thai", "THAI"], ["bar", "BAR"], ["spirits", "SPIRITS"]];

/**
 * Every price on the website, editable. What is typed replaces the printed
 * price on the menu pages; clearing a field, or "printed", puts the printed
 * price back. Nothing is live until Save.
 */
export function StaffPrices({ code }: { code: string }) {
  const [saved, setSaved] = useState<Overrides | null>(null);
  const [draft, setDraft] = useState<Overrides>(EMPTY);
  const [tab, setTab] = useState<Lists | "spirits">("thakali");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const headers = useMemo(() => ({ "x-staff-code": code, "content-type": "application/json" }), [code]);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/staff/prices", { headers: { "x-staff-code": code }, cache: "no-store" });
      if (!r.ok) throw new Error((await r.json()).error || r.statusText);
      const o = (await r.json()).overrides as Overrides;
      setSaved(o); setDraft(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the prices");
      setSaved(EMPTY);
    }
  }, [code]);
  useEffect(() => { load(); }, [load]);

  const dirty = saved !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const changed = Object.keys(draft.thakali).length + Object.keys(draft.thai).length + Object.keys(draft.bar).length + Object.values(draft.spirits).reduce((a, c) => a + Object.keys(c).length, 0);

  const setPrice = (list: Lists, k: string, printed: string, v: string) =>
    setDraft((d) => {
      const next = { ...d[list] };
      if (!v.trim() || v === printed) delete next[k]; else next[k] = v;
      return { ...d, [list]: next };
    });
  const setSpirit = (name: string, col: SpiritCol, printed: string, v: string) =>
    setDraft((d) => {
      const row = { ...(d.spirits[name] || {}) };
      if (!v.trim() || v === printed) delete row[col]; else row[col] = v;
      const spirits = { ...d.spirits };
      if (Object.keys(row).length) spirits[name] = row; else delete spirits[name];
      return { ...d, spirits };
    });

  const save = async () => {
    setBusy(true); setError(""); setDone("");
    try {
      const r = await fetch("/api/staff/prices", { method: "PUT", headers, body: JSON.stringify(draft) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save");
      setSaved(j.overrides); setDraft(j.overrides);
      setDone("Saved. The menu pages show these prices now.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const Price = ({ list, k, printed }: { list: Lists; k: string; printed: string }) => {
    const v = draft[list][k];
    const on = v !== undefined;
    return (
      <span className="flex items-center gap-2">
        <input
          value={on ? v : printed}
          onChange={(e) => setPrice(list, k, printed, e.target.value)}
          aria-label={`Price for ${k.split("/")[1]}`}
          maxLength={24}
          className={cn("w-[112px] rounded-[8px] border px-3 py-[8px] text-right font-mono text-[13px] outline-none focus:border-gold-deep", on ? "border-gold bg-gold/[0.1] text-navy" : "border-navy/[0.14] bg-white text-gold-ink")}
        />
        <button type="button" onClick={() => setPrice(list, k, printed, "")} disabled={!on} title={`Printed: ${printed}`} className="min-h-[24px] w-[62px] font-mono text-[10px] tracking-[0.12em] text-faint disabled:invisible hover:text-navy">PRINTED</button>
      </span>
    );
  };

  const cats = (list: Lists, groups: Array<Category | { id?: string; cat: string; items: Array<{ n: string; d?: string; p: string }> }>) =>
    groups.map((c) => {
      const id = "id" in c && c.id ? c.id : c.cat;
      return (
        <section key={id} className="rounded-[12px] border border-navy/10 bg-white">
          <h3 className="display border-b border-navy/[0.08] px-5 py-[14px] text-[18px] text-navy">{c.cat}</h3>
          <ul>
            {c.items.map((i) => (
              <li key={i.n} className="flex items-center justify-between gap-4 border-b border-navy/[0.06] px-5 py-[9px] last:border-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-ink">{i.n}</span>
                  {i.d && <span className="block truncate text-[11.5px] text-muted">{i.d}</span>}
                </span>
                <Price list={list} k={key(id, i.n)} printed={i.p} />
              </li>
            ))}
          </ul>
        </section>
      );
    });

  if (saved === null) return <p className="text-[13px] text-muted">Loading the prices…</p>;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-[10px]">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={cn("rounded-full border px-4 py-[11px] font-mono text-[10px] tracking-[0.16em]", tab === k ? "border-navy bg-navy text-parchment" : "border-navy/20 bg-white text-navy")}>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <p className="font-mono text-[10.5px] tracking-[0.18em] text-gold-ink">{changed ? `${changed} CHANGED FROM PRINTED` : "ALL PRICES AS PRINTED"}</p>
        <button type="button" onClick={save} disabled={!dirty || busy} className="btn btn-navy px-[22px] py-[12px] text-[11px] disabled:opacity-40">{busy ? "Saving…" : "Save"}</button>
      </div>
      {error && <p role="alert" className="mb-4 text-[13px] text-brick">{error}</p>}
      {done && !dirty && <p role="status" className="mb-4 text-[13px] text-[#1b6b48]">{done}</p>}
      {dirty && <p className="mb-4 text-[13px] text-slate">Unsaved changes. Nothing is live until you save.</p>}

      {tab === "thakali" && <div className="grid gap-4 md:grid-cols-2">{cats("thakali", THAKALI)}</div>}
      {tab === "thai" && <div className="grid gap-4 md:grid-cols-2">{cats("thai", THAI)}</div>}
      {tab === "bar" && <div className="grid gap-4 md:grid-cols-2">{cats("bar", [...BAR_LISTS, SMOKING])}</div>}
      {tab === "spirits" && (
        <div className="overflow-x-auto rounded-[12px] border border-navy/10 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr className="font-mono text-[10.5px] tracking-[0.14em] text-gold-ink">
                <th scope="col" className="px-5 py-[12px] text-left font-normal">SPIRIT</th>
                {COLS.map(([, label]) => <th key={label} scope="col" className="px-2 py-[12px] text-right font-normal">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SPIRITS.map((s: Spirit) => (
                <tr key={s.n} className="border-t border-navy/[0.06]">
                  <th scope="row" className="px-5 py-[7px] text-left font-medium text-ink">{s.n}</th>
                  {COLS.map(([col]) => {
                    const v = draft.spirits[s.n]?.[col];
                    const on = v !== undefined;
                    return (
                      <td key={col} className="px-2 py-[7px] text-right">
                        <input value={on ? v : s[col]} onChange={(e) => setSpirit(s.n, col, s[col], e.target.value)} aria-label={`${s.n}, ${col}`} maxLength={24} title={`Printed: ${s[col]}`} className={cn("w-[84px] rounded-[8px] border px-2 py-[7px] text-right font-mono text-[12.5px] outline-none focus:border-gold-deep", on ? "border-gold bg-gold/[0.1] text-navy" : "border-navy/[0.14] bg-white text-gold-ink")} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-[12px] text-muted">Clear a field to go back to the printed price.</p>
        </div>
      )}
    </div>
  );
}
