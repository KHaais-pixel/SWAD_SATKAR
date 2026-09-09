"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useBooking } from "./BookingProvider";

/** The only client boundary needed to open the reservation flow. */
export function BookButton({
  children,
  size = "md",
  variant = "primary",
  className,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "ghost" | "paper";
  className?: string;
}) {
  const { open } = useBooking();
  return (
    <Button size={size} variant={variant} className={className} onClick={() => open()}>
      {children}
    </Button>
  );
}
