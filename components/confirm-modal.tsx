import type { ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  children,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmClassName = destructive
    ? "rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
    : "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 print:hidden">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-lg">
        <h2 className="text-lg font-bold">{title}</h2>

        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}

        {children}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={confirmClassName}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
