'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { holidaysFor } from '@/doctori/holidays';
import { useHours } from '@/doctori/hours-store';
import { ConfirmDialog } from './ConfirmDialog';

function dayLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day));
}

export function HolidayButton({ doctorId }: { doctorId: string }) {
  const hours = useHours();
  const year = new Date().getFullYear();
  const holidays = holidaysFor(year);
  const closed = hours.closed(doctorId);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [ask, setAsk] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setPicked(holidays.filter((item) => closed.includes(item.date)).map((item) => item.date));
    // Reprend la sélection déjà enregistrée pour ce médecin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, closed.join('|')]);

  if (holidays.length === 0) return null;

  function toggle(date: string) {
    setPicked((current) => (current.includes(date) ? current.filter((item) => item !== date) : [...current, date]));
  }

  function apply() {
    const holidayDates = new Set(holidays.map((item) => item.date));
    const kept = closed.filter((day) => !holidayDates.has(day));
    hours.saveClosed(doctorId, [...kept, ...picked]);
    setNote(`${picked.length} férié${picked.length > 1 ? 's' : ''} fermé${picked.length > 1 ? 's' : ''}.`);
  }

  const names = holidays.filter((item) => picked.includes(item.date)).map((item) => item.name);

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-fb-line bg-white px-3 text-left text-sm font-bold"
      >
        <span>
          Jours fériés {year}
          {picked.length ? <span className="ml-2 font-semibold text-fb">{picked.length} fermé{picked.length > 1 ? 's' : ''}</span> : null}
        </span>
        <ChevronDown size={18} className={open ? 'rotate-180' : ''} />
      </button>
      {open ? (
        <div className="mt-2 rounded-2xl border border-fb-line p-3">
          <p className="text-xs text-fb-muted">Cochez les fêtes à fermer pour ce médecin. Les fêtes lunaires suivent le calendrier annoncé pour {year}.</p>
          <div className="mt-3 flex gap-3 text-sm font-bold">
            <button type="button" className="text-fb" onClick={() => setPicked(holidays.map((item) => item.date))}>Tout cocher</button>
            <button type="button" className="text-fb-muted" onClick={() => setPicked([])}>Tout décocher</button>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {holidays.map((item) => (
              <li key={item.date}>
                <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-fb-bg px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={picked.includes(item.date)}
                    onChange={() => toggle(item.date)}
                  />
                  <span>
                    <span className="font-bold">{item.name}</span>
                    <span className="block text-fb-muted">{dayLabel(item.date)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setAsk(true)} className="mt-3 h-11 rounded-xl bg-fb px-4 text-sm font-bold text-white">
            Appliquer la sélection
          </button>
          {note ? <p className="mt-2 text-sm font-bold text-fb-green">{note}</p> : null}
        </div>
      ) : null}
      <ConfirmDialog
        open={ask}
        tone="edit"
        title="Voulez-vous vraiment modifier ?"
        text={names.length ? `${names.join(', ')} seront fermés.` : 'Aucun jour férié ne sera fermé. Les fêtes décochées redeviennent ouvertes.'}
        confirmLabel="Oui, appliquer"
        onCancel={() => setAsk(false)}
        onConfirm={() => {
          apply();
          setAsk(false);
        }}
      />
    </div>
  );
}
