"use client";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

export interface BookingPrefill {
  party?: number;
  date?: string;
  time?: string;
}

interface BookingContextValue {
  isOpen: boolean;
  prefill: BookingPrefill | null;
  open: (prefill?: BookingPrefill) => void;
  close: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

const BookingModal = dynamic(() => import("./BookingModal").then((m) => m.BookingModal), { ssr: false });

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);
  const params = useSearchParams();

  const open = useCallback((p?: BookingPrefill) => {
    setPrefill(p ?? null);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // Deep link: ?book=1&party=4&date=2026-09-12&time=19:30
  useEffect(() => {
    if (params.get("book") === "1") {
      const party = Number(params.get("party"));
      open({
        party: Number.isFinite(party) && party > 0 ? party : undefined,
        date: params.get("date") ?? undefined,
        time: params.get("time") ?? undefined,
      });
    }
  }, [params, open]);

  const value = useMemo(() => ({ isOpen, prefill, open, close }), [isOpen, prefill, open, close]);

  return (
    <BookingContext.Provider value={value}>
      {children}
      {isOpen && <BookingModal />}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
};
