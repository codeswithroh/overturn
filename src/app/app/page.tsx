import type { Metadata } from "next";
import { Suspense } from "react";
import Dashboard from "@/components/dash/Dashboard";

export const metadata: Metadata = { title: "Overturn · Dashboard" };

export default function AppPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
