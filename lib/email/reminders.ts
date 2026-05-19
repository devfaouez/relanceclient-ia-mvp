import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

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

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .toLowerCase();
}

function buildEmailBody(reminderBody: string, signatureBlock?: string | null) {
  const body = reminderBody.trim();
  const signature = signatureBlock?.trim();

  if (!signature) {
    return body;
  }

  if (normalizeText(body).includes(normalizeText(signature))) {
    return body;
  }

  return `${body}\n\n--\n${signature}`;
}

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
    select: { signatureBlock: true },
  });

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: prospectEmail,
    subject: reminder.subject,
    text: buildEmailBody(reminder.body, preferences?.signatureBlock),
  });

  if (error) {
    throw new ReminderEmailSendError(error);
  }

  return { sent: true as const, skipped: false as const };
}
