import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold">RelanceClient IA</p>
          <nav className="flex gap-3 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/login">
              Connexion
            </Link>
            <Link className="font-medium text-primary hover:underline" href="/register">
              Inscription
            </Link>
          </nav>
        </header>

        <section className="max-w-2xl py-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
            MVP artisans du batiment
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Suivi de devis et relances validees par l&apos;artisan.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Squelette initial Next.js 14. Les fonctionnalites metier seront
            ajoutees dans les prochaines etapes.
          </p>
        </section>
      </div>
    </main>
  );
}
