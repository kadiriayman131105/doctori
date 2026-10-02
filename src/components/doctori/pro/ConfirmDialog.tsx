'use client';

import { Pencil, Trash2, X } from 'lucide-react';

export function ConfirmDialog({
  open,
  tone,
  title,
  text,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  tone: 'edit' | 'danger';
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const danger = tone === 'danger';
  const Icon = danger ? Trash2 : Pencil;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-fb-ink/40 p-4" role="presentation" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${danger ? 'bg-red-50 text-red-600' : 'bg-fb-soft text-fb'}`}>
          <Icon size={22} />
        </div>
        <h2 id="confirm-title" className="mt-4 text-xl font-bold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-fb-muted">{text}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className="inline-flex h-11 items-center gap-1 rounded-xl bg-fb-bg px-4 text-sm font-bold">
            <X size={16} />
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex h-11 items-center gap-1 rounded-xl px-4 text-sm font-bold text-white ${danger ? 'bg-red-600' : 'bg-fb'}`}
          >
            <Icon size={16} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
