const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

export function formatAmount(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function compareText(a: unknown, b: unknown) {
  return String(a ?? "").localeCompare(String(b ?? ""), "fr");
}
