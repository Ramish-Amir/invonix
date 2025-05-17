"use client";

import PageSpinner from "../general/page-spinner";
import InvoicePdf from "./InvoicePdf";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <PageSpinner />,
  }
);

export default function InvoiceViewer() {
  return (
    <PDFViewer>
      <InvoicePdf />
    </PDFViewer>
  );
}
