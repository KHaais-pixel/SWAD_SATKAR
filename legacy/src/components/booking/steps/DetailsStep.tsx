"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/cn";

const schema = z.object({
  name: z.string().trim().min(2, "Tell us who to expect."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,16}$/, "Enter a phone number we can reach you on."),
  email: z.string().trim().email("That email doesn't look right."),
  notes: z.string().trim().max(300, "Keep notes under 300 characters.").optional().or(z.literal("")),
});

export type DetailsValues = z.infer<typeof schema>;

interface Props {
  defaultValues: DetailsValues;
  submitting: boolean;
  error: string | null;
  formId: string;
  onChange: (v: Partial<DetailsValues>) => void;
  onSubmit: (v: DetailsValues) => void;
}

const field = "w-full rounded-card border border-hairline bg-ink/40 px-4 py-3 text-body text-paper placeholder:text-fg-muted/60 focus-visible:border-azure";

export function DetailsStep({ defaultValues, submitting, error, formId, onChange, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsValues>({ resolver: zodResolver(schema), defaultValues, mode: "onBlur" });

  const err = (name: keyof DetailsValues) => errors[name]?.message;

  return (
    <div>
      <h2 tabIndex={-1} className="text-h3 text-paper outline-none">Your details</h2>
      <p className="mt-2 text-small text-fg-muted">We only use these to hold the table and reach you if plans change.</p>

      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 space-y-4"
        onChange={(e) => {
          const t = e.target as unknown as { name?: string; value?: string };
          if (t.name) onChange({ [t.name]: t.value ?? "" } as Partial<DetailsValues>);
        }}
      >
        <div>
          <label htmlFor="bk-name" className="eyebrow mb-2 block">
            Name
          </label>
          <input id="bk-name" autoComplete="name" data-autofocus className={cn(field, err("name") && "border-alert")} aria-invalid={!!err("name")} aria-describedby={err("name") ? "bk-name-err" : undefined} {...register("name")} />
          {err("name") && (
            <p id="bk-name-err" className="mt-1.5 text-small text-alert" role="alert">
              {err("name")}
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-phone" className="eyebrow mb-2 block">
              Phone
            </label>
            <input id="bk-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+977 98…" className={cn(field, err("phone") && "border-alert")} aria-invalid={!!err("phone")} aria-describedby={err("phone") ? "bk-phone-err" : undefined} {...register("phone")} />
            {err("phone") && (
              <p id="bk-phone-err" className="mt-1.5 text-small text-alert" role="alert">
                {err("phone")}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="bk-email" className="eyebrow mb-2 block">
              Email
            </label>
            <input id="bk-email" type="email" inputMode="email" autoComplete="email" className={cn(field, err("email") && "border-alert")} aria-invalid={!!err("email")} aria-describedby={err("email") ? "bk-email-err" : undefined} {...register("email")} />
            {err("email") && (
              <p id="bk-email-err" className="mt-1.5 text-small text-alert" role="alert">
                {err("email")}
              </p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="bk-notes" className="eyebrow mb-2 block">
            Notes <span className="normal-case tracking-normal text-fg-muted">(allergies, a pram, a cake)</span>
          </label>
          <textarea id="bk-notes" rows={3} className={cn(field, "resize-none", err("notes") && "border-alert")} aria-invalid={!!err("notes")} aria-describedby={err("notes") ? "bk-notes-err" : undefined} {...register("notes")} />
          {err("notes") && (
            <p id="bk-notes-err" className="mt-1.5 text-small text-alert" role="alert">
              {err("notes")}
            </p>
          )}
        </div>
        {error && (
          <p className="rounded-card border border-alert/60 bg-chili/10 p-3 text-small text-paper" role="alert">
            {error}
          </p>
        )}
        {submitting && (
          <p className="text-small text-fg-muted" aria-live="polite">
            Holding your table…
          </p>
        )}
      </form>
    </div>
  );
}
