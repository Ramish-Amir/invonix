import PdfGenerator from "@/components/invoice-generator/InvoiceDownloader";

export default function CreateInvoicePage() {
  return (
    <>
      <h2 className="text-gray-500">Create new Invoice</h2>
      <PdfGenerator />
    </>
  );
}
