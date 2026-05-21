import { NextResponse } from "next/server";
import { TemplateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireCurrentUserWithDb,
  UnauthorizedError,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const defaultTemplates = [
  {
    name: "Relance douce après 3 jours",
    subject: "Suite à notre devis",
    body: "Bonjour,\n\nJe me permets de revenir vers vous au sujet du devis transmis il y a quelques jours.\n\nAvez-vous eu le temps d'en prendre connaissance ? Je reste disponible si vous avez la moindre question ou si vous souhaitez ajuster certains éléments.\n\nBien cordialement,",
  },
  {
    name: "Relance normale après 7 jours",
    subject: "Relance concernant votre devis",
    body: "Bonjour,\n\nJe reviens vers vous concernant le devis envoyé la semaine dernière.\n\nPouvez-vous me dire si le projet est toujours d'actualité de votre côté ? Je peux bien sûr vous apporter des précisions si nécessaire.\n\nBien cordialement,",
  },
  {
    name: "Dernière relance avant clôture",
    subject: "Dernière relance avant clôture du dossier",
    body: "Bonjour,\n\nSans retour de votre part, je me permets de vous adresser une dernière relance concernant le devis transmis.\n\nSi vous souhaitez avancer, je reste disponible pour convenir des prochaines étapes. À défaut, je clôturerai le dossier dans les prochains jours.\n\nBien cordialement,",
  },
  {
    name: "Relance devis urgent",
    subject: "Votre retour attendu concernant le devis",
    body: "Bonjour,\n\nJe me permets de vous relancer rapidement au sujet du devis transmis, car le planning se remplit et les disponibilités peuvent évoluer.\n\nPouvez-vous me confirmer si vous souhaitez valider cette proposition ou si certains points doivent être revus ?\n\nBien cordialement,",
  },
  {
    name: "Relance client professionnel",
    subject: "Suivi de notre proposition commerciale",
    body: "Bonjour,\n\nJe fais suite à notre échange et à la proposition transmise.\n\nAvez-vous pu l'étudier en interne ? Je reste à votre disposition pour répondre à vos questions, clarifier le périmètre ou adapter la proposition si besoin.\n\nBien cordialement,",
  },
] as const;

export async function POST() {
  try {
    const { dbUser } = await requireCurrentUserWithDb();
    const defaultNames = defaultTemplates.map((template) => template.name);

    const existingTemplates = await prisma.reminderTemplate.findMany({
      where: {
        userId: dbUser.id,
        name: { in: defaultNames },
      },
      select: { name: true },
    });

    const existingNames = new Set(
      existingTemplates.map((template) => template.name)
    );
    const missingTemplates = defaultTemplates.filter(
      (template) => !existingNames.has(template.name)
    );

    if (missingTemplates.length === 0) {
      return NextResponse.json({ created: 0 });
    }

    const result = await prisma.reminderTemplate.createMany({
      data: missingTemplates.map((template) => ({
        userId: dbUser.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        status: TemplateStatus.ACTIVE,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("TEMPLATES_DEFAULTS_CREATE_ERROR:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création des modèles par défaut" },
      { status: 500 }
    );
  }
}
