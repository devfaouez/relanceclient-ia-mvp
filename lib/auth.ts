import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import type { User as DbUser } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Retourne l'utilisateur Supabase Auth courant.
 * Lance UnauthorizedError si non connecté.
 */
export async function requireCurrentUser(): Promise<User> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return user;
}

/**
 * Retourne l'utilisateur Supabase Auth + l'utilisateur Prisma associé.
 * Crée l'enregistrement Prisma User s'il n'existe pas (upsert par email).
 *
 * À utiliser dans TOUTES les routes API qui doivent filtrer par userId Prisma.
 * IMPORTANT : utilisez toujours dbUser.id (cuid) et JAMAIS user.id (UUID Supabase)
 * dans les requêtes Prisma sur Prospect / Quote / Reminder / Template.
 */
export async function requireCurrentUserWithDb(): Promise<{
  authUser: User;
  dbUser: DbUser;
}> {
  const authUser = await requireCurrentUser();

  if (!authUser.email) {
    throw new UnauthorizedError();
  }

  const dbUser = await prisma.user.upsert({
    where: { email: authUser.email },
    update: {},
    create: {
      email: authUser.email,
      name:
        (authUser.user_metadata?.full_name as string | undefined) ??
        (authUser.user_metadata?.name as string | undefined) ??
        null,
    },
  });

  return { authUser, dbUser };
}
