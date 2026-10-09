'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ClinicPatient, Consult, VisitFlow, VisitType } from '@/doctori/types';
import { FLOW_LABEL, PAY_LABEL } from '@/doctori/clinic';
import { VISIT_LABEL } from '@/doctori/data';
import { clashesAt } from '@/doctori/hours';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { dueAmount, inInterval, inRange, payState } from './money';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';
import { matchesPatient } from '@/doctori/phone';
import { DateSpan, spanBounds } from './DateSpan';
import { GuardedNumber } from './GuardedNumber';
import { PrintDesk } from './PrintDesk';
import { Receipt } from './Receipt';
import { Reminders } from './Reminders';
import { FollowUpButton } from './FollowUp';
import { VisitDrawer } from './VisitDrawer';
import type { PatientDocKind } from '@/doctori/patient-docs';

const ClinicCalendar = dynamic(() => import('./ClinicCalendar').then((mod) => mod.ClinicCalendar), { ssr: false });

function localDate(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const FLOWS: Array<VisitFlow | ''> = ['', 'a_venir', 'arrive', 'en_cours', 'termine', 'absent', 'annule'];
const TYPES: Array<VisitType | ''> = ['', 'cabinet', 'video', 'domicile'];

export function Agenda({
  consults,
  patients,
  onConsult,
  onOpenPatient,
  onAdd,
  onOpenDocument,
  doctorId,
  defaultFee,
  allConsults,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
  onOpenPatient?: (patientId: string) => void;
  onAdd?: (input: Omit<Consult, 'id'>) => string | void;
  onOpenDocument?: (patientId: string, consultId: string, kind?: PatientDocKind) => void;
  doctorId?: string;
  defaultFee?: number;
  allConsults?: Consult[];
}) {
  const [query, setQuery] = useState('');
  const [flow, setFlow] = useState<VisitFlow | ''>('');
  const [pay, setPay] = useState<'' | 'paye' | 'impaye' | 'partiel'>('');
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [kind, setKind] = useState<VisitType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [jumpTo, setJumpTo] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [createAt, setCreateAt] = useState<string | null>(null);
  const [created, setCreated] = useState('');
  const [ask, setAsk] = useState<{ tone: 'edit' | 'danger' | 'add'; title: string; text: string; confirm: string; run: () => void } | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [tension, setTension] = useState('');
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [printId, setPrintId] = useState<string | null>(null);
  const profiles = useProfiles();
  const toast = useToast();
  const openVisit = consults.find((item) => item.id === openId);
  const openNote = openVisit?.note ?? '';
  const openTension = openVisit?.tension ?? '';
  const openWeight = openVisit?.weight ?? '';
  const openTemperature = openVisit?.temperature ?? '';

  useEffect(() => {
    setNoteDraft(openNote);
    setTension(openTension);
    setWeight(openWeight);
    setTemperature(openTemperature);
  }, [openId, openNote, openTension, openWeight, openTemperature]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return consults
      .filter((item) => {
        const patient = patients.find((entry) => entry.id === item.patientId);
        if (needle && !(patient ? matchesPatient(patient, query) : false) && !item.reason.toLowerCase().includes(needle)) return false;
        if (flow && item.flow !== flow) return false;
        if (pay && payState(item) !== pay) return false;
        if (kind && item.visitType !== kind) return false;
        if (from || to) {
          if (!inInterval(item.start, from, to)) return false;
        } else if (!inRange(item.start, range)) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.start) - +new Date(a.start));
  }, [consults, patients, query, flow, pay, kind, range, from, to]);

  return (
    <div className="space-y-4">
      <Reminders consults={consults} patients={patients} onConsult={onConsult} />
      <div className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <label className="block text-xs font-bold uppercase tracking-wide text-fb-muted">
          Patient ou motif
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, téléphone, motif…"
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
              onClick={() => {
                setRange(value);
                setFrom('');
                setTo('');
                setJumpTo('');
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${!from && !to && range === value ? 'bg-fb-deep text-white' : 'bg-fb-bg'}`}
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
        <DateSpan from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
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
              setFrom('');
              setTo('');
              setJumpTo(start.toISOString());
              setCreateAt(null);
              toast.show('Enregistré');
            };
            const other = clashesAt(consults, doctorId, input.start);
            if (other) {
              const name = patients.find((item) => item.id === other.patientId)?.name ?? 'Un autre patient';
              setAsk({
                tone: 'edit',
                title: 'Ce créneau est déjà pris',
                text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
                confirm: 'Continuer quand même',
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
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_380px]">
      <ClinicCalendar
        consults={rows}
        patients={patients}
        editable
        focusDate={from || jumpTo || undefined}
        bounds={spanBounds(from, to)}
        onMove={(id, start) => {
          const item = consults.find((entry) => entry.id === id);
          const other = item ? clashesAt(consults, item.doctorId, start, id) : undefined;
          const apply = () => {
            onConsult(id, { start });
            setRange('all');
            setFrom('');
            setTo('');
            setJumpTo(start);
            toast.show('Enregistré');
          };
          if (other) {
            const name = patients.find((entry) => entry.id === other.patientId)?.name ?? 'Un autre patient';
            setAsk({
              tone: 'edit',
              title: 'Ce créneau est déjà pris',
              text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
              confirm: 'Continuer quand même',
              run: apply,
            });
            return;
          }
          apply();
        }}
        onSelect={setOpenId}
        onCreate={onAdd ? setCreateAt : undefined}
      />
      {(() => {
        const item = consults.find((entry) => entry.id === openId);
        const patient = patients.find((entry) => entry.id === item?.patientId);
        if (!item || !patient) {
          return <p className="rounded-2xl bg-white p-6 text-sm font-bold text-fb-muted ring-1 ring-fb-line">Cliquez un rendez-vous pour voir le patient et son historique.</p>;
        }
        const due = dueAmount(item);
        const history = (allConsults ?? consults).filter((entry) => entry.patientId === patient.id).sort((a, b) => +new Date(b.start) - +new Date(a.start));
        return (
          <VisitDrawer
            consult={item}
            patient={patient}
            doctorName={profiles.doctor(item.doctorId)?.name}
            history={history}
            onClose={() => setOpenId(null)}
            onOpenDoc={onOpenDocument ? (consultId, kind) => onOpenDocument(patient.id, consultId, kind) : undefined}
          >
            <div className="mt-3 grid gap-2">
              <div className="flex flex-wrap gap-2">
                {item.flow !== 'arrive' && item.flow !== 'en_cours' && item.flow !== 'termine' && item.flow !== 'annule' ? (
                  <button type="button" className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-bold text-white" onClick={() => { const prev = item.flow; onConsult(item.id, { flow: 'arrive' }); toast.show('Enregistré', () => onConsult(item.id, { flow: prev })); }}>Arrivé</button>
                ) : null}
                {item.flow !== 'en_cours' && item.flow !== 'termine' && item.flow !== 'annule' ? (
                  <button type="button" className="rounded-lg bg-fb px-3 py-1.5 text-sm font-bold text-white" onClick={() => { const prev = item.flow; onConsult(item.id, { flow: 'en_cours' }); toast.show('Enregistré', () => onConsult(item.id, { flow: prev })); }}>En consultation</button>
                ) : null}
                {item.flow !== 'termine' && item.flow !== 'annule' ? (
                  <button type="button" className="rounded-lg bg-fb-green px-3 py-1.5 text-sm font-bold text-white" onClick={() => { const prev = item.flow; onConsult(item.id, { flow: 'termine' }); toast.show('Enregistré', () => onConsult(item.id, { flow: prev })); }}>Terminé</button>
                ) : null}
                {item.flow !== 'absent' && item.flow !== 'annule' && item.flow !== 'termine' ? (
                  <button type="button" className="rounded-lg bg-fb-bg px-3 py-1.5 text-sm font-bold" onClick={() => setAsk({ tone: 'edit', title: 'Voulez-vous vraiment modifier ?', text: `${patient.name} sera marqué absent. Le créneau redevient libre.`, confirm: 'Oui, marquer absent', run: () => onConsult(item.id, { flow: 'absent' }) })}>Absent</button>
                ) : null}
                {item.flow !== 'annule' ? (
                  <button type="button" className="rounded-lg px-3 py-1.5 text-sm font-bold text-red-600" onClick={() => setAsk({ tone: 'danger', title: 'Voulez-vous vraiment annuler ?', text: `Le rendez-vous de ${patient.name} sera annulé et le créneau redevient libre.`, confirm: 'Oui, annuler', run: () => onConsult(item.id, { flow: 'annule' }) })}>Annuler</button>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs font-bold text-fb-muted">Tension<input value={tension} onChange={(event) => setTension(event.target.value)} placeholder="13/8" className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold" /></label>
                <label className="text-xs font-bold text-fb-muted">Poids (kg)<input value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="72" className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold" /></label>
                <label className="text-xs font-bold text-fb-muted">Température<input value={temperature} onChange={(event) => setTemperature(event.target.value)} placeholder="37.2" className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold" /></label>
              </div>
              <label className="text-xs font-bold text-fb-muted">
                Note de consultation
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={3}
                  placeholder="Observation, traitement, suite à donner…"
                  className="mt-1 w-full rounded-lg border border-fb-line px-2 py-2 text-sm font-medium"
                />
              </label>
              {noteDraft !== item.note || tension !== (item.tension ?? '') || weight !== (item.weight ?? '') || temperature !== (item.temperature ?? '') ? (
                <button
                  type="button"
                  onClick={() => {
                    const prev = { note: item.note, tension: item.tension, weight: item.weight, temperature: item.temperature };
                    onConsult(item.id, { note: noteDraft, tension, weight, temperature });
                    toast.show('Enregistré', () => onConsult(item.id, prev));
                  }}
                  className="h-10 rounded-lg bg-fb px-3 text-sm font-bold text-white"
                >
                  Enregistrer la visite
                </button>
              ) : null}
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs font-bold text-fb-muted">Tarif<input value={item.listPrice} readOnly className="mt-1 h-10 w-full rounded-lg border border-fb-line bg-fb-bg px-2 text-sm font-semibold" /></label>
                <GuardedNumber label="Remise" min={0} max={item.listPrice} value={item.discount} onCommit={(discount) => onConsult(item.id, { discount })} className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold" />
                <GuardedNumber label="Payé" min={0} value={item.paid} onCommit={(paid) => onConsult(item.id, { paid })} className="mt-1 h-10 w-full rounded-lg border border-fb-line px-2 text-sm font-semibold" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setAsk({ tone: 'edit', title: 'Voulez-vous vraiment encaisser ?', text: `Encaisser ${due} DH pour ${patient.name}.`, confirm: 'Oui, encaisser', run: () => { onConsult(item.id, { paid: due }); setReceiptId(item.id); } })} className="h-10 rounded-lg bg-fb-soft px-3 text-sm font-bold text-fb-deep">Encaisser {due} DH</button>
                {item.paid > 0 ? <button type="button" onClick={() => setReceiptId(item.id)} className="h-10 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">Reçu</button> : null}
                <button
                  type="button"
                  onClick={() => (onOpenDocument ? onOpenDocument(item.patientId, item.id) : setPrintId(item.id))}
                  className="h-10 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line"
                >
                  Document
                </button>
                {onOpenPatient ? <button type="button" onClick={() => onOpenPatient(item.patientId)} className="h-10 rounded-lg bg-fb px-3 text-sm font-bold text-white">Fiche complète</button> : null}
                <FollowUpButton consult={item} patient={patient} consults={allConsults ?? consults} onAdd={onAdd} />
              </div>
            </div>
          </VisitDrawer>
        );
      })()}
      </div>
      {(() => {
        const printing = consults.find((item) => item.id === printId);
        const printingPatient = patients.find((item) => item.id === printing?.patientId);
        if (printing && printingPatient) {
          return (
            <PrintDesk
              consult={printing}
              patient={printingPatient}
              doctor={profiles.doctor(printing.doctorId)}
              onClose={() => setPrintId(null)}
              onSave={(patch) => onConsult(printing.id, patch)}
            />
          );
        }
        return null;
      })()}
      {(() => {
        const receipt = consults.find((item) => item.id === receiptId);
        if (!receipt) return null;
        return (
          <Receipt
            consult={receipt}
            patient={patients.find((item) => item.id === receipt.patientId)}
            doctorName={profiles.doctor(receipt.doctorId)?.name}
            onClose={() => setReceiptId(null)}
          />
        );
      })()}
      <ConfirmDialog
        open={Boolean(ask)}
        tone={ask?.tone ?? 'edit'}
        title={ask?.title ?? ''}
        text={ask?.text ?? ''}
        confirmLabel={ask?.confirm ?? 'Confirmer'}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          ask?.run();
          setAsk(null);
        }}
      />
    </div>
  );
}
