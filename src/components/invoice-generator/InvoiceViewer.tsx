"use client";

import InvoicePdf from "./InvoicePdf";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  }
);

export default function InvoiceViewer() {
  return (
    <PDFViewer>
      <InvoicePdf />
    </PDFViewer>
  );
}
