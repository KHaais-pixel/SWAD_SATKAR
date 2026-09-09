"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { LOADING_EVENT, LOADING_SEEN_KEY } from "@/lib/loading";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/** Never shown for less than this: the mark deserves a beat. */
const MIN_MS = 900;
/** Never shown for more than this, whatever the connection is doing. */
const MAX_MS = 3200;

/**
 * A navy screen with the mark, held until the landing page has its first
 * frame, then gone. While it is up the page cannot scroll and the hero's
 * entrance waits, so the two never race. Shown once per visit.
 */
export function Loader() {
  const reduced = useReducedMotion();
  // Rendered on the server as showing, so it is on screen from the first
  // paint; an inline script in the document head has already decided whether
  // this visit needs it and set a class on <html> that the styles honour.
  const [state, setState] = useState<"showing" | "leaving" | "done">("showing");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // The head script decided before paint: a repeat view, or an arrival
    // from another page of the site, is already marked loaded.
    if (!document.documentElement.classList.contains("is-loading")) {
      setState("done");
      return;
    }
    window.__lenis?.stop();
    const started = performance.now();
    let ready = false;
    let timer: number | undefined;

    const leave = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      setProgress(1);
      setState("leaving");
      document.documentElement.classList.remove("is-loading");
      window.__lenis?.start();
      try {
        sessionStorage.setItem(LOADING_SEEN_KEY, "1");
      } catch {}
      window.setTimeout(() => setState("done"), reduced ? 200 : 700);
    };
    const maybeLeave = () => {
      const elapsed = performance.now() - started;
      if (ready && elapsed >= MIN_MS) leave();
      else if (ready) timer = window.setTimeout(leave, MIN_MS - elapsed);
    };
    const onReady = (e: Event) => {
      const p = (e as CustomEvent<number>).detail;
      setProgress((prev) => Math.max(prev, p));
      if (p >= 0.6 && !ready) {
        ready = true;
        maybeLeave();
      }
    };
    window.addEventListener(LOADING_EVENT, onReady);
    const ceiling = window.setTimeout(() => {
      if (!ready) {
        ready = true;
        leave();
      }
    }, MAX_MS);
    return () => {
      window.removeEventListener(LOADING_EVENT, onReady);
      window.clearTimeout(ceiling);
      if (timer !== undefined) window.clearTimeout(timer);
      document.documentElement.classList.remove("is-loading");
    };
  }, [reduced]);

  if (state === "done") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Swad Satkar"
      data-loader
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-night transition-opacity duration-700 ease-out",
        state === "leaving" && "pointer-events-none opacity-0",
      )}
    >
      <div className="loader-mark is-in">
        <Logo variant="full" size="lg" asLink={false} />
      </div>
      <span className="block h-px w-28 overflow-hidden bg-hairline" aria-hidden>
        <span className="block h-full bg-azure transition-[width] duration-300 ease-out" style={{ width: `${Math.round(Math.max(0.12, progress) * 100)}%` }} />
      </span>
    </div>
  );
}
