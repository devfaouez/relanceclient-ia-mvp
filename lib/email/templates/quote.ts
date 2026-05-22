import {
  buildEmailShell,
  cleanTemplateText,
  EMAIL_THEME,
  escapeHtml,
} from "./shared";

type QuoteEmailTemplateParams = {
  prospectName: string;
  businessName?: string | null;
  quoteLabel: string;
};

export function buildQuoteEmailText({
  prospectName,
  businessName,
  quoteLabel,
}: QuoteEmailTemplateParams) {
  const signatureName = cleanTemplateText(businessName);
  const signature = signatureName ? `\n\nCordialement,\n${signatureName}` : "";

  return `Bonjour ${prospectName},

Veuillez trouver ci-joint le devis ${quoteLabel} au format PDF.

Nous restons à votre disposition pour toute question.${signature}`;
}

export function buildQuoteEmailHtml({
  prospectName,
  businessName,
  quoteLabel,
}: QuoteEmailTemplateParams) {
  const signatureName = cleanTemplateText(businessName);
  const displayedBusinessName = signatureName ?? "Votre interlocuteur";

  return buildEmailShell({
    title: `Devis ${quoteLabel}`,
    preheader: `Votre devis ${quoteLabel} est en pièce jointe au format PDF.`,
    body: `
            <tr>
              <td style="background:${EMAIL_THEME.primary};padding:28px 32px;">
                <p style="margin:0 0 8px;color:#dff3e8;font-size:13px;line-height:18px;">Devis en pièce jointe</p>
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:32px;font-weight:700;">Devis ${escapeHtml(quoteLabel)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:24px;color:${EMAIL_THEME.text};">Bonjour ${escapeHtml(prospectName)},</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:24px;color:${EMAIL_THEME.text};">
                  Veuillez trouver ci-joint le devis <strong>${escapeHtml(quoteLabel)}</strong> au format PDF.
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:24px;color:${EMAIL_THEME.text};">
                  Nous restons à votre disposition pour toute question ou précision.
                </p>
                <div style="border-top:1px solid ${EMAIL_THEME.border};padding-top:18px;">
                  <p style="margin:0;color:${EMAIL_THEME.muted};font-size:14px;line-height:21px;">Cordialement,</p>
                  <p style="margin:4px 0 0;color:${EMAIL_THEME.primaryDark};font-size:15px;line-height:22px;font-weight:700;">${escapeHtml(displayedBusinessName)}</p>
                </div>
              </td>
            </tr>`,
  });
}
