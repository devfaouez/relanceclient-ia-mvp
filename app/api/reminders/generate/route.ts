import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { generateReminderSchema } from "@/lib/validations";
import { ReminderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function buildBody(
  prospectName: string,
  quoteTitle: string,
  amount: { toString(): string } | null,
  currency: string
): string {
  const amountPart = amount
    ? ` d'un montant de ${amount.toString()} ${currency}`
    : "";
  return `Bonjour,

Nous nous permettons de vous relancer au sujet du devis « ${quoteTitle} »${amountPart} établi pour ${prospectName}.

Sans retour de votre part, nous souhaitions savoir si vous avez des questions ou si vous souhaitez donner suite à cette proposition.

Nous restons à votre disposition pour tout renseignement complémentaire.

Cordialement,
L'équipe RelanceClient IA`;
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const quote = await prisma.quote.findFirst({
    where: {
      id: parsed.data.quoteId,
      prospect: { userId: user.id },
    },
    include: { prospect: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      quoteId: quote.id,
      templateId: parsed.data.templateId ?? null,
      subject: "Relance concernant votre devis",
      body: buildBody(
        quote.prospect.name,
        quote.title,
        quote.amount,
        quote.currency
      ),
      status: ReminderStatus.PENDING_APPROVAL,
      requiresHumanApproval: true,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}
