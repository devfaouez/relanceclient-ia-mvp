export function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

export function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[\r\n]+/g, " ")
    .replace(/["<>(),:;@[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function buildSender(params: {
  fromEmail: string;
  businessName?: string | null;
  companyEmail?: string | null;
}): { from: string; replyTo?: string } {
  const baseAddress = extractAddress(params.fromEmail);

  if (!isValidEmail(baseAddress)) {
    throw new Error("RESEND_FROM_EMAIL is invalid");
  }

  const businessName = params.businessName
    ? sanitizeDisplayName(params.businessName)
    : "";

  const displayName = businessName
    ? `${businessName} via RelanceClient`
    : "RelanceClient IA";

  const from = `${displayName} <${baseAddress}>`;

  const candidate = params.companyEmail?.trim();
  const replyTo = candidate && isValidEmail(candidate) ? candidate : undefined;

  return { from, replyTo };
}
