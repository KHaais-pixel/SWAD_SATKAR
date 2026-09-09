"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { gallery as house, type GalleryItem } from "@/data/site";
import { cn } from "@/lib/cn";

const ALBUMS = ["The House", "The Table", "Kitchen", "Nights", "Events"];
const idOf = (g: GalleryItem) => g.id || g.src;

/**
 * The staff's side of the gallery, and the only place it is changed: add a
 * photograph into an album, see everything visitors see, and take any
 * photograph out. An upload goes for good, file and all; a house photograph
 * (one that lives in the code) is put away, and the whole set can be brought
 * back. Every change is live on the website at once.
 */
export function StaffGallery({ code }: { code: string }) {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [hidden, setHidden] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [confirm, setConfirm] = useState("");
  const [album, setAlbum] = useState(ALBUMS[0]);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState("");
  const [hot, setHot] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const headers = { "x-staff-code": code };

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/staff/gallery", { headers: { "x-staff-code": code }, cache: "no-store" });
      if (!r.ok) throw new Error((await r.json()).error || r.statusText);
      const j = await r.json();
      setItems(j.items); setHidden(j.hidden);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the gallery");
      setItems([]);
    }
  }, [code]);
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!files[0]) { setPreview(""); return; }
    const url = URL.createObjectURL(files[0]);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  const take = (list: FileList | File[] | null) => {
    const f = Array.from(list || []).filter((x) => x.type.startsWith("image/"));
    setFiles(f); setError(f.length || !list?.length ? "" : "Those are not photographs we can use (JPG, PNG, WebP or HEIC)."); setDone("");
  };

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!files.length) { setError("Choose a photograph first."); return; }
    setBusy(true); setError(""); setDone("");
    let ok = 0, failed = 0;
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f); fd.append("album", album); fd.append("tag", album); fd.append("note", note || f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      try {
        const r = await fetch("/api/staff/gallery", { method: "POST", headers, body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Upload failed");
        setItems((cur) => [...(cur || []), j.item]); ok++;
      } catch (err) {
        failed++; setError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    setFiles([]); setNote("");
    if (fileInput.current) fileInput.current.value = "";
    setBusy(false);
    if (ok) setDone(`${ok === 1 ? "Added one photograph" : `Added ${ok} photographs`} to ${album}. ${failed ? `${failed} could not be read. ` : ""}It is on the website now.`);
  };

  const remove = async (g: GalleryItem) => {
    const key = idOf(g);
    if (confirm !== key) { setConfirm(key); window.setTimeout(() => setConfirm((c) => (c === key ? "" : c)), 3200); return; }
    setConfirm(""); setError(""); setDone("");
    const q = g.id ? `id=${encodeURIComponent(g.id)}` : `src=${encodeURIComponent(g.src)}`;
    const r = await fetch(`/api/staff/gallery?${q}`, { method: "DELETE", headers });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "Could not remove it"); return; }
    setItems((cur) => (cur || []).filter((x) => idOf(x) !== key));
    if (!g.id) setHidden(j.hidden);
    setDone(g.id ? `Deleted "${g.tag}". It is off the website.` : `Put "${g.tag}" away. It is off the website; restore the house set to bring it back.`);
  };
  const restore = async () => {
    setError(""); setDone("");
    const r = await fetch("/api/staff/gallery", { method: "PUT", headers });
    if (!r.ok) { setError("Could not restore"); return; }
    const j = await r.json();
    setItems(j.items); setHidden(0); setDone("House set restored.");
  };

  const albums = [...new Set([...ALBUMS, ...(items || []).map((g) => g.album || "")])].filter(Boolean);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <form onSubmit={upload} className="self-start rounded-[14px] border border-navy/[0.12] bg-white p-6">
        <h2 className="display text-[22px] text-navy">Add photographs</h2>
        <p className="mb-5 mt-2 text-[13px] leading-[1.6] text-muted">They go into the album you choose on the gallery page, live, the moment they are added.</p>

        <div
          className={cn("rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors", hot ? "border-gold bg-gold/[0.08]" : "border-navy/25 bg-mist-deep")}
          onDragEnter={(e) => { e.preventDefault(); setHot(true); }}
          onDragOver={(e) => { e.preventDefault(); setHot(true); }}
          onDragLeave={(e) => { e.preventDefault(); setHot(false); }}
          onDrop={(e) => { e.preventDefault(); setHot(false); take(e.dataTransfer.files); }}
        >
          <p className="display text-[17px] text-navy">Drop photographs here</p>
          <p className="mt-1 text-[13px] text-slate">or <button type="button" onClick={() => fileInput.current?.click()} className="text-gold-ink underline underline-offset-[3px]">choose files</button></p>
          <p className="mt-2 text-[11.5px] text-muted">JPG, PNG, WebP or HEIC · several at once</p>
          <label htmlFor="g-file" className="sr-only">Photographs</label>
          <input ref={fileInput} id="g-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif" multiple hidden onChange={(e) => take(e.target.files)} />
        </div>
        {files.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-[10px] border border-navy/10 bg-mist">
            {/* the first file straight from the disk, before it is sent */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="" className="block max-h-[200px] w-full object-cover" />}
            <p className="px-3 py-2 font-mono text-[10.5px] tracking-[0.18em] text-gold-ink">{files.length === 1 ? files[0].name : `${files.length} PHOTOGRAPHS CHOSEN`}</p>
          </div>
        )}

        <label htmlFor="g-album" className="field-label mt-4">Album</label>
        <input id="g-album" list="g-albums" value={album} onChange={(e) => setAlbum(e.target.value)} maxLength={40} required className="field" />
        <datalist id="g-albums">{albums.map((a) => <option key={a} value={a} />)}</datalist>
        <label htmlFor="g-note" className="field-label mt-4">Description <span className="normal-case tracking-normal text-faint">(what is in the shot)</span></label>
        <input id="g-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The terrace on a Friday" maxLength={90} className="field" />

        {error && <p role="alert" className="mt-4 text-[13px] text-brick">{error}</p>}
        {done && <p role="status" className="mt-4 text-[13px] text-[#1b6b48]">{done}</p>}
        <button type="submit" disabled={busy} className="btn btn-navy mt-5 w-full py-[15px] disabled:opacity-60">{busy ? "Uploading…" : "Add to the gallery"}</button>
      </form>

      <section aria-label="Photographs in the gallery">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display text-[22px] text-navy">On the gallery page</h2>
          <p className="font-mono text-[10.5px] tracking-[0.2em] text-gold-ink">{items?.length ?? "…"} PHOTOGRAPHS{hidden ? ` · ${hidden} PUT AWAY` : ""}</p>
        </div>
        <p className="mb-4 text-[13px] leading-[1.6] text-muted">Delete takes an uploaded photograph off the website for good. The {house.length} house photographs are put away instead, and come back together.</p>
        {items === null ? (
          <p className="rounded-[10px] border border-dashed border-navy/20 p-5 text-[13px] text-muted">Loading…</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {items.map((g) => {
              const key = idOf(g), asking = confirm === key;
              return (
                <li key={key} className="overflow-hidden rounded-[10px] border border-navy/10 bg-white">
                  <div className="relative aspect-[4/3] bg-mist">
                    <Image src={g.src} alt={g.alt} fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="px-3 py-[10px]">
                    <p className="font-mono text-[10.5px] tracking-[0.18em] text-gold-ink">{g.album || "Untitled"}</p>
                    <p className="mt-1 truncate text-[12px] text-slate">{g.note || g.alt}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] tracking-[0.14em] text-faint">{g.id ? "UPLOADED" : "HOUSE"}</span>
                      <button type="button" onClick={() => remove(g)} aria-label={asking ? `Confirm: ${g.id ? "delete" : "put away"} ${g.alt}` : `${g.id ? "Delete" : "Put away"} ${g.alt}`} className={cn("rounded-[6px] border px-3 py-[7px] font-mono text-[10.5px] tracking-[0.14em]", asking ? "border-brick bg-brick text-cream-bright" : "border-brick/35 bg-white text-brick")}>
                        {asking ? "SURE?" : g.id ? "DELETE" : "PUT AWAY"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {items && !items.length && <p className="mt-4 text-[13px] text-muted">Nothing on the gallery page. Add a photograph, or restore the house set.</p>}
        {hidden > 0 && <button type="button" onClick={restore} className="btn btn-outline mt-5 px-[22px] py-[12px] text-[11px]">Restore the house set</button>}
      </section>
    </div>
  );
}
