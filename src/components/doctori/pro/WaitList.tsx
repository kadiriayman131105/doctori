'use client';

import { FormEvent, useState } from 'react';
import { useProfiles } from '@/doctori/profiles';
import { isMoroccanMobile, whatsAppLink } from '@/doctori/phone';
import { useWaitlist } from '@/doctori/waitlist-store';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

export function WaitList({ doctorId }: { doctorId: string }) {
  const wait = useWaitlist();
  const profiles = useProfiles();
  const [ask, setAsk] = useState<{ id: string; name: string } | null>(null);
  const [formError, setFormError] = useState('');
  const toast = useToast();

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <h2 className="text-xl font-bold">Liste d’attente</h2>
      <p className="text-sm text-fb-muted">Personnes à rappeler dès qu’un créneau se libère. Le secrétariat les ajoute ici.</p>
      <form
        className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const name = String(data.get('name') || '').trim();
          const phone = String(data.get('phone') || '').trim();
          const reason = String(data.get('reason') || '').trim();
          if (name.length < 3 || !isMoroccanMobile(phone)) {
            setFormError('Indiquez un nom et un mobile marocain.');
            return;
          }
          setFormError('');
          const id = wait.add({ name, phone, reason, doctorId });
          event.currentTarget.reset();
          toast.show('Enregistré', () => wait.remove(id));
        }}
      >
        <input name="name" placeholder="Nom" className="h-11 rounded-xl border border-fb-line px-3 text-sm font-semibold" />
        <input name="phone" placeholder="06XXXXXXXX" className="h-11 rounded-xl border border-fb-line px-3 text-sm font-semibold" />
        <input name="reason" placeholder="Motif, facultatif" className="h-11 rounded-xl border border-fb-line px-3 text-sm font-semibold" />
        <button type="submit" className="h-11 rounded-xl bg-fb px-4 text-sm font-bold text-white">Ajouter</button>
      </form>
      {formError ? <p className="mt-2 text-sm font-bold text-red-600">{formError}</p> : null}
      {wait.entries.filter((entry) => entry.doctorId === doctorId).length === 0 ? <p className="mt-3 text-sm font-bold text-fb-muted">Personne en attente.</p> : null}
      <ul className="mt-3 space-y-2">
        {wait.entries.filter((entry) => entry.doctorId === doctorId).map((entry) => {
          const doctor = profiles.doctor(entry.doctorId);
          const href = whatsAppLink(
            entry.phone,
            `Bonjour ${entry.name}, un créneau s’est libéré avec ${doctor?.name ?? 'le cabinet'}. Souhaitez-vous le prendre ?`,
          );
          return (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fb-bg px-3 py-3">
              <div>
                <p className="font-bold">{entry.name}</p>
                <p className="text-sm text-fb-muted">
                  {entry.phone}
                  {doctor ? ` · ${doctor.name}` : ''}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <a href={href} target="_blank" rel="noreferrer" className="h-9 rounded-lg bg-fb-green px-3 text-sm font-bold leading-9 text-white">
                  WhatsApp
                </a>
                <button type="button" onClick={() => setAsk({ id: entry.id, name: entry.name })} className="h-9 rounded-lg px-3 text-sm font-bold text-red-600">
                  Retirer
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={Boolean(ask)}
        tone="danger"
        title="Voulez-vous vraiment supprimer ?"
        text={ask ? `${ask.name} sera retiré de la liste d’attente.` : ''}
        confirmLabel="Oui, retirer"
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          if (ask) wait.remove(ask.id);
          setAsk(null);
        }}
      />
    </section>
  );
}
