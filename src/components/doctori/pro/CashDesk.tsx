'use client';

import { useEffect, useState } from 'react';
import type { ClinicPatient, Consult, PayMethod } from '@/doctori/types';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { ConfirmDialog } from './ConfirmDialog';
import { dayStamp, dueAmount, sameDay } from './money';

const CLOSE_KEY = 'doctori-cash-close-v1';

interface CloseNote {
  at: string;
  cash: number;
  card: number;
  open: number;
}

export function CashDesk({
  consults,
  patients,
  onConsult,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
}) {
  const profiles = useProfiles();
  const todayKey = dayStamp(new Date().toISOString());
  const [closed, setClosed] = useState<CloseNote | null>(null);
  const [askClose, setAskClose] = useState(false);
  const [askPay, setAskPay] = useState<{ id: string; method: PayMethod; name: string; rest: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLOSE_KEY);
      const saved = raw ? (JSON.parse(raw) as Record<string, CloseNote>) : {};
      setClosed(saved[todayKey] ?? null);
    } catch {
      setClosed(null);
    }
  }, [todayKey]);

  const rows = consults
    .filter((item) => sameDay(item.start) && item.flow !== 'annule' && item.flow !== 'absent')
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const cash = rows.filter((item) => item.payMethod !== 'carte').reduce((sum, item) => sum + item.paid, 0);
  const card = rows.filter((item) => item.payMethod === 'carte').reduce((sum, item) => sum + item.paid, 0);
  const open = rows.reduce((sum, item) => sum + Math.max(0, dueAmount(item) - item.paid), 0);

  function closeDay() {
    const note = { at: new Date().toISOString(), cash, card, open };
    const raw = localStorage.getItem(CLOSE_KEY);
    const saved = raw ? (JSON.parse(raw) as Record<string, CloseNote>) : {};
    saved[todayKey] = note;
    localStorage.setItem(CLOSE_KEY, JSON.stringify(saved));
    setClosed(note);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <h2 className="text-xl font-bold">Caisse du jour</h2>
        <p className="text-sm text-fb-muted">Espèces, carte, et ce qui reste à encaisser.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <p className="rounded-2xl bg-fb-soft px-4 py-3"><span className="block text-xs font-bold uppercase text-fb-muted">Espèces</span><span className="text-2xl font-bold">{cash} DH</span></p>
          <p className="rounded-2xl bg-fb-bg px-4 py-3"><span className="block text-xs font-bold uppercase text-fb-muted">Carte</span><span className="text-2xl font-bold">{card} DH</span></p>
          <p className="rounded-2xl bg-fb-bg px-4 py-3"><span className="block text-xs font-bold uppercase text-fb-muted">Reste dû</span><span className="text-2xl font-bold">{open} DH</span></p>
        </div>
        {closed ? (
          <p className="mt-3 text-sm font-bold text-fb-green">
            Journée clôturée · espèces {closed.cash} DH · carte {closed.card} DH · reste {closed.open} DH
          </p>
        ) : (
          <button type="button" onClick={() => setAskClose(true)} className="mt-4 h-11 rounded-xl bg-fb px-4 font-bold text-white">
            Clôturer la journée
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {rows.length === 0 ? <li className="rounded-2xl bg-white p-4 text-sm font-bold text-fb-muted ring-1 ring-fb-line">Aucune visite aujourd’hui.</li> : null}
        {rows.map((item) => {
          const patient = patients.find((entry) => entry.id === item.patientId);
          const due = dueAmount(item);
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-fb-line">
              <div>
                <p className="font-bold">{patient?.name ?? 'Patient'}</p>
                <p className="text-sm text-fb-muted">
                  {formatWhen(item.start)} · {item.reason} · {profiles.doctor(item.doctorId)?.name} · payé {item.paid} / {due} DH
                </p>
              </div>
              <div className="flex gap-2">
                {(['especes', 'carte'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setAskPay({ id: item.id, method, name: patient?.name ?? 'ce patient', rest: Math.max(0, due - item.paid) })}
                    className={`h-9 rounded-lg px-3 text-sm font-bold ${item.payMethod === method || (method === 'especes' && item.paid > 0 && !item.payMethod) ? 'bg-fb text-white' : 'bg-fb-bg'}`}
                  >
                    {method === 'especes' ? 'Espèces' : 'Carte'}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={askClose}
        tone="edit"
        title="Voulez-vous vraiment clôturer ?"
        text={`Espèces ${cash} DH, carte ${card} DH, reste dû ${open} DH.`}
        confirmLabel="Oui, clôturer"
        onCancel={() => setAskClose(false)}
        onConfirm={() => {
          closeDay();
          setAskClose(false);
        }}
      />
      <ConfirmDialog
        open={Boolean(askPay)}
        tone="edit"
        title="Voulez-vous vraiment modifier ?"
        text={
          askPay
            ? askPay.rest > 0
              ? `Encaisser ${askPay.rest} DH pour ${askPay.name} en ${askPay.method === 'carte' ? 'carte' : 'espèces'}.`
              : `Le paiement de ${askPay.name} sera noté en ${askPay.method === 'carte' ? 'carte' : 'espèces'}.`
            : ''
        }
        confirmLabel="Oui, modifier"
        onCancel={() => setAskPay(null)}
        onConfirm={() => {
          if (askPay) {
            const item = consults.find((entry) => entry.id === askPay.id);
            const due = item ? dueAmount(item) : 0;
            onConsult(askPay.id, { payMethod: askPay.method, ...(item && item.paid < due ? { paid: due } : {}) });
          }
          setAskPay(null);
        }}
      />
    </section>
  );
}
