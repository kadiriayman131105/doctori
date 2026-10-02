'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useMemo, useState } from 'react';
import type { ClinicPatient, Consult, VisitFlow, VisitType } from '@/doctori/types';
import { FLOW_LABEL, PAY_LABEL } from '@/doctori/clinic';
import { VISIT_LABEL } from '@/doctori/data';
import { clashesAt } from '@/doctori/hours';
import { formatWhen } from '@/doctori/slots';
import { dueAmount, inRange, payState } from './money';
import { ConfirmDialog } from './ConfirmDialog';

const ClinicCalendar = dynamic(() => import('./ClinicCalendar').then((mod) => mod.ClinicCalendar), { ssr: false });

function localDate(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const FLOWS: Array<VisitFlow | ''> = ['', 'a_venir', 'en_cours', 'termine', 'absent', 'annule'];
const TYPES: Array<VisitType | ''> = ['', 'cabinet', 'video', 'domicile'];

export function Agenda({
  consults,
  patients,
  onConsult,
  onOpenPatient,
  onAdd,
  doctorId,
  defaultFee,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
  onOpenPatient?: (patientId: string) => void;
  onAdd?: (input: Omit<Consult, 'id'>) => void;
  doctorId?: string;
  defaultFee?: number;
}) {
  const [query, setQuery] = useState('');
  const [flow, setFlow] = useState<VisitFlow | ''>('');
  const [pay, setPay] = useState<'' | 'paye' | 'impaye' | 'partiel'>('');
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [kind, setKind] = useState<VisitType | ''>('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [createAt, setCreateAt] = useState<string | null>(null);
  const [created, setCreated] = useState('');
  const [clash, setClash] = useState<{ text: string; run: () => void } | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return consults
      .filter((item) => {
        const patient = patients.find((entry) => entry.id === item.patientId);
        if (needle && !`${patient?.name ?? ''} ${item.reason}`.toLowerCase().includes(needle)) return false;
        if (flow && item.flow !== flow) return false;
        if (pay && payState(item) !== pay) return false;
        if (kind && item.visitType !== kind) return false;
        if (!inRange(item.start, range)) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.start) - +new Date(a.start));
  }, [consults, patients, query, flow, pay, kind, range]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <label className="block text-xs font-bold uppercase tracking-wide text-fb-muted">
          Patient ou motif
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, diabète, certificat…"
            className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold outline-none ring-fb focus:ring-2"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLOWS.map((item) => (
            <button
              key={item || 'tous-flow'}
              type="button"
              onClick={() => setFlow(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${flow === item ? 'bg-fb text-white' : 'bg-fb-bg'}`}
            >
              {item ? FLOW_LABEL[item] : 'Tous les états'}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['today', 'Aujourd’hui'],
              ['week', '7 jours'],
              ['month', '30 jours'],
              ['all', 'Tout'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${range === value ? 'bg-fb-deep text-white' : 'bg-fb-bg'}`}
            >
              {label}
            </button>
          ))}
          {(['', 'paye', 'partiel', 'impaye'] as const).map((item) => (
            <button
              key={item || 'tous-pay'}
              type="button"
              onClick={() => setPay(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${pay === item ? 'bg-fb-green text-white' : 'bg-fb-bg'}`}
            >
              {item ? PAY_LABEL[item] : 'Tout paiement'}
            </button>
          ))}
          {TYPES.map((item) => (
            <button
              key={item || 'tous-type'}
              type="button"
              onClick={() => setKind(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${kind === item ? 'bg-fb text-white' : 'bg-fb-bg'}`}
            >
              {item ? VISIT_LABEL[item] : 'Tous les modes'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-fb-muted">{rows.length} rendez-vous · glissez un créneau pour changer l’heure</p>
        {onAdd ? (
          <button type="button" onClick={() => setCreateAt(new Date().toISOString())} className="rounded-full bg-fb px-4 py-2 text-sm font-bold text-white">
            Nouveau rendez-vous
          </button>
        ) : null}
      </div>
      {created ? <p className="text-sm font-bold text-fb-green">{created}</p> : null}
      {createAt && onAdd && doctorId ? (
        <form
          className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-fb-line sm:grid-cols-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const date = String(data.get('date') || '');
            const time = String(data.get('time') || '');
            const patientId = String(data.get('patientId') || '');
            const start = new Date(`${date}T${time}`);
            if (!patientId || Number.isNaN(start.getTime())) return;
            const input = {
              doctorId,
              patientId,
              start: start.toISOString(),
              visitType: 'cabinet' as const,
              reason: String(data.get('reason') || 'Consultation').trim() || 'Consultation',
              flow: 'a_venir' as const,
              listPrice: Math.max(0, Number(data.get('price')) || defaultFee || 0),
              discount: 0,
              paid: 0,
              note: '',
            };
            const place = () => {
              onAdd(input);
              setCreated(`Rendez-vous ajouté le ${formatWhen(start.toISOString())}.`);
              setRange('all');
              setCreateAt(null);
            };
            const other = clashesAt(consults, doctorId, input.start);
            if (other) {
              const name = patients.find((item) => item.id === other.patientId)?.name ?? 'Un autre patient';
              setClash({
                text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
                run: place,
              });
              return;
            }
            place();
          }}
        >
          <label className="text-sm font-bold">
            Patient
            <select name="patientId" required className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold">
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Prix (DH)
            <input name="price" type="number" min={0} defaultValue={defaultFee ?? 0} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
          </label>
          <label className="text-sm font-bold">
            Date
            <input name="date" type="date" required defaultValue={localDate(createAt)} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3" />
          </label>
          <label className="text-sm font-bold">
            Heure
            <input
              name="time"
              type="time"
              required
              defaultValue={`${String(new Date(createAt).getHours()).padStart(2, '0')}:${String(new Date(createAt).getMinutes()).padStart(2, '0')}`}
              className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3"
            />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            Motif
            <input name="reason" defaultValue="Consultation" className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
          </label>
          <button type="submit" className="h-11 rounded-xl bg-fb font-bold text-white sm:col-span-2">
            Ajouter à l’agenda
          </button>
        </form>
      ) : null}
      <ClinicCalendar
        consults={rows}
        patients={patients}
        editable
        onMove={(id, start) => {
          const item = consults.find((entry) => entry.id === id);
          const other = item ? clashesAt(consults, item.doctorId, start, id) : undefined;
          const apply = () => onConsult(id, { start });
          if (!other) {
            apply();
            return;
          }
          const name = patients.find((entry) => entry.id === other.patientId)?.name ?? 'Un autre patient';
          setClash({
            text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
            run: apply,
          });
        }}
        onSelect={setOpenId}
        onCreate={onAdd ? setCreateAt : undefined}
      />
      <ul className="space-y-2">
        {rows.filter((item) => item.id === openId).map((item) => {
          const patient = patients.find((entry) => entry.id === item.patientId);
          const due = dueAmount(item);
          const state = payState(item);
          const open = openId === item.id;
          return (
            <li key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
              <button type="button" onClick={() => setOpenId(open ? null : item.id)} className="flex w-full items-start justify-between gap-3 text-left">
                <div>
                  <p className="font-bold">{patient?.name}</p>
                  <p className="text-sm text-fb-muted">
                    {formatWhen(item.start)} · {VISIT_LABEL[item.visitType]} · {item.reason}
                  </p>
                  <p className="mt-1 text-sm">
                    {patient?.sex === 'F' ? 'Femme' : 'Homme'} · {patient?.age} ans · {patient?.conditions}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-fb">{FLOW_LABEL[item.flow]}</p>
                  <p className={`text-sm font-bold ${state === 'paye' ? 'text-fb-green' : 'text-fb-ink'}`}>
                    {PAY_LABEL[state]} · {due} DH
                  </p>
                </div>
              </button>
              {open ? (
                <div className="mt-3 grid gap-3 border-t border-fb-bg pt-3 sm:grid-cols-2">
                  <div className="flex flex-wrap gap-2">
                    {item.flow !== 'en_cours' && item.flow !== 'termine' ? (
                      <button type="button" className="rounded-lg bg-fb px-3 py-1.5 text-sm font-bold text-white" onClick={() => onConsult(item.id, { flow: 'en_cours' })}>
                        En cours
                      </button>
                    ) : null}
                    {item.flow !== 'termine' && item.flow !== 'annule' ? (
                      <button type="button" className="rounded-lg bg-fb-green px-3 py-1.5 text-sm font-bold text-white" onClick={() => onConsult(item.id, { flow: 'termine' })}>
                        Terminé
                      </button>
                    ) : null}
                    {item.flow !== 'absent' && item.flow !== 'annule' ? (
                      <button type="button" className="rounded-lg bg-fb-bg px-3 py-1.5 text-sm font-bold" onClick={() => onConsult(item.id, { flow: 'absent' })}>
                        Absent
                      </button>
                    ) : null}
                    {item.flow !== 'annule' ? (
                      <button type="button" className="rounded-lg px-3 py-1.5 text-sm font-bold text-red-600" onClick={() => onConsult(item.id, { flow: 'annule' })}>
                        Annuler
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-xs font-bold text-fb-muted">
                      Tarif
                      <input value={item.listPrice} readOnly className="mt-1 h-10 w-full rounded-lg border border-fb-line bg-fb-bg px-2 text-sm font-semibold" />
                    </label>
                    <label className="text-xs font-bold text-fb-muted">
                      Remise
                      <input
                        type="number"
                        min={0}
                        max={item.listPrice}
                        value={item.discount}
                        onChange={(event) => onConsult(item.id, { discount: Number(event.target.value) || 0 })}
                        className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold"
                      />
                    </label>
                    <label className="text-xs font-bold text-fb-muted">
                      Payé
                      <input
                        type="number"
                        min={0}
                        value={item.paid}
                        onChange={(event) => onConsult(item.id, { paid: Number(event.target.value) || 0 })}
                        className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold"
                      />
                    </label>
                  </div>
                  <label className="text-xs font-bold text-fb-muted sm:col-span-2">
                    Note de consultation
                    <textarea
                      value={item.note}
                      onChange={(event) => onConsult(item.id, { note: event.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-fb-line px-2 py-1.5 text-sm font-medium"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => onConsult(item.id, { paid: due })}
                      className="h-10 rounded-lg bg-fb-soft px-3 text-sm font-bold text-fb-deep"
                    >
                      Marquer comme payé ({due} DH)
                    </button>
                    {onOpenPatient ? (
                      <button
                        type="button"
                        onClick={() => onOpenPatient(item.patientId)}
                        className="h-10 rounded-lg bg-fb px-3 text-sm font-bold text-white"
                      >
                        Historique du patient
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
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
    </div>
  );
}
