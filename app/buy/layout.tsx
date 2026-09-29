import type { Metadata } from "next";
import { getIndexableProperties } from "@/lib/server/catalog";
import { generateBuyMetadata } from "@/lib/seo/metadata";

/**
 * `/buy` — the estates-for-sale surface.
 *
 * This is a genuine public marketplace feature — a distinct search intent from
 * the nightly-stay catalog — so it is indexable. The page itself is a client
 * component; this layout supplies the metadata, which has to be exported from a
 * server module.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const properties = await getIndexableProperties();
  return generateBuyMetadata(properties.filter((property) => property.isForSale).length);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
