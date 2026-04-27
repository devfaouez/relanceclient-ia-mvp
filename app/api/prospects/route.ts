import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProspectSchema } from "@/lib/validations";

// TODO: Replace with authenticated user ID from Supabase session
const DEMO_USER_ID = "demo-user-id";

export async function GET() {
  const prospects = await prisma.prospect.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prospects);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createProspectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const prospect = await prisma.prospect.create({
    data: { ...parsed.data, userId: DEMO_USER_ID },
  });

  return NextResponse.json(prospect, { status: 201 });
}
