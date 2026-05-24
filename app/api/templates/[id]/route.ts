import { NextRequest, NextResponse } from "next/server";
import { Prisma, TemplateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";
import { updateTemplateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const template = await prisma.reminderTemplate.findFirst({
      where: { id: params.id, userId: dbUser.id },
      select: {
        id: true,
        name: true,
        subject: true,
        body: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("TEMPLATE_GET_ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du modèle" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Les informations du modèle sont invalides",
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const existing = await prisma.reminderTemplate.findFirst({
      where: { id: params.id, userId: dbUser.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    const template = await prisma.reminderTemplate.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Un modèle avec ce nom existe déjà" },
        { status: 409 }
      );
    }
    console.error("TEMPLATE_PATCH_ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du modèle" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { dbUser } = await requireCurrentUserWithDb();

    const existing = await prisma.reminderTemplate.findFirst({
      where: { id: params.id, userId: dbUser.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    await prisma.reminderTemplate.update({
      where: { id: params.id },
      data: { status: TemplateStatus.ARCHIVED },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("TEMPLATE_DELETE_ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'archivage du modèle" },
      { status: 500 }
    );
  }
}
