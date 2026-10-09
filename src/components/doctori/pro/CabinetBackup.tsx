'use client';

import { useRef, useState } from 'react';
import { downloadBackup, readBackup, restoreBackup } from '@/doctori/backup';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

export function CabinetBackup() {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ReturnType<typeof readBackup>>(null);
  const [error, setError] = useState('');

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <h2 className="font-bold">Sauvegarde du cabinet</h2>
      <p className="text-sm text-fb-muted">Patients, rendez-vous, horaires, caisse, liste d’attente et profil. À garder hors du navigateur, avant Mongo.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            downloadBackup();
            toast.show('Fichier JSON téléchargé.');
          }}
          className="h-11 rounded-xl bg-fb px-4 text-sm font-bold text-white"
        >
          Exporter tout
        </button>
        <button type="button" onClick={() => input.current?.click()} className="h-11 rounded-xl bg-fb-soft px-4 text-sm font-bold text-fb-deep">
          Importer
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            file.text().then((text) => {
              const backup = readBackup(text);
              if (!backup) {
                setError('Ce fichier n’est pas une sauvegarde Doctori.');
                return;
              }
              setError('');
              setPending(backup);
            });
          }}
        />
      </div>
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
      <ConfirmDialog
        open={Boolean(pending)}
        tone="danger"
        title="Voulez-vous vraiment importer ?"
        text="Les données actuelles de ce navigateur seront remplacées par ce fichier."
        confirmLabel="Oui, restaurer"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) restoreBackup(pending);
          window.location.reload();
        }}
      />
    </section>
  );
}
