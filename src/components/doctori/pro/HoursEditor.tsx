'use client';

import { useEffect, useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { DAY_NAMES, type DayHours, type WeekHours } from '@/doctori/hours';
import { useHours } from '@/doctori/hours-store';
import { useProfiles } from '@/doctori/profiles';
import { ConfirmDialog } from './ConfirmDialog';
import { HolidayButton } from './HolidayButton';
import { useToast } from './Toast';

export function HoursEditor({ doctorId }: { doctorId: string }) {
  const hours = useHours();
  const savedWeek = hours.week(doctorId);
  const closed = hours.closed(doctorId);
  const [draft, setDraft] = useState<WeekHours>(savedWeek);
  const [day, setDay] = useState('');
  const [note, setNote] = useState('');
  const [dayAsk, setDayAsk] = useState<{ day: string; blocked: boolean } | null>(null);
  const toast = useToast();

  useEffect(() => {
    setDraft(savedWeek);
  }, [doctorId, savedWeek]);

  function update(index: number, patch: Partial<DayHours>) {
    setDraft((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-fb-line">
      <h2 className="text-xl font-bold">Horaires du cabinet</h2>
      <p className="mt-1 text-sm text-fb-muted">Les créneaux publics ne sortent que dans ces plages, hors pause.</p>
      <ul className="mt-4 space-y-3">
        {draft.map((row, index) => (
          <li key={DAY_NAMES[index]} className="grid gap-2 rounded-2xl bg-fb-bg p-3 sm:grid-cols-[140px_1fr]">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={row.open}
                onChange={(event) => update(index, { open: event.target.checked })}
              />
              {DAY_NAMES[index]}
            </label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input type="time" value={row.start} disabled={!row.open} onChange={(event) => update(index, { start: event.target.value })} className="h-10 rounded-xl border border-fb-line px-2" />
              <span>à</span>
              <input type="time" value={row.end} disabled={!row.open} onChange={(event) => update(index, { end: event.target.value })} className="h-10 rounded-xl border border-fb-line px-2" />
              <span className="text-fb-muted">pause</span>
              <input type="time" value={row.breakStart} disabled={!row.open} onChange={(event) => update(index, { breakStart: event.target.value })} className="h-10 rounded-xl border border-fb-line px-2" />
              <span>à</span>
              <input type="time" value={row.breakEnd} disabled={!row.open} onChange={(event) => update(index, { breakEnd: event.target.value })} className="h-10 rounded-xl border border-fb-line px-2" />
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          hours.saveWeek(doctorId, draft);
          toast.show('Enregistré');
          setNote('Horaires enregistrés.');
        }}
        className="mt-4 h-11 rounded-xl bg-fb px-4 font-bold text-white"
      >
        Enregistrer les horaires
      </button>
      {note ? <p className="mt-2 text-sm font-bold text-fb-green">{note}</p> : null}

      <div className="mt-6 border-t border-fb-line pt-4">
        <h3 className="flex items-center gap-2 font-bold">
          <CalendarOff size={18} />
          Absence ou jour férié
        </h3>
        <p className="mt-1 text-sm text-fb-muted">Un clic bloque la journée. Les créneaux publics disparaissent.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="date" value={day} onChange={(event) => setDay(event.target.value)} className="h-11 rounded-xl border border-fb-line px-3" />
          <button
            type="button"
            disabled={!day}
            onClick={() => setDayAsk({ day, blocked: closed.includes(day) })}
            className="h-11 rounded-xl bg-fb-deep px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            {day && closed.includes(day) ? 'Rouvrir ce jour' : 'Bloquer ce jour'}
          </button>
        </div>
        {closed.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {closed.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setDayAsk({ day: item, blocked: true })}
                  className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700"
                >
                  {item} · rouvrir
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <HolidayButton doctorId={doctorId} />
      <ConfirmDialog
        open={Boolean(dayAsk)}
        tone="edit"
        title="Voulez-vous vraiment modifier ?"
        text={
          dayAsk
            ? dayAsk.blocked
              ? `Le ${dayAsk.day} sera de nouveau ouvert aux rendez-vous.`
              : `Le ${dayAsk.day} sera bloqué. Les créneaux publics de ce jour disparaissent.`
            : ''
        }
        confirmLabel={dayAsk?.blocked ? 'Oui, rouvrir' : 'Oui, bloquer'}
        onCancel={() => setDayAsk(null)}
        onConfirm={() => {
          if (!dayAsk) return;
          const blocked = hours.toggleClosed(doctorId, dayAsk.day);
          setNote(blocked ? `${dayAsk.day} est bloqué.` : `${dayAsk.day} est de nouveau ouvert.`);
          setDayAsk(null);
        }}
      />
    </section>
  );
}

export function AbsenceBar({ doctorId: lockedDoctorId }: { doctorId?: string }) {
  const hours = useHours();
  const profiles = useProfiles();
  const [doctorId, setDoctorId] = useState(lockedDoctorId ?? profiles.doctors[0]?.id ?? 'amal-bennani');
  const [day, setDay] = useState('');
  const [note, setNote] = useState('');
  const [dayAsk, setDayAsk] = useState(false);
  const closed = hours.closed(doctorId);

  useEffect(() => {
    if (lockedDoctorId) setDoctorId(lockedDoctorId);
  }, [lockedDoctorId]);
  const already = Boolean(day && closed.includes(day));

  return (
    <section className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <p className="text-sm font-bold">Bloquer une absence</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {lockedDoctorId ? (
          <p className="flex h-11 items-center rounded-xl bg-fb-bg px-3 text-sm font-bold">{profiles.doctor(lockedDoctorId)?.name}</p>
        ) : (
          <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="h-11 rounded-xl border border-fb-line px-3 text-sm font-bold">
            {profiles.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        )}
        <input type="date" value={day} onChange={(event) => setDay(event.target.value)} className="h-11 rounded-xl border border-fb-line px-3" />
        <button
          type="button"
          disabled={!day}
          onClick={() => setDayAsk(true)}
          className="h-11 rounded-xl bg-fb-deep px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          {day && closed.includes(day) ? 'Rouvrir ce jour' : 'Bloquer ce jour'}
        </button>
      </div>
      {note ? <p className="mt-2 text-sm font-bold text-fb-green">{note}</p> : null}
      <HolidayButton doctorId={doctorId} />
      <ConfirmDialog
        open={dayAsk}
        tone="edit"
        title="Voulez-vous vraiment modifier ?"
        text={
          already
            ? `${profiles.doctor(doctorId)?.name ?? 'Ce médecin'} reprendra le ${day}.`
            : `${profiles.doctor(doctorId)?.name ?? 'Ce médecin'} sera absent le ${day}.`
        }
        confirmLabel={already ? 'Oui, rouvrir' : 'Oui, bloquer'}
        onCancel={() => setDayAsk(false)}
        onConfirm={() => {
          const blocked = hours.toggleClosed(doctorId, day);
          const name = profiles.doctor(doctorId)?.name ?? 'Ce médecin';
          setNote(blocked ? `${name} est absent le ${day}.` : `${name} reprend le ${day}.`);
          setDayAsk(false);
        }}
      />
    </section>
  );
}
