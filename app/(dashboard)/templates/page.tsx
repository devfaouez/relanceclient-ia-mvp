"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Edit, Plus, Search, Sparkles } from "lucide-react";
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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "createdAt" ? "desc" : "asc");
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
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
          <h1 className="text-2xl font-semibold">Modèles de relance</h1>
          {!loading && !error && (
            <p className="mt-2 text-sm text-muted-foreground">
              {templates.length} modèle{templates.length > 1 ? "s" : ""} au
              total, dont {activeCount} actif{activeCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createDefaultTemplates}
            disabled={creatingDefaults || saving}
            className="inline-flex max-w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
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
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nouveau modèle
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-emerald-600/30 bg-emerald-50 p-3 text-sm text-emerald-900">
          {success}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Modifier le modèle" : "Nouveau modèle"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Le sujet et le contenu serviront de base de rédaction.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              className="rounded-md border px-3 py-1 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Fermer
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <label className="block text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Statut</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((current) => ({ ...current, status: e.target.value }))
                }
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
            <label className="block text-sm font-medium">
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
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">
              Contenu <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={8}
              value={form.body}
              onChange={(e) =>
                setForm((current) => ({ ...current, body: e.target.value }))
              }
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-[1fr_180px_180px_180px]">
        <div>
          <label className="text-sm font-medium">Recherche</label>
          <div className="mt-2 flex items-center gap-2 rounded-md border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nom, sujet, contenu, statut..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Statut</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
          <label className="text-sm font-medium">Trier par</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="createdAt">Date de création</option>
            <option value="name">Nom</option>
            <option value="subject">Sujet</option>
            <option value="status">Statut</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ordre</label>
          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {!loading && !error && templates.length === 0 && (
        <p className="rounded-lg border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Aucun modèle pour l&apos;instant.
        </p>
      )}

      {hasNoFilteredTemplates && (
        <p className="rounded-lg border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Aucun modèle trouvé.
        </p>
      )}

      {!loading && !error && filteredTemplates.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="hover:underline"
                  >
                    Nom{sortLabel("name")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("subject")}
                    className="hover:underline"
                  >
                    Sujet{sortLabel("subject")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="hover:underline"
                  >
                    Statut{sortLabel("status")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="hover:underline"
                  >
                    Créé le{sortLabel("createdAt")}
                  </button>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{template.name}</td>
                  <td className="max-w-md px-4 py-3">
                    <p>{template.subject}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {template.body}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {templateStatusLabel(template.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(template.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEditTemplate(template)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Modifier
                      </button>

                      {template.status === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateTemplateStatus(template, "INACTIVE")
                          }
                          disabled={saving}
                          className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Désactiver
                        </button>
                      ) : template.status === "INACTIVE" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateTemplateStatus(template, "ACTIVE")
                          }
                          disabled={saving}
                          className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Réactiver
                        </button>
                      ) : null}

                      {template.status !== "ARCHIVED" && (
                        <button
                          type="button"
                          onClick={() => setArchiveConfirmTemplate(template)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium text-destructive hover:bg-muted disabled:opacity-50"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
