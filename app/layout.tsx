import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";
import { Toaster } from "sonner";
import { StoreProvider } from "@/lib/store";
import dynamic from "next/dynamic";
import { AuthSync } from "@/components/auth-sync";
import { PwaMobileHandler } from "@/components/pwa-mobile";
import { CatalogProvider } from "@/lib/catalog";

const CommandMenu = dynamic(() => import("@/components/command-menu").then((mod) => mod.CommandMenu), {
  ssr: false,
});
import { JsonLd } from "@/components/seo/json-ld";
import { graph, createOrganizationSchema, createWebsiteSchema } from "@/lib/seo/schema";
import { SITE, SITE_URL, absoluteUrl, siteVerification } from "@/lib/seo/site";
import { rootMetadataBase } from "@/lib/seo/metadata";
import "./design.css";
import "./seo.css";

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
  themeColor: SITE.themeColor,
};

/**
 * Root metadata.
 *
 * This is the site-wide default only. Every indexable route overrides it with
 * its own `generateMetadata` so that titles, descriptions and canonicals are
 * unique per page; the homepage supplies the one canonical that legitimately
 * points at the site root. `metadataBase` is what turns any relative URL in the
 * metadata into an absolute one — without it Next.js emits `/`-rooted OG image
 * and canonical URLs, which are useless to a crawler that fetched the page from
 * `https://www.9bhk.app`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "9bhk.app — private farmhouses, beach houses & villas for groups",
    template: "%s · 9bhk.app",
  },
  description: SITE.description,
  applicationName: SITE.displayName,
  creator: "Rathnavel Karthi",
  authors: [{ name: "Rathnavel Karthi", url: "https://www.linkedin.com/in/rathnavel-karthi-114991135/" }],
  manifest: "/manifest.json",
  alternates: { canonical: absoluteUrl("/") },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.displayName,
    locale: SITE.locale,
    url: absoluteUrl("/"),
    title: "9bhk.app — private farmhouses, beach houses & villas for groups",
    description: SITE.description,
    images: [
      {
        url: absoluteUrl("/logo-wordmark.png"),
        width: 2004,
        height: 785,
        alt: "9bhk.app — private stays for groups",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "9bhk.app — private farmhouses, beach houses & villas for groups",
    description: SITE.description,
    images: [absoluteUrl("/logo-wordmark.png")],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE.displayName,
  },
  icons: { icon: "/logo-mark.png", apple: "/logo-mark.png" },
  ...rootMetadataBase,
  ...(siteVerification.google
    ? {
        /* Emitted only when the value is actually configured — a
           `google-site-verification` meta with empty content is worse than none. */
        other: { "google-site-verification": siteVerification.google },
      }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.lang} className={`${manrope.variable} ${serif.variable} ${tamil.variable} ${telugu.variable}`}>
      <head>
        {/*
          Site-level structured data, rendered on every page.

          `Organization` carries only facts the site can stand behind: the brand
          token, the canonical URL, the logo that ships in `/public`, and the one
          contact address the legal pages already publish. There is no telephone,
          no postal address, no `sameAs` and no `aggregateRating` — inventing any
          of those is exactly the fabricated entity signal Google penalises, and
          `lib/seo/site.ts` leaves them undefined until the business supplies
          real values.

          Page-level graphs reference these two nodes by `@id` rather than
          re-declaring them, so the brand is one node across the whole site.
        */}
        <JsonLd data={graph(createOrganizationSchema(), createWebsiteSchema())} id="site-entity" />
      </head>
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
