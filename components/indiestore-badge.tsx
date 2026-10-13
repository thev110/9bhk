export function IndieStoreBadge() {
  return (
    <a
      href="https://indiestore.co/product/9bhk.app"
      target="_blank"
      rel="noopener"
      style={{ display: "inline-block", maxWidth: "100%" }}
    >
      <img
        src="https://indiestore.co/api/badge/9bhk.app?theme=light"
        alt="Featured on IndieStore"
        width={220}
        height={54}
        loading="lazy"
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
      />
    </a>
  );
}
