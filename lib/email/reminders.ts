import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  buildReminderEmailHtml,
  buildReminderEmailText,
} from "@/lib/email/templates/reminder";
import { buildSender } from "@/lib/email/sender";

export class ReminderEmailConfigurationError extends Error {
  constructor() {
    super("Email configuration missing");
    this.name = "ReminderEmailConfigurationError";
  }
}

export class ReminderEmailSendError extends Error {
  constructor(cause: unknown) {
    super("Failed to send reminder email");
    this.name = "ReminderEmailSendError";
    this.cause = cause;
  }
}

type ReminderWithProspect = Prisma.ReminderGetPayload<{
  include: {
    quote: {
      include: {
        prospect: true;
      };
    };
  };
}>;

export function getReminderEmailConfig() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    throw new ReminderEmailConfigurationError();
  }

  return { resendApiKey, fromEmail };
}

export async function sendReminderEmail(
  reminder: ReminderWithProspect,
  userId: string
) {
  const prospectEmail = reminder.quote.prospect.email?.trim();
  if (!prospectEmail) {
    return { sent: false as const, skipped: true as const };
  }

  const { resendApiKey, fromEmail } = getReminderEmailConfig();

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { businessName: true, companyEmail: true, signatureBlock: true },
  });
  const sender = buildSender({
    fromEmail,
    businessName: preferences?.businessName,
    companyEmail: preferences?.companyEmail,
  });

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: sender.from,
    to: prospectEmail,
    replyTo: sender.replyTo,
    subject: reminder.subject,
    text: buildReminderEmailText({
      subject: reminder.subject,
      body: reminder.body,
      signatureBlock: preferences?.signatureBlock,
    }),
    html: buildReminderEmailHtml({
      subject: reminder.subject,
      body: reminder.body,
      signatureBlock: preferences?.signatureBlock,
    }),
  });

  if (error) {
    throw new ReminderEmailSendError(error);
  }

  return { sent: true as const, skipped: false as const };
}
