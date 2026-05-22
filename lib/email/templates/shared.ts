export const EMAIL_THEME = {
  background: "#f3f7f4",
  card: "#ffffff",
  primary: "#237a57",
  primaryDark: "#155f42",
  text: "#1f2933",
  muted: "#6b7280",
  border: "#dfe8e2",
};

export function cleanTemplateText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

export function normalizeTemplateText(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .toLowerCase();
}

export function includesNormalizedText(haystack: string, needle: string) {
  return normalizeTemplateText(haystack).includes(normalizeTemplateText(needle));
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

export function buildEmailShell({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_THEME.background};font-family:Arial,Helvetica,sans-serif;color:${EMAIL_THEME.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${EMAIL_THEME.background};margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:${EMAIL_THEME.card};border:1px solid ${EMAIL_THEME.border};border-radius:8px;overflow:hidden;">
            ${body}
          </table>
          <p style="max-width:600px;margin:16px auto 0;color:${EMAIL_THEME.muted};font-size:12px;line-height:18px;text-align:center;">
            Email envoyé depuis RelanceClient IA.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
