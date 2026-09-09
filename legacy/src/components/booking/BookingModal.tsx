"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBooking } from "./BookingProvider";
import { useBookingFlow, isDirty } from "./useBookingFlow";
import { STEP_LABELS } from "@/lib/booking-types";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Glyphs";
import { PartyStep } from "./steps/PartyStep";
import { DateStep } from "./steps/DateStep";
import { TimeStep } from "./steps/TimeStep";
import { OccasionStep } from "./steps/OccasionStep";
import { DetailsStep, type DetailsValues } from "./steps/DetailsStep";
import { ConfirmStep } from "./steps/ConfirmStep";
import { MyReservations } from "./MyReservations";
import { cn } from "@/lib/cn";

export function BookingModal() {
  const { close, prefill } = useBooking();
  const flow = useBookingFlow(prefill);
  const { draft, booking, resumable } = flow;
  const reduced = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 640px)", true);
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const titleId = useId();
  const formId = useId();

  useFocusTrap(panelRef, true);
  useScrollLock(true);

  // On every step change, move focus to that step's heading so assistive tech
  // announces it and the user resumes at the top of the new content.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const heading = bodyRef.current?.querySelector<HTMLElement>("h2");
    heading?.focus({ preventScroll: true });
    bodyRef.current?.scrollTo({ top: 0 });
  }, [draft.step, booking]);

  const dirty = !booking && isDirty(draft);

  const requestClose = useCallback(() => {
    if (dirty && draft.step < 5) setConfirmDiscard(true);
    else close();
  }, [dirty, draft.step, close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (confirmDiscard) setConfirmDiscard(false);
        else requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose, confirmDiscard]);

  const step = booking ? 5 : draft.step;
  const canContinue =
    step === 0 ? draft.party !== null : step === 1 ? draft.date !== null : step === 2 ? draft.time !== null : true;

  const onDetails = (v: DetailsValues) => {
    flow.patch({ name: v.name, phone: v.phone, email: v.email, notes: v.notes ?? "" });
    // patch goes through the reducer, so submit reads the merged draft next tick
    queueMicrotask(() => flow.submit());
  };

  const slide = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 28 * flow.direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 * flow.direction },
      };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <motion.div
        className="absolute inset-0 bg-ink/80 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.15 : 0.3 }}
        onClick={requestClose}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={reduced ? { opacity: 0 } : desktop ? { opacity: 0, y: 24, scale: 0.98 } : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "absolute flex flex-col bg-char text-fg shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]",
          desktop
            ? "left-1/2 top-1/2 max-h-[min(92vh,820px)] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-hairline"
            : "inset-0",
        )}
      >
        {/* Progress */}
        <div className="border-b border-hairline px-5 pb-4 pt-5 sm:px-8">
          <div className="flex items-center justify-between">
            <p id={titleId} className="eyebrow">
              {booking ? "Reservation confirmed" : `Reserve · ${STEP_LABELS[step]}`}
            </p>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-muted hover:text-paper"
            >
              <CloseIcon />
            </button>
          </div>
          <ol className="mt-3 flex gap-1.5" aria-label={`Step ${step + 1} of ${STEP_LABELS.length}`}>
            {STEP_LABELS.map((label, i) => (
              <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
                <span className="sr-only">{label}</span>
                <span
                  className={cn(
                    "block h-[3px] rounded-full transition-colors duration-[var(--dur-std)]",
                    i < step ? "bg-azure" : i === step ? "bg-glow" : "bg-hairline",
                  )}
                  aria-hidden
                />
              </li>
            ))}
          </ol>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="relative flex-1 overflow-y-auto px-5 pb-8 pt-6 sm:px-8">
          {resumable ? (
            <div>
              <h2 tabIndex={-1} className="text-h3 text-paper outline-none">
                Continue your reservation?
              </h2>
              <p className="mt-2 text-small text-fg-muted">
                You started booking{resumable.party ? ` a table for ${resumable.party}` : ""}
                {resumable.date
                  ? ` on ${new Date(resumable.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
                  : ""}
                . Pick up where you left off, or start fresh.
              </p>
              <div className="mt-6 flex gap-3">
                <Button onClick={flow.resume} data-autofocus>
                  Continue
                </Button>
                <Button variant="ghost" onClick={flow.startOver}>
                  Start over
                </Button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false} custom={flow.direction}>
              <motion.div key={step} {...slide} transition={{ duration: reduced ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}>
                {step === 0 && <PartyStep value={draft.party} onChange={(party) => flow.patch({ party, time: null })} />}
                {step === 1 && <DateStep value={draft.date} onChange={(date) => flow.patch({ date, time: null })} />}
                {step === 2 && draft.date && draft.party && (
                  <TimeStep date={draft.date} party={draft.party} value={draft.time} onChange={(time) => flow.patch({ time })} />
                )}
                {step === 3 && <OccasionStep occasion={draft.occasion} seating={draft.seating} onChange={(p) => flow.patch(p)} />}
                {step === 4 && (
                  <DetailsStep
                    formId={formId}
                    defaultValues={{ name: draft.name, phone: draft.phone, email: draft.email, notes: draft.notes }}
                    submitting={flow.submitting}
                    error={flow.error}
                    onChange={(v) => flow.patch(v)}
                    onSubmit={onDetails}
                  />
                )}
                {step === 5 && booking && <ConfirmStep booking={booking} />}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Past bookings made in this browser */}
          {!resumable && (
            <div className="mt-8 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setShowMine((s) => !s)}
                aria-expanded={showMine}
                className="text-small text-fg-muted underline-offset-4 hover:text-azure hover:underline"
              >
                {showMine ? "Hide my reservations" : "My reservations"}
              </button>
              {showMine && (
                <div className="mt-3">
                  <MyReservations />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!resumable && (
          <div className="border-t border-hairline px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              {step > 0 && step < 5 ? (
                <Button variant="ghost" size="sm" onClick={() => flow.go(step - 1)}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              {step < 4 && (
                <Button size="sm" onClick={() => flow.go(step + 1)} disabled={!canContinue}>
                  {step === 3 ? (draft.seating || draft.occasion !== "none" ? "Continue" : "Skip") : "Continue"}
                </Button>
              )}
              {step === 4 && (
                <Button size="sm" type="submit" form={formId} disabled={flow.submitting}>
                  {flow.submitting ? "Holding…" : "Confirm reservation"}
                </Button>
              )}
              {step === 5 && (
                <Button size="sm" onClick={close}>
                  Done
                </Button>
              )}
            </div>
            <p className="mt-3 text-[0.75rem] text-fg-muted">Demo booking, not connected to the restaurant&rsquo;s system yet.</p>
          </div>
        )}

        {/* Discard guard */}
        {confirmDiscard && (
          <div
            role="alertdialog"
            aria-labelledby={`${titleId}-discard`}
            aria-modal="true"
            className="absolute inset-0 z-10 grid place-items-center bg-char/90 p-6"
          >
            <div className="max-w-[360px] text-center">
              <p id={`${titleId}-discard`} className="text-h3 text-paper">
                Leave without booking?
              </p>
              <p className="mt-2 text-small text-fg-muted">We&rsquo;ll keep what you&rsquo;ve entered for 24 hours.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button size="sm" onClick={close} data-autofocus>
                  Leave
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDiscard(false)}>
                  Keep booking
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
