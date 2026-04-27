import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createQuoteSchema } from "@/lib/validations";

// TODO: Replace with authenticated user ID from Supabase session
const DEMO_USER_ID = "demo-user-id";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: params.id, userId: DEMO_USER_ID },
  });

  if (!prospect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const quotes = await prisma.quote.findMany({
    where: { prospectId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotes);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: params.id, userId: DEMO_USER_ID },
  });

  if (!prospect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const quote = await prisma.quote.create({
    data: { ...parsed.data, prospectId: params.id },
  });

  return NextResponse.json(quote, { status: 201 });
}
