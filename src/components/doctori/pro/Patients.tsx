'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ClinicPatient, Consult, Sex, VisitType } from '@/doctori/types';
import { FLOW_LABEL } from '@/doctori/clinic';
import { VISIT_LABEL } from '@/doctori/data';
import { clashesAt } from '@/doctori/hours';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { billed, dueAmount, payState } from './money';
import { PAY_LABEL } from '@/doctori/clinic';
import { ConfirmDialog } from './ConfirmDialog';

export function Patients({
  patients,
  consults,
  onPatient,
  onAdd,
  onCreate,
  doctorId,
  focusId,
}: {
  patients: ClinicPatient[];
  consults: Consult[];
  onPatient: (id: string, patch: Partial<ClinicPatient>) => void;
  onAdd: (input: Omit<Consult, 'id'>) => void;
  onCreate?: (input: Omit<ClinicPatient, 'id'>) => string;
  doctorId?: string;
  focusId?: string | null;
}) {
  const [query, setQuery] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [selected, setSelected] = useState<string | null>(focusId || patients[0]?.id || null);
  const [visitType, setVisitType] = useState<VisitType>('cabinet');
  const [booked, setBooked] = useState('');
  const [clash, setClash] = useState<{ text: string; run: () => void } | null>(null);
  const [creating, setCreating] = useState(false);
  const [askSave, setAskSave] = useState<Partial<ClinicPatient> | null>(null);
  const profiles = useProfiles();

  useEffect(() => {
    if (focusId) setSelected(focusId);
  }, [focusId]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return patients.filter((patient) => {
      if (sex && patient.sex !== sex) return false;
      if (!needle) return true;
      return `${patient.name} ${patient.conditions} ${patient.notes}`.toLowerCase().includes(needle);
    });
  }, [patients, query, sex]);

  const current = patients.find((patient) => patient.id === selected) ?? rows[0];
  const history = consults
    .filter((item) => item.patientId === current?.id)
    .sort((a, b) => +new Date(b.start) - +new Date(a.start));
  const doctor = current ? profiles.doctor(current.doctorId) : undefined;

  function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current || !doctor) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get('date') || '');
    const time = String(data.get('time') || '');
    const reason = String(data.get('reason') || 'Contrôle').trim() || 'Contrôle';
    if (!date || !time) return;
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return;
    const form = event.currentTarget;
    const input = {
      doctorId: current.doctorId,
      patientId: current.id,
      start: start.toISOString(),
      visitType,
      reason,
      flow: 'a_venir' as const,
      listPrice: doctor.fee,
      discount: 0,
      paid: 0,
      note: '',
    };
    const place = () => {
      onAdd(input);
      setBooked(`Contrôle prévu le ${formatWhen(start.toISOString())}.`);
      form.reset();
    };
    const other = clashesAt(consults, current.doctorId, input.start);
    if (other) {
      const name = patients.find((item) => item.id === other.patientId)?.name ?? 'Un autre patient';
      setClash({
        text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
        run: place,
      });
      return;
    }
    place();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl bg-white p-3 ring-1 ring-fb-line">
        {onCreate && doctorId ? (
          <button type="button" onClick={() => setCreating((value) => !value)} className="mb-2 h-10 w-full rounded-xl bg-fb text-sm font-bold text-white">
            {creating ? 'Fermer' : 'Ajouter un patient'}
          </button>
        ) : null}
        {creating && onCreate && doctorId ? (
          <form
            className="mb-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get('name') || '').trim();
              const phone = String(data.get('phone') || '').trim();
              if (!name || !phone) return;
              const id = onCreate({
                doctorId,
                name,
                phone,
                age: Math.max(0, Number(data.get('age')) || 0),
                sex: String(data.get('sex')) as Sex,
                insurance: String(data.get('insurance') || 'Aucune'),
                conditions: '',
                allergies: '',
                notes: '',
              });
              setSelected(id);
              setCreating(false);
              event.currentTarget.reset();
            }}
          >
            <input name="name" required placeholder="Nom" className="h-10 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold" />
            <input name="phone" required placeholder="Téléphone" className="h-10 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold" />
            <div className="grid grid-cols-2 gap-2">
              <input name="age" type="number" min={0} required placeholder="Âge" className="h-10 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold" />
              <select name="sex" className="h-10 rounded-xl border border-fb-line px-2 text-sm font-semibold">
                <option value="F">Femme</option>
                <option value="M">Homme</option>
              </select>
            </div>
            <input name="insurance" defaultValue="CNSS" placeholder="Couverture" className="h-10 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold" />
            <button type="submit" className="h-10 w-full rounded-xl bg-fb-deep text-sm font-bold text-white">
              Créer la fiche
            </button>
          </form>
        ) : null}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nom, maladie, note…"
          className="h-11 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold outline-none ring-fb focus:ring-2"
        />
        <div className="mt-2 flex gap-2">
          {(['', 'F', 'M'] as const).map((item) => (
            <button
              key={item || 'tous'}
              type="button"
              onClick={() => setSex(item)}
              className={`rounded-full px-3 py-1 text-sm font-bold ${sex === item ? 'bg-fb text-white' : 'bg-fb-bg'}`}
            >
              {item === 'F' ? 'Femmes' : item === 'M' ? 'Hommes' : 'Tous'}
            </button>
          ))}
        </div>
        <ul className="mt-3 max-h-[540px] space-y-1 overflow-auto">
          {rows.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => setSelected(patient.id)}
                className={`w-full rounded-xl px-3 py-2 text-left ${current?.id === patient.id ? 'bg-fb-soft' : 'hover:bg-fb-bg'}`}
              >
                <p className="font-bold">{patient.name}</p>
                <p className="text-xs text-fb-muted">
                  {patient.sex === 'F' ? 'F' : 'H'} · {patient.age} ans · {patient.conditions}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {current ? (
        <>
        <form
          className="rounded-2xl bg-white p-4 ring-1 ring-fb-line"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setAskSave({
              age: Number(data.get('age')) || current.age,
              sex: String(data.get('sex')) as Sex,
              phone: String(data.get('phone')),
              insurance: String(data.get('insurance')),
              conditions: String(data.get('conditions')),
              allergies: String(data.get('allergies')),
              notes: String(data.get('notes')),
            });
          }}
        >
          <h2 className="text-xl font-bold">{current.name}</h2>
          <p className="text-sm text-fb-muted">{history.length} consultations · {history.filter(billed).reduce((sum, item) => sum + dueAmount(item), 0)} DH facturés</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Âge
              <input name="age" key={`${current.id}-age`} defaultValue={current.age} type="number" min={0} max={120} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
            </label>
            <label className="text-sm font-bold">
              Sexe
              <select name="sex" key={`${current.id}-sex`} defaultValue={current.sex} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold">
                <option value="F">Femme</option>
                <option value="M">Homme</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Mobile
              <input name="phone" key={`${current.id}-phone`} defaultValue={current.phone} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
            </label>
            <label className="text-sm font-bold">
              Couverture
              <input name="insurance" key={`${current.id}-ins`} defaultValue={current.insurance} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              Maladies / motifs suivis
              <input name="conditions" key={`${current.id}-cond`} defaultValue={current.conditions} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              Allergies
              <input name="allergies" key={`${current.id}-all`} defaultValue={current.allergies} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              Notes du médecin
              <textarea name="notes" key={`${current.id}-notes`} defaultValue={current.notes} rows={4} className="mt-1 w-full rounded-xl border border-fb-line px-3 py-2 font-medium" />
            </label>
          </div>
          <button type="submit" className="mt-4 h-11 rounded-xl bg-fb px-5 font-bold text-white">
            Enregistrer la fiche
          </button>
        </form>
        <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-fb-line">
            <h3 className="font-bold">Historique des consultations</h3>
            {history.length === 0 ? <p className="mt-2 text-sm text-fb-muted">Aucune visite pour l’instant.</p> : null}
            <ol className="mt-3 space-y-2">
              {history.map((item) => (
                <li key={item.id} className="rounded-xl bg-fb-bg px-3 py-2">
                  <p className="font-bold">
                    {formatWhen(item.start)} · {FLOW_LABEL[item.flow]}
                  </p>
                  <p className="text-sm text-fb-muted">
                    {item.reason} · {VISIT_LABEL[item.visitType]} · {PAY_LABEL[payState(item)]} · {dueAmount(item)} DH
                  </p>
                  {item.note ? <p className="mt-1 text-sm">{item.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
          <form onSubmit={schedule} className="mt-6 rounded-2xl bg-fb-soft p-4">
            <h3 className="font-bold">Programmer un contrôle</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Date
                <input name="date" type="date" required className="mt-1 h-11 w-full rounded-xl border border-fb-line bg-white px-3" />
              </label>
              <label className="text-sm font-bold">
                Heure
                <input name="time" type="time" required className="mt-1 h-11 w-full rounded-xl border border-fb-line bg-white px-3" />
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Motif
                <input name="reason" defaultValue="Contrôle" className="mt-1 h-11 w-full rounded-xl border border-fb-line bg-white px-3 font-semibold" />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(doctor?.visitTypes ?? ['cabinet']).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisitType(type)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${visitType === type ? 'bg-fb text-white' : 'bg-white'}`}
                >
                  {VISIT_LABEL[type]}
                </button>
              ))}
            </div>
            <button type="submit" className="mt-3 h-11 rounded-xl bg-fb px-4 font-bold text-white">
              Ajouter à l’agenda
            </button>
            {booked ? <p className="mt-2 text-sm font-bold text-fb-green">{booked}</p> : null}
          </form>
        </>
      ) : (
        <p className="rounded-2xl bg-white p-8 text-center font-bold ring-1 ring-fb-line">Aucun patient</p>
      )}
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
      <ConfirmDialog
        open={Boolean(askSave && current)}
        tone="edit"
        title="Voulez-vous vraiment modifier ?"
        text={current ? `La fiche de ${current.name} sera mise à jour.` : ''}
        confirmLabel="Oui, modifier"
        onCancel={() => setAskSave(null)}
        onConfirm={() => {
          if (current && askSave) onPatient(current.id, askSave);
          setAskSave(null);
        }}
      />
    </div>
  );
}
