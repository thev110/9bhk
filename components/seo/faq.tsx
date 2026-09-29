import type { QA } from "@/lib/seo/faq";
import { createFAQSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/json-ld";

/**
 * FAQ / answer-engine block.
 *
 * Built on native `<details>`/`<summary>` so it works with zero JavaScript —
 * the content is in the HTML from the first byte, which is what a crawler, a
 * reader-mode view and an AI answer extractor all need. A client-side accordion
 * would render nothing until hydration and would frequently produce a page whose
 * text exists only in a JS bundle.
 *
 * The `FAQPage` JSON-LD is emitted from the same `items` array that is rendered,
 * so the markup can never claim an answer the page does not show.
 */
export function FaqSection({
  items,
  heading = "Frequently asked questions",
  headingId = "faq-heading",
  schema = true,
}: {
  items: QA[];
  heading?: string;
  headingId?: string;
  /**
   * Set false when the page's own `@graph` already contains a `FAQPage`.
   * A second `FAQPage` node on the same page is a duplicate and invalidates
   * the whole structured-data graph.
   */
  schema?: boolean;
}) {
  if (!items.length) return null;
  const faqSchema = createFAQSchema(items);
  return (
    <section className="seo-faq" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <div className="seo-faq-list">
        {items.map((item) => (
          <details key={item.question} className="seo-faq-item">
            <summary>
              <span>{item.question}</span>
              <span className="seo-faq-mark" aria-hidden="true" />
            </summary>
            <div className="seo-faq-answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
      {schema && faqSchema ? <JsonLd data={faqSchema} id={`${headingId}-jsonld`} /> : null}
    </section>
  );
}

/**
 * AEO "quick answer" block.
 *
 * A single question with a direct, factual answer placed immediately under the
 * page H1. Answer engines look for a short, extractable statement that answers
 * the query without needing the rest of the page; giving them one explicitly —
 * and making sure it is genuinely the answer — is more useful than any amount
 * of extra prose.
 *
 * Rendered as a `<section>` with a visible question heading, never as hidden
 * text.
 */
export function QuickAnswer({
  question,
  answer,
  headingId = "quick-answer-heading",
}: {
  question: string;
  answer: string;
  headingId?: string;
}) {
  return (
    <section className="seo-answer" aria-labelledby={headingId}>
      <h2 id={headingId} className="seo-answer-q">
        {question}
      </h2>
      <p className="seo-answer-a">{answer}</p>
    </section>
  );
}
