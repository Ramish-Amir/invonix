import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: "Invonix - Invoice Manager",
  description: "Efficient payment tracking and management",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Invonix - Invoice Manager",
    description: "Efficient payment tracking and management",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invonix - Invoice Manager",
    description: "Efficient payment tracking and management",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="ligth" enableSystem>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
