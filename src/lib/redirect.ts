export function safeInternalPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  const url = new URL(value, "https://kingrhymes.invalid");
  if (url.origin !== "https://kingrhymes.invalid") return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
