export const CURRENCIES: Record<string, { rate: number; symbol: string; label: string; locale: string }> = {
  USD: { rate: 1, symbol: "$", label: "US Dollar", locale: "en-US" },
  UGX: { rate: 3720, symbol: "USh ", label: "Ugandan Shilling", locale: "en-UG" },
  KES: { rate: 129, symbol: "KSh ", label: "Kenyan Shilling", locale: "en-KE" },
  NGN: { rate: 1550, symbol: "₦", label: "Nigerian Naira", locale: "en-NG" },
  GHS: { rate: 15.2, symbol: "GH₵ ", label: "Ghanaian Cedi", locale: "en-GH" },
  ZAR: { rate: 18.1, symbol: "R", label: "South African Rand", locale: "en-ZA" },
  GBP: { rate: 0.79, symbol: "£", label: "British Pound", locale: "en-GB" },
  EUR: { rate: 0.92, symbol: "€", label: "Euro", locale: "de-DE" },
};

export function convertUsd(amountUsd: number, currency: string) {
  const c = CURRENCIES[currency] ?? CURRENCIES.USD;
  const converted = amountUsd * c.rate;
  // round sensibly
  if (currency === "UGX" || currency === "NGN" || currency === "KES") {
    return Math.round(converted / 100) * 100;
  }
  return Math.round(converted * 100) / 100;
}

export function formatMoney(amountUsd: number, currency: string) {
  const c = CURRENCIES[currency] ?? CURRENCIES.USD;
  const converted = convertUsd(amountUsd, currency);
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: ["UGX", "KES", "NGN"].includes(currency) ? 0 : 2,
    }).format(converted);
  } catch {
    return `${c.symbol}${converted.toLocaleString()}`;
  }
}
