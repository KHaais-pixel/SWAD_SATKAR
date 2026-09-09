import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  // Never index the back of house, and do not follow out of it.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminShell />;
}
