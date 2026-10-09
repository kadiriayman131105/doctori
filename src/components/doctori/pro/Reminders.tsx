'use client';

import { useState } from 'react';
import type { ClinicPatient, Consult } from '@/doctori/types';
import { useProfiles } from '@/doctori/profiles';
import { formatLong, formatWhen, isSameDay } from '@/doctori/slots';
import { whatsAppLink } from '@/doctori/phone';
import { clashesAt } from '@/doctori/hours';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

type Kind = 'veille' | 'bientot';

function due(consults: Consult[], now = new Date()) {
  const rows: { consult: Consult; kind: Kind }[] = [];
  for (const consult of consults) {
    if (consult.flow === 'annule' || consult.flow === 'absent' || consult.flow === 'termine') continue;
    const start = new Date(consult.start);
    if (start.getTime() < now.getTime() - 30 * 60 * 1000) continue;
    if (!consult.remindedEve && isSameDay(consult.start, 1)) rows.push({ consult, kind: 'veille' });
    const delta = start.getTime() - now.getTime();
    if (!consult.remindedSoon && delta > 0 && delta <= 2 * 60 * 60 * 1000) rows.push({ consult, kind: 'bientot' });
  }
  return rows.sort((a, b) => +new Date(a.consult.start) - +new Date(b.consult.start));
}

export function reminderCount(consults: Consult[]) {
  return due(consults).length;
}

export function Reminders({
  consults,
  patients,
  onConsult,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
}) {
  const profiles = useProfiles();
  const toast = useToast();
  const rows = due(consults);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [ask, setAsk] = useState<{ id: string; name: string } | null>(null);
  const [clash, setClash] = useState<{ text: string; run: () => void } | null>(null);

  function openWhatsApp(consult: Consult, kind: Kind) {
    const patient = patients.find((item) => item.id === consult.patientId);
    const doctor = profiles.doctor(consult.doctorId);
    if (!patient) return;
    const text = `Bonjour ${patient.name}, rappel de votre rendez-vous avec ${doctor?.name ?? 'votre médecin'} le ${formatLong(consult.start)}. Adresse : ${doctor?.address ?? 'cabinet'}. Merci de confirmer, ou dites-nous si vous devez déplacer.`;
    window.open(whatsAppLink(patient.phone, text), '_blank', 'noopener,noreferrer');
    onConsult(consult.id, kind === 'veille' ? { remindedEve: true } : { remindedSoon: true });
    toast.show('WhatsApp ouvert');
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <h2 className="text-xl font-bold">Rappels</h2>
      <p className="text-sm text-fb-muted">Message WhatsApp déjà rédigé (gratuit, wa.me). La veille, puis dans les deux heures.</p>
      {rows.length === 0 ? <p className="mt-3 text-sm font-bold text-fb-muted">Aucun rappel à envoyer pour le moment.</p> : null}
      <ul className="mt-3 space-y-3">
        {rows.map(({ consult, kind }) => {
          const patient = patients.find((item) => item.id === consult.patientId);
          const doctor = profiles.doctor(consult.doctorId);
          return (
            <li key={`${consult.id}-${kind}`} className="rounded-2xl bg-fb-bg p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-fb">{kind === 'veille' ? 'Rappel de la veille' : 'Dans moins de 2 heures'}</p>
              <p className="mt-1 font-bold">{patient?.name}</p>
              <p className="text-sm text-fb-muted">
                {formatWhen(consult.start)} · {doctor?.name} · {consult.reason}
                {patient?.phone ? ` · ${patient.phone}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => openWhatsApp(consult, kind)} className="h-9 rounded-lg bg-fb-green px-3 text-sm font-bold text-white">
                  WhatsApp
                </button>
                <button type="button" onClick={() => setMoveId(moveId === consult.id ? null : consult.id)} className="h-9 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">
                  Déplacer
                </button>
                <button
                  type="button"
                  onClick={() => setAsk({ id: consult.id, name: patient?.name ?? 'ce patient' })}
                  className="h-9 rounded-lg px-3 text-sm font-bold text-red-600"
                >
                  Annuler
                </button>
              </div>
              {moveId === consult.id ? (
                <form
                  className="mt-2 flex flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const date = String(data.get('date') || '');
                    const time = String(data.get('time') || '');
                    const start = new Date(`${date}T${time}`);
                    if (Number.isNaN(start.getTime())) return;
                    const iso = start.toISOString();
                    const apply = () => {
                      onConsult(consult.id, { start: iso, remindedSoon: false });
                      setMoveId(null);
                      toast.show('Enregistré');
                    };
                    const other = clashesAt(consults, consult.doctorId, iso, consult.id);
                    if (other) {
                      const name = patients.find((item) => item.id === other.patientId)?.name ?? 'Un autre patient';
                      setClash({
                        text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
                        run: apply,
                      });
                      return;
                    }
                    apply();
                  }}
                >
                  <input name="date" type="date" required className="h-10 rounded-lg border border-fb-line px-2" />
                  <input name="time" type="time" required className="h-10 rounded-lg border border-fb-line px-2" />
                  <button type="submit" className="h-10 rounded-lg bg-fb px-3 text-sm font-bold text-white">
                    Enregistrer
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={Boolean(ask)}
        tone="danger"
        title="Voulez-vous vraiment annuler ?"
        text={ask ? `Le rendez-vous de ${ask.name} sera annulé.` : ''}
        confirmLabel="Oui, annuler"
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          if (ask) onConsult(ask.id, { flow: 'annule' });
          setAsk(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(clash)}
        tone="edit"
        title="Ce créneau est déjà pris"
        text={clash?.text ?? ''}
        confirmLabel="Continuer quand même"
        onCancel={() => setClash(null)}
        onConfirm={() => {
          clash?.run();
          setClash(null);
        }}
      />
    </section>
  );
}
