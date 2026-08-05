"use client";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic confirmation dialog for destructive or important actions.
 * Used for clearing history, removing alerts, disconnecting, etc.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="glass-card mx-4 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="text-foreground-muted mt-2 text-sm">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="lg" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
