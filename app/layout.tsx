import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { StoreProvider } from "@/lib/store";
import { AuthSync } from "@/components/auth-sync";
import { PwaMobileHandler } from "@/components/pwa-mobile";
import { CommandMenu } from "@/components/command-menu";
import { CatalogProvider } from "@/lib/catalog";
import "./design.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#193527",
};

export const metadata: Metadata = {
  title: { default: "9bhk.app", template: "%s · 9bhk.app" },
  description: "Farmhouses for better weekends.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "9bhk.app",
  },
  icons: { icon: "/logo-mark.png", apple: "/logo-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${serif.variable}`}>
      <body>
        <StoreProvider>
          <AuthSync />
          <CatalogProvider>{children}</CatalogProvider>
          <PwaMobileHandler />
          <CommandMenu />
          <Toaster position="top-center" richColors closeButton />
        </StoreProvider>
      </body>
    </html>
  );
}
