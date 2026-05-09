import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { updateQuoteLineSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const existing = await prisma.quoteLine.findFirst({
      where: {
        id: params.id,
        quote: {
          prospect: {
            userId: dbUser.id,
          },
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = updateQuoteLineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const line = await prisma.quoteLine.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(line);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTE_LINE_PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const existing = await prisma.quoteLine.findFirst({
      where: {
        id: params.id,
        quote: {
          prospect: {
            userId: dbUser.id,
          },
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.quoteLine.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("QUOTE_LINE_DELETE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
