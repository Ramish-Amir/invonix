import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { ThemeProvider } from "@/providers/theme-provider";
import { Provider as JotaiProvider } from "jotai";
import AuthSync from "@/components/auth/AuthSync";
import CompanyLoader from "@/components/auth/CompanyLoader";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: "Invonix - Construction Estimator",
  description: "Professional construction takeoff and estimation tool",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Invonix - Construction Estimator",
    description: "Professional construction takeoff and estimation tool",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invonix - Construction Estimator",
    description: "Professional construction takeoff and estimation tool",
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <JotaiProvider>
            <AuthSync>
              <CompanyLoader />
              <main>{children}</main>
            </AuthSync>
          </JotaiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
