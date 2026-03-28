"use client";

import dynamic from "next/dynamic";

const CRMModule = dynamic(
  () => import("@/components/modules/crm"),
  { ssr: false }
);

export default function CRMPage() {
  return <CRMModule />;
}
