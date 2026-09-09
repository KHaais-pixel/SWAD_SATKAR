"use client";
import { useState } from "react";
import Link from "next/link";
import { restaurant } from "@/data/restaurant";
import { Logo } from "@/components/ui/Logo";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { cn } from "@/lib/cn";
import { ReservationsPanel } from "./ReservationsPanel";
import { ServicePanel } from "./ServicePanel";
import { MenuPanel } from "./MenuPanel";

const TABS = [
  { id: "reservations", label: "Reservations" },
  { id: "service", label: "Service" },
  { id: "menu", label: "Menu" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminShell() {
  const [tab, setTab] = useState<TabId>("reservations");

  return (
    <div className="min-h-[100dvh] bg-ink">
      <header className="border-b border-hairline bg-char/60">
        <div className="container-site flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span aria-hidden className="h-8 w-px bg-hairline" />
            <p className="eyebrow">Back of house</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-small text-fg-muted underline-offset-4 hover:text-paper hover:underline"
          >
            View the public site
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main id="main" className="container-site pb-24 pt-8">
        <h1 className="text-h2 text-paper">{restaurant.name} admin</h1>

        {/* Not security theatre: say plainly what this is. */}
        <div
          role="note"
          className="mt-6 rounded-card border border-alert/50 bg-alert/10 p-4 text-small text-paper"
        >
          <p className="font-medium">Demo panel, unprotected and local to this browser.</p>
          <p className="mt-1 text-fg-muted">
            Reservations, closing days and menu prices are stored in this browser only, so this panel cannot see
            bookings made by guests on their own devices. Before launch this route needs a real backend and a login.
            Every place a server call belongs is marked <code className="text-azure">TODO(backend)</code> in{" "}
            <code className="text-azure">src/lib/adminClient.ts</code>.
          </p>
        </div>

        {/* Tabs must be direct children of the tablist, so no list wrapper. */}
        <div role="tablist" aria-label="Admin sections" className="mt-8 flex flex-wrap gap-1 border-b border-hairline">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onKeyDown={(e) => {
                const i = TABS.findIndex((x) => x.id === tab);
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
                  setTab(next.id);
                  document.getElementById(`tab-${next.id}`)?.focus();
                }
              }}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex min-h-11 items-center px-4 text-small transition-colors duration-[var(--dur-micro)]",
                tab === t.id ? "text-paper" : "text-fg-muted hover:text-paper",
              )}
            >
              {t.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-colors duration-[var(--dur-std)]",
                  tab === t.id ? "bg-azure" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-8">
          {tab === "reservations" && <ReservationsPanel />}
          {tab === "service" && <ServicePanel />}
          {tab === "menu" && <MenuPanel />}
        </div>
      </main>
    </div>
  );
}
