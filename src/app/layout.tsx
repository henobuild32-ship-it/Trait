import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trait - Transfert d'argent, Troc & Marketplace",
  description: "Plateforme numérique innovante combinant transfert d'argent, troc digital et marketplace. Accessible avec ou sans internet via USSD.",
  keywords: ["Trait", "transfert", "argent", "troc", "marketplace", "USSD", "fintech", "mobile money"],
  authors: [{ name: "Trait Team" }],
  icons: {
    icon: "/trait-logo.png",
    apple: "/trait-logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Trait - Transfert d'argent, Troc & Marketplace",
    description: "Plateforme numérique innovante combinant transfert d'argent, troc digital et marketplace.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
