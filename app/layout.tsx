import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";
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

// Tamil and Telugu have no glyph coverage in the Manrope/Instrument Serif
// latin subsets, so they need their own faces or the UI renders as tofu.
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tamil",
  display: "swap",
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-telugu",
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
  description: "Coastal beach houses and automotive sanctuaries.",
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
    <html lang="en" className={`${manrope.variable} ${serif.variable} ${tamil.variable} ${telugu.variable}`}>
      <body>
        <StoreProvider>
          <AuthSync />
          <CatalogProvider>
            {children}
            <CommandMenu />
          </CatalogProvider>
          <PwaMobileHandler />
          <Toaster position="bottom-center" richColors closeButton />
        </StoreProvider>
      </body>
    </html>
  );
}
