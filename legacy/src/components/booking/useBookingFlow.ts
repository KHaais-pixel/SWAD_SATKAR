"use client";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { bookingClient } from "@/lib/bookingClient";
import { emptyDraft, type Booking, type BookingDraft } from "@/lib/booking-types";
import type { BookingPrefill } from "./BookingProvider";

type Action =
  | { type: "patch"; patch: Partial<BookingDraft> }
  | { type: "step"; step: number }
  | { type: "replace"; draft: BookingDraft }
  | { type: "reset" };

const reducer = (state: BookingDraft, action: Action): BookingDraft => {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch, updatedAt: Date.now() };
    case "step":
      return { ...state, step: action.step, updatedAt: Date.now() };
    case "replace":
      return action.draft;
    case "reset":
      return emptyDraft();
  }
};

/** The first step that still needs input for this draft. */
export const firstIncompleteStep = (d: BookingDraft) => {
  if (!d.party) return 0;
  if (!d.date) return 1;
  if (!d.time) return 2;
  return Math.max(3, Math.min(d.step, 4));
};

export const isDirty = (d: BookingDraft) =>
  d.party !== null || d.date !== null || d.time !== null || d.name !== "" || d.phone !== "" || d.email !== "" || d.notes !== "";

export function useBookingFlow(prefill: BookingPrefill | null) {
  const [draft, dispatch] = useReducer(reducer, undefined, emptyDraft);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [resumable, setResumable] = useState<BookingDraft | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate: prefill beats a saved draft; a saved draft is offered, not forced.
  useEffect(() => {
    const saved = bookingClient.loadDraft();
    if (prefill && (prefill.party || prefill.date || prefill.time)) {
      const next: BookingDraft = {
        ...emptyDraft(),
        party: prefill.party ?? null,
        date: prefill.date ?? null,
        time: prefill.time ?? null,
      };
      next.step = firstIncompleteStep(next);
      dispatch({ type: "replace", draft: next });
    } else if (saved && isDirty(saved)) {
      setResumable(saved);
    }
    setHydrated(true);
  }, [prefill]);

  // Persist every change once hydrated
  useEffect(() => {
    if (!hydrated || booking) return;
    if (isDirty(draft)) bookingClient.saveDraft(draft);
  }, [draft, hydrated, booking]);

  const patch = useCallback((p: Partial<BookingDraft>) => dispatch({ type: "patch", patch: p }), []);

  const go = useCallback(
    (step: number) => {
      setDirection(step > draft.step ? 1 : -1);
      dispatch({ type: "step", step });
    },
    [draft.step],
  );

  const resume = useCallback(() => {
    if (!resumable) return;
    dispatch({ type: "replace", draft: { ...resumable, step: firstIncompleteStep(resumable) } });
    setResumable(null);
  }, [resumable]);

  const startOver = useCallback(() => {
    bookingClient.clearDraft();
    dispatch({ type: "reset" });
    setResumable(null);
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await bookingClient.createBooking(draft);
      setBooking(created);
      bookingClient.clearDraft();
      setDirection(1);
      dispatch({ type: "step", step: 5 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  return useMemo(
    () => ({ draft, booking, resumable, direction, submitting, error, hydrated, patch, go, resume, startOver, submit }),
    [draft, booking, resumable, direction, submitting, error, hydrated, patch, go, resume, startOver, submit],
  );
}
