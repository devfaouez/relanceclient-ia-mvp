"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { compareText, formatDate } from "@/lib/formatters";
import {
  TEMPLATE_STATUS_LABELS,
  templateStatusLabel,
} from "@/lib/status-labels";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type SortKey = "name" | "subject" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const emptyForm = {
  name: "",
  subject: "",
  body: "",
  status: "ACTIVE",
};

const cardClass =
  "rounded-2xl border border-border bg-card shadow-[var(--surface-shadow)]";

const inputClass =
  "mt-1.5 w-full rounded-[11px] border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-[hsl(var(--emerald-soft))] disabled:opacity-50";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-semibold leading-none text-primary-foreground shadow-[var(--surface-shadow)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border border-input bg-card px-4 py-2.5 text-sm font-semibold leading-none shadow-[var(--surface-shadow)] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

function templateStatusTone(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-[hsl(var(--emerald-soft))] text-primary";
    case "INACTIVE":
      return "bg-amber-50 text-amber-700";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${templateStatusTone(
        status,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {templateStatusLabel(status)}
    </span>
  );
}

function Message({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "success" | "error";
}) {
  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <p
      className={
        type === "success"
          ? "flex items-start gap-2 rounded-xl border border-[hsl(var(--emerald-soft))] bg-[hsl(var(--emerald-tint))] px-4 py-3 text-sm font-medium text-primary"
          : "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--emerald-tint))]/60 px-5 py-10 text-center shadow-[var(--surface-shadow)]">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[hsl(var(--emerald-soft))] bg-card text-primary">
        <Sparkles className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-[17px] font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function templateSearchText(template: Template) {
  return [
    template.name,
    template.subject,
    template.body,
    template.status,
    templateStatusLabel(template.status),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveConfirmTemplate, setArchiveConfirmTemplate] =
    useState<Template | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/templates");
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des modèles");
      }

      const items = (await res.json()) as Template[];
      setTemplates(items);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors du chargement des modèles"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = templates.filter((template) => {
      const matchesStatus =
        statusFilter === "ALL" || template.status === statusFilter;
      const matchesSearch =
        !query || templateSearchText(template).includes(query);

      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let result = 0;

      if (sortKey === "name") {
        result = compareText(a.name, b.name);
      }

      if (sortKey === "subject") {
        result = compareText(a.subject, b.subject);
      }

      if (sortKey === "status") {
        result = compareText(
          templateStatusLabel(a.status),
          templateStatusLabel(b.status)
        );
      }

      if (sortKey === "createdAt") {
        result =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [templates, searchQuery, sortDirection, sortKey, statusFilter]);

  function startNewTemplate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function startEditTemplate(template: Template) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      status: template.status,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function cancelForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("Le nom, le sujet et le contenu sont obligatoires");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(
      editingId ? `/api/templates/${editingId}` : "/api/templates",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
          status: form.status,
        }),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(
        (json as { error?: string }).error ??
          "Erreur lors de l'enregistrement du modèle"
      );
      return;
    }

    setSuccess(
      editingId
        ? "Modèle modifié avec succès."
        : "Modèle créé avec succès."
    );
    cancelForm();
    await loadTemplates();
  }

  async function updateTemplateStatus(template: Template, status: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(
        (json as { error?: string }).error ??
          "Erreur lors du changement de statut"
      );
      return;
    }

    setSuccess(
      status === "INACTIVE"
        ? "Modèle désactivé avec succès."
        : "Modèle réactivé avec succès."
    );
    await loadTemplates();
  }

  async function createDefaultTemplates() {
    setCreatingDefaults(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/templates/defaults", {
        method: "POST",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          (json as { error?: string }).error ??
            "Erreur lors de la création des modèles par défaut"
        );
        return;
      }

      const created = (json as { created?: number }).created ?? 0;
      setSuccess(
        created > 0
          ? `${created} modèle${created > 1 ? "s" : ""} par défaut créé${
              created > 1 ? "s" : ""
            } avec succès.`
          : "Tous les modèles par défaut existent déjà."
      );
      await loadTemplates();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la création des modèles par défaut"
      );
    } finally {
      setCreatingDefaults(false);
    }
  }

  async function archiveTemplate(template: Template) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/templates/${template.id}`, {
      method: "DELETE",
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(
        (json as { error?: string }).error ??
          "Erreur lors de l'archivage du modèle"
      );
      return;
    }

    if (editingId === template.id) {
      cancelForm();
    }

    setArchiveConfirmTemplate(null);
    setSuccess("Modèle archivé avec succès.");
    await loadTemplates();
  }

  const hasNoFilteredTemplates =
    !loading &&
    !error &&
    templates.length > 0 &&
    filteredTemplates.length === 0;

  const activeCount = templates.filter(
    (template) => template.status === "ACTIVE"
  ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Configuration
          </p>
          <h1 className="mt-1 text-2xl font-bold">Modèles de relance</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
            Centralisez les sujets et contenus utilisés pour générer des
            relances cohérentes. Variables utiles : {"{nom_client}"},{" "}
            {"{montant_devis}"}, {"{date_devis}"}, {"{nom_artisan}"}.
          </p>
          {!loading && !error && (
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {templates.length} modèle{templates.length > 1 ? "s" : ""} au
              total, dont {activeCount} actif{activeCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={createDefaultTemplates}
            disabled={creatingDefaults || saving}
            className={secondaryButtonClass}
          >
            {creatingDefaults ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="truncate">
              {creatingDefaults
                ? "Création..."
                : "Créer les modèles par défaut"}
            </span>
          </button>

          <button
            type="button"
            onClick={startNewTemplate}
            disabled={creatingDefaults}
            className={primaryButtonClass}
          >
            <Plus className="h-4 w-4" />
            Nouveau modèle
          </button>
        </div>
      </div>

      {error && <Message type="error">{error}</Message>}

      {success && <Message type="success">{success}</Message>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          <div className="border-b border-border bg-[hsl(var(--emerald-tint))]/70 px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {editingId ? "Modification" : "Création"}
                </p>
                <h2 className="mt-1 text-[19px] font-bold">
                  {editingId ? "Modifier le modèle" : "Nouveau modèle"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Préparez le nom interne, l&apos;objet email et le contenu qui
                  serviront de base à vos relances.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                aria-label="Fermer le formulaire"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-input bg-card text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label className="block text-sm font-semibold">
                  Nom <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ex. Première relance"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      status: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {Object.entries(TEMPLATE_STATUS_LABELS).map(
                    ([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold">
                Sujet <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={form.subject}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    subject: e.target.value,
                  }))
                }
                placeholder="Objet de l'email"
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold">
                Contenu <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                rows={9}
                value={form.body}
                onChange={(e) =>
                  setForm((current) => ({ ...current, body: e.target.value }))
                }
                placeholder="Message de relance..."
                className={`${inputClass} min-h-56 resize-y leading-6`}
              />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Vous pouvez utiliser les variables entre accolades dans le sujet
                et le contenu.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                className={secondaryButtonClass}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className={primaryButtonClass}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div
        className={`${cardClass} grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]`}
      >
        <div>
          <label className="text-[13px] font-semibold">Recherche</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-[hsl(var(--emerald-soft))]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nom, sujet, contenu, statut..."
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Statut</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(TEMPLATE_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className={inputClass}
          >
            <option value="createdAt">Date de création</option>
            <option value="name">Nom</option>
            <option value="subject">Sujet</option>
            <option value="status">Statut</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold">Ordre</label>
          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            className={inputClass}
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      {loading && (
        <div
          className={`${cardClass} flex items-center gap-2 p-5 text-sm font-medium text-muted-foreground`}
          aria-busy="true"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des modèles...
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <EmptyPanel
          title="Aucun modèle pour l'instant"
          description="Créez un premier modèle ou chargez les modèles par défaut pour démarrer vos relances plus vite."
          action={
            <button
              type="button"
              onClick={startNewTemplate}
              disabled={creatingDefaults}
              className={primaryButtonClass}
            >
              <Plus className="h-4 w-4" />
              Nouveau modèle
            </button>
          }
        />
      )}

      {hasNoFilteredTemplates && (
        <EmptyPanel
          title="Aucun modèle trouvé"
          description="Ajustez votre recherche, le statut ou l'ordre d'affichage pour retrouver un modèle existant."
        />
      )}

      {!loading && !error && filteredTemplates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <article
              key={template.id}
              className={`${cardClass} flex min-h-full flex-col p-5 transition hover:border-primary/40 hover:shadow-md`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Email de relance
                </span>
                <StatusBadge status={template.status} />
              </div>

              <div className="mt-4 min-w-0 flex-1">
                <h2 className="truncate text-[17px] font-bold">
                  {template.name}
                </h2>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Objet : {template.subject}
                </p>
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
                  {template.body}
                </p>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                  <span>Créé le {formatDate(template.createdAt)}</span>
                  <span>Mis à jour le {formatDate(template.updatedAt)}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditTemplate(template)}
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-input bg-card px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Modifier
                  </button>

                  {template.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => updateTemplateStatus(template, "INACTIVE")}
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center rounded-[10px] border border-input bg-card px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      Désactiver
                    </button>
                  ) : template.status === "INACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => updateTemplateStatus(template, "ACTIVE")}
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center rounded-[10px] border border-input bg-card px-3 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      Réactiver
                    </button>
                  ) : null}

                  {template.status !== "ARCHIVED" && (
                    <button
                      type="button"
                      onClick={() => setArchiveConfirmTemplate(template)}
                      disabled={saving}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-destructive/25 bg-card px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archiver
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(archiveConfirmTemplate)}
        title="Archiver le modèle"
        description="Le modèle ne sera plus proposé pour générer de nouvelles relances, mais il restera conservé dans l'historique."
        confirmLabel={saving ? "Archivage..." : "Archiver"}
        loading={saving}
        destructive
        onCancel={() => setArchiveConfirmTemplate(null)}
        onConfirm={() => {
          if (!archiveConfirmTemplate) return;
          archiveTemplate(archiveConfirmTemplate);
        }}
      >
        {archiveConfirmTemplate && (
          <div className="mt-4 rounded-md bg-muted/50 p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Modèle
            </p>
            <p className="mt-1 font-medium">{archiveConfirmTemplate.name}</p>
            <p className="mt-1 text-muted-foreground">
              {archiveConfirmTemplate.subject}
            </p>
          </div>
        )}
      </ConfirmModal>
    </section>
  );
}
