import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { AuthSync } from "@/components/auth-sync";
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

export const metadata: Metadata = {
  title: { default: "9bhk.app", template: "%s · 9bhk.app" },
  description: "Farmhouses for better weekends.",
  icons: { icon: "/logo-mark.png", apple: "/logo-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${serif.variable}`}>
      <body>
        <StoreProvider>
          <AuthSync />
          <CatalogProvider>{children}</CatalogProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
