"use client";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="ghost" onClick={() => window.print()}>
      Print or save as PDF
    </Button>
  );
}
