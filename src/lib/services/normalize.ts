// Merchant name normalization — deterministic rules for MVP

const KNOWN_MERCHANTS: Record<string, string> = {
  netflix: "Netflix",
  "netflix.com": "Netflix",
  spotify: "Spotify",
  "spotify ab": "Spotify",
  "apple.com/bill": "Apple",
  "apple com bill": "Apple",
  amazon: "Amazon",
  "amazon prime": "Amazon Prime",
  "amzn mktp": "Amazon",
  "google storage": "Google One",
  "google *youtube": "YouTube Premium",
  youtube: "YouTube Premium",
  "disney plus": "Disney+",
  disneyplus: "Disney+",
  adobe: "Adobe",
  "chatgpt subscription": "OpenAI",
  openai: "OpenAI",
  gym: "Gym",
  "tesco stores": "Tesco",
  sainsburys: "Sainsbury's",
};

export function normalizeMerchantName(raw: string): string {
  const lower = raw.toLowerCase().trim();

  for (const [pattern, normalized] of Object.entries(KNOWN_MERCHANTS)) {
    if (lower.includes(pattern)) return normalized;
  }

  // Fallback: title-case the raw description, strip common prefixes
  const cleaned = lower
    .replace(/^(payment to|direct debit|dd |card payment |visa |mastercard )/i, "")
    .trim();

  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function normalizeCategory(
  category?: string,
  description?: string
): string {
  if (category) return category.toLowerCase();
  if (!description) return "other";

  const lower = description.toLowerCase();
  if (lower.includes("transport") || lower.includes("uber") || lower.includes("tfl"))
    return "transport";
  if (lower.includes("food") || lower.includes("restaurant") || lower.includes("cafe"))
    return "food";
  if (lower.includes("grocery") || lower.includes("tesco") || lower.includes("sainsbury"))
    return "groceries";

  return "other";
}
