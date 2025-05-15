"use client";

import React from "react";
import { usePDF } from "@react-pdf/renderer";
import { Button } from "../ui/button";
import InvoicePdf from "./InvoicePdf";

export default function PdfGenerator() {
  const [pdfInstance, updatePdfInstance] = usePDF({
    document: <InvoicePdf />,
  });

  const handleDownloadPdf = (): void => {
    fetch(String(pdfInstance.url), {
      method: "GET",
      headers: { "Content-Type": pdfInstance.blob?.type || "application/pdf" },
    })
      .then((response) => response.blob())
      .then((blob) => {
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;

        const invoiceFileName = `invoice_${new Date().toLocaleDateString()}.pdf`;

        // Set attribute link download
        link.setAttribute("download", invoiceFileName);

        // Append link to the element;
        document.body.appendChild(link);

        // Finally download file.
        link.click();

        // Clean up and remove it from dom
        link.parentNode?.removeChild(link);
      });
  };

  return <Button onClick={handleDownloadPdf}>Download PDF</Button>;
}
