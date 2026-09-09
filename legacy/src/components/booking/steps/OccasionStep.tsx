"use client";
import { occasionLabel, seatingLabel, type Occasion, type Seating } from "@/lib/booking-types";
import { Pill } from "../Pill";

interface Props {
  occasion: Occasion;
  seating: Seating | null;
  onChange: (p: { occasion?: Occasion; seating?: Seating | null }) => void;
}

export function OccasionStep({ occasion, seating, onChange }: Props) {
  return (
    <div>
      <h2 tabIndex={-1} className="text-h3 text-paper outline-none">Anything to mark?</h2>
      <p className="mt-2 text-small text-fg-muted">Optional. It helps us set the table right.</p>

      <fieldset className="mt-6">
        <legend className="eyebrow mb-3">Occasion</legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {(Object.keys(occasionLabel) as Occasion[]).map((o) => (
            <Pill key={o} selected={occasion === o} onClick={() => onChange({ occasion: o })}>
              {occasionLabel[o]}
            </Pill>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="eyebrow mb-3">Seating</legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {(Object.keys(seatingLabel) as Seating[]).map((s) => (
            <Pill key={s} selected={seating === s} onClick={() => onChange({ seating: seating === s ? null : s })}>
              {seatingLabel[s]}
            </Pill>
          ))}
        </div>
        <p className="mt-3 text-[0.8125rem] text-fg-muted/80">Terrace and bar seating are subject to weather and space on the night.</p>
      </fieldset>
    </div>
  );
}
