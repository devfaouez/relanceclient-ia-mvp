import {
  buildEmailShell,
  cleanTemplateText,
  EMAIL_THEME,
  escapeHtml,
  includesNormalizedText,
  textToHtml,
} from "./shared";

type ReminderEmailTemplateParams = {
  subject: string;
  body: string;
  signatureBlock?: string | null;
};

function getReminderContent({
  body,
  signatureBlock,
}: Pick<ReminderEmailTemplateParams, "body" | "signatureBlock">) {
  const reminderBody = body.trim();
  const signature = cleanTemplateText(signatureBlock);

  if (!signature || includesNormalizedText(reminderBody, signature)) {
    return { body: reminderBody, signature: null };
  }

  return { body: reminderBody, signature };
}

export function buildReminderEmailText({
  body,
  signatureBlock,
}: ReminderEmailTemplateParams) {
  const content = getReminderContent({ body, signatureBlock });

  if (!content.signature) {
    return content.body;
  }

  return `${content.body}\n\n--\n${content.signature}`;
}

export function buildReminderEmailHtml({
  subject,
  body,
  signatureBlock,
}: ReminderEmailTemplateParams) {
  const content = getReminderContent({ body, signatureBlock });
  const signatureHtml = content.signature
    ? `
                <div style="border-top:1px solid ${EMAIL_THEME.border};padding-top:18px;margin-top:28px;color:${EMAIL_THEME.muted};font-size:14px;line-height:21px;">
                  ${textToHtml(content.signature)}
                </div>`
    : "";

  return buildEmailShell({
    title: subject,
    preheader: subject,
    body: `
            <tr>
              <td style="background:${EMAIL_THEME.primary};padding:28px 32px;">
                <p style="margin:0 0 8px;color:#dff3e8;font-size:13px;line-height:18px;">Relance</p>
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:32px;font-weight:700;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:16px;line-height:24px;color:${EMAIL_THEME.text};">
                  ${textToHtml(content.body)}
                </div>
                ${signatureHtml}
              </td>
            </tr>`,
  });
}
