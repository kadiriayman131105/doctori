'use client';

import dynamic from 'next/dynamic';
import { ArrowLeftRight, LogOut, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { ClinicPatient, Consult, Sex, VisitType } from '@/doctori/types';
import { FLOW_LABEL, PAY_LABEL } from '@/doctori/clinic';
import { VISIT_LABEL } from '@/doctori/data';
import { clashesAt } from '@/doctori/hours';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { dueAmount, payState } from './money';
import { AbsenceBar } from './HoursEditor';
import { PhoneDesk } from './PhoneDesk';
import { ConfirmDialog } from './ConfirmDialog';

const ClinicCalendar = dynamic(() => import('./ClinicCalendar').then((mod) => mod.ClinicCalendar), { ssr: false });

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateInput(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeInput(iso: string) {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combine(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

interface ApptDraft {
  id: string | null;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  visitType: VisitType;
  listPrice: string;
  reason: string;
}

interface PatientDraft {
  id: string | null;
  name: string;
  phone: string;
  age: string;
  sex: Sex;
  insurance: string;
  doctorId: string;
}

const EMPTY_PATIENT: PatientDraft = {
  id: null,
  name: '',
  phone: '',
  age: '',
  sex: 'F',
  insurance: 'CNSS',
  doctorId: 'amal-bennani',
};

export function SecretaryDesk({
  patients,
  consults,
  onConsult,
  onAddConsult,
  onRemoveConsult,
  onPatient,
  onAddPatient,
  onRemovePatient,
  onAssign,
  onSwitch,
  onLogout,
}: {
  patients: ClinicPatient[];
  consults: Consult[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
  onAddConsult: (input: Omit<Consult, 'id'>) => void;
  onRemoveConsult: (id: string) => void;
  onPatient: (id: string, patch: Partial<ClinicPatient>) => void;
  onAddPatient: (input: Omit<ClinicPatient, 'id'>) => string;
  onRemovePatient: (id: string) => void;
  onAssign: (id: string, doctorId: string) => void;
  onSwitch: () => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<'agenda' | 'patients'>('agenda');
  const [appt, setAppt] = useState<ApptDraft | null>(null);
  const [patientForm, setPatientForm] = useState<PatientDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [ask, setAsk] = useState<{ tone: 'edit' | 'danger'; title: string; text: string; confirm: string; run: () => void } | null>(null);
  const profiles = useProfiles();

  function openNew(startIso: string) {
    const first = patients[0];
    const doctorId = first?.doctorId || 'amal-bennani';
    const doctor = profiles.doctor(doctorId);
    setAppt({
      id: null,
      patientId: first?.id || '',
      doctorId,
      date: dateInput(startIso),
      time: timeInput(startIso),
      visitType: 'cabinet',
      listPrice: String(doctor?.fee ?? 200),
      reason: 'Consultation',
    });
    setMessage('');
  }

  function openExisting(id: string) {
    const item = consults.find((entry) => entry.id === id);
    if (!item) return;
    setAppt({
      id: item.id,
      patientId: item.patientId,
      doctorId: item.doctorId,
      date: dateInput(item.start),
      time: timeInput(item.start),
      visitType: item.visitType,
      listPrice: String(item.listPrice),
      reason: item.reason,
    });
    setMessage('');
  }

  function saveAppt(event: FormEvent) {
    event.preventDefault();
    if (!appt || !appt.patientId || !appt.date || !appt.time) return;
    const start = combine(appt.date, appt.time);
    if (Number.isNaN(new Date(start).getTime())) return;
    const price = Math.max(0, Number(appt.listPrice) || 0);
    const reason = appt.reason.trim() || 'Consultation';
    const other = clashesAt(consults, appt.doctorId, start, appt.id ?? undefined);
    const write = () => {
      if (appt.id) {
        onConsult(appt.id, {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          start,
          visitType: appt.visitType,
          listPrice: price,
          reason,
        });
        setMessage(`Rendez-vous déplacé au ${formatWhen(start)} · ${price} DH.`);
        return;
      }
      onAddConsult({
        doctorId: appt.doctorId,
        patientId: appt.patientId,
        start,
        visitType: appt.visitType,
        reason,
        flow: 'a_venir',
        listPrice: price,
        discount: 0,
        paid: 0,
        note: '',
      });
      setMessage(`Rendez-vous posé le ${formatWhen(start)} · ${price} DH.`);
      setAppt(null);
    };
    if (other) {
      const name = patients.find((item) => item.id === other.patientId)?.name ?? 'Un autre patient';
      setAsk({
        tone: 'edit',
        title: 'Ce créneau est déjà pris',
        text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
        confirm: 'Continuer quand même',
        run: write,
      });
      return;
    }
    if (appt.id) {
      setAsk({
        tone: 'edit',
        title: 'Voulez-vous vraiment modifier ?',
        text: `Le rendez-vous passera au ${formatWhen(start)}, à ${price} DH.`,
        confirm: 'Oui, modifier',
        run: write,
      });
      return;
    }
    write();
  }

  function savePatient(event: FormEvent) {
    event.preventDefault();
    if (!patientForm || !patientForm.name.trim() || !patientForm.phone.trim()) return;
    const patch = {
      name: patientForm.name.trim(),
      phone: patientForm.phone.trim(),
      age: Math.max(0, Number(patientForm.age) || 0),
      sex: patientForm.sex,
      insurance: patientForm.insurance.trim() || 'Aucune',
      doctorId: patientForm.doctorId,
    };
    if (patientForm.id) {
      const id = patientForm.id;
      setAsk({
        tone: 'edit',
        title: 'Voulez-vous vraiment modifier ?',
        text: `La fiche de ${patch.name} (téléphone, médecin, âge) sera mise à jour.`,
        confirm: 'Oui, modifier',
        run: () => {
          onPatient(id, patch);
          if (patients.find((item) => item.id === id)?.doctorId !== patch.doctorId) onAssign(id, patch.doctorId);
          setMessage(`${patch.name} est à jour.`);
          setPatientForm(null);
        },
      });
      return;
    } else {
      onAddPatient({ ...patch, conditions: '', allergies: '', notes: '' });
      setMessage(`${patch.name} a été ajouté.`);
      setPatientForm(null);
    }
  }

  const selected = patients.find((item) => item.id === selectedId) ?? null;
  const history = consults
    .filter((item) => item.patientId === selected?.id)
    .sort((a, b) => +new Date(b.start) - +new Date(a.start));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-fb">Secrétariat</p>
          <h1 className="text-2xl font-bold">Agenda, patients, tarifs</h1>
          <p className="text-sm text-fb-muted">
            Cliquez un horaire vide pour poser un rendez-vous, ou glissez un créneau pour changer la date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSwitch} className="inline-flex items-center gap-1 rounded-xl bg-fb-soft px-3 py-2 text-sm font-bold text-fb-deep">
            <ArrowLeftRight size={16} />
            Basculer vers médecin
          </button>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1 rounded-xl bg-fb-bg px-3 py-2 text-sm font-bold">
            <LogOut size={16} />
            Sortir
          </button>
        </div>
      </div>
      <PhoneDesk patients={patients} consults={consults} />
      <AbsenceBar />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['agenda', 'Agenda'],
            ['patients', 'Patients'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${tab === id ? 'bg-fb text-white' : 'bg-white ring-1 ring-fb-line'}`}
          >
            {label}
          </button>
        ))}
        {tab === 'agenda' ? (
          <button
            type="button"
            onClick={() => openNew(new Date().toISOString())}
            className="inline-flex items-center gap-1 rounded-full bg-fb-soft px-4 py-2 text-sm font-bold text-fb-deep"
          >
            <Plus size={16} />
            Nouveau rendez-vous
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPatientForm(EMPTY_PATIENT);
              setMessage('');
            }}
            className="inline-flex items-center gap-1 rounded-full bg-fb-soft px-4 py-2 text-sm font-bold text-fb-deep"
          >
            <Plus size={16} />
            Nouveau patient
          </button>
        )}
      </div>
      {message ? <p className="mb-3 text-sm font-bold text-fb-green">{message}</p> : null}

      {tab === 'agenda' ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <ClinicCalendar
            consults={consults}
            patients={patients}
            editable
            onMove={(id, start) => {
              const item = consults.find((entry) => entry.id === id);
              const other = item ? clashesAt(consults, item.doctorId, start, id) : undefined;
              const apply = () => {
                onConsult(id, { start });
                setMessage(`Horaire mis à jour : ${formatWhen(start)}.`);
                setAppt((current) =>
                  current?.id === id ? { ...current, date: dateInput(start), time: timeInput(start) } : current,
                );
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
              setAsk({
                tone: 'edit',
                title: 'Voulez-vous vraiment modifier ?',
                text: `Déplacer ce rendez-vous au ${formatWhen(start)} ?`,
                confirm: 'Oui, modifier',
                run: apply,
              });
            }}
            onSelect={openExisting}
            onCreate={openNew}
          />
          {appt ? (
            <form onSubmit={saveAppt} className="h-fit rounded-2xl bg-white p-4 ring-1 ring-fb-line">
              <h2 className="font-bold">{appt.id ? 'Modifier le rendez-vous' : 'Poser un rendez-vous'}</h2>
              <label className="mt-3 block text-sm font-bold">
                Patient
                <select
                  required
                  value={appt.patientId}
                  onChange={(event) => setAppt({ ...appt, patientId: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                >
                  <option value="">Choisir</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-bold">
                Médecin
                <select
                  value={appt.doctorId}
                  onChange={(event) => {
                    const doctor = profiles.doctor(event.target.value);
                    setAppt({
                      ...appt,
                      doctorId: event.target.value,
                      listPrice: appt.id ? appt.listPrice : String(doctor?.fee ?? appt.listPrice),
                    });
                  }}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                >
                  {profiles.doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} · {doctor.fee} DH
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-sm font-bold">
                  Date
                  <input
                    type="date"
                    required
                    value={appt.date}
                    onChange={(event) => setAppt({ ...appt, date: event.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3"
                  />
                </label>
                <label className="text-sm font-bold">
                  Heure
                  <input
                    type="time"
                    required
                    value={appt.time}
                    onChange={(event) => setAppt({ ...appt, time: event.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3"
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm font-bold">
                Prix de la consultation (DH)
                <input
                  type="number"
                  min={0}
                  required
                  value={appt.listPrice}
                  onChange={(event) => setAppt({ ...appt, listPrice: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['cabinet', 'video', 'domicile'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAppt({ ...appt, visitType: type })}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${appt.visitType === type ? 'bg-fb text-white' : 'bg-fb-bg'}`}
                  >
                    {VISIT_LABEL[type]}
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-sm font-bold">
                Motif
                <input
                  value={appt.reason}
                  onChange={(event) => setAppt({ ...appt, reason: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                />
              </label>
              <button type="submit" className="mt-4 h-11 w-full rounded-xl bg-fb font-bold text-white">
                {appt.id ? 'Enregistrer date et prix' : 'Ajouter à l’agenda'}
              </button>
              {appt.id ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = appt.id!;
                    setAsk({
                      tone: 'danger',
                      title: 'Voulez-vous vraiment supprimer ?',
                      text: 'Ce rendez-vous sera retiré de l’agenda.',
                      confirm: 'Oui, supprimer',
                      run: () => {
                        onRemoveConsult(id);
                        setAppt(null);
                        setMessage('Rendez-vous retiré de l’agenda.');
                      },
                    });
                  }}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-1 rounded-xl text-sm font-bold text-red-600"
                >
                  <Trash2 size={16} />
                  Supprimer ce rendez-vous
                </button>
              ) : null}
            </form>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-fb-muted ring-1 ring-fb-line">
              Cliquez un créneau vide de l’agenda pour choisir la date, l’heure et le prix. Glissez un rendez-vous pour le déplacer.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-fb-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-fb-bg text-xs uppercase tracking-wide text-fb-muted">
                <tr>
                  {['Patient', 'Téléphone', 'Médecin', ''].map((label) => (
                    <th key={label || 'action'} className="px-3 py-3 font-bold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className={`border-t border-fb-bg ${selectedId === patient.id ? 'bg-fb-soft' : ''}`}>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setSelectedId(patient.id)} className="text-left">
                        <p className="font-bold">{patient.name}</p>
                        <p className="text-xs text-fb-muted">
                          {patient.sex === 'F' ? 'Femme' : 'Homme'} · {patient.age} ans · {patient.insurance}
                        </p>
                      </button>
                    </td>
                    <td className="px-3 py-3 font-semibold">{patient.phone}</td>
                    <td className="px-3 py-3">{profiles.doctor(patient.doctorId)?.name ?? '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(patient.id);
                            setPatientForm({
                              id: patient.id,
                              name: patient.name,
                              phone: patient.phone,
                              age: String(patient.age),
                              sex: patient.sex,
                              insurance: patient.insurance,
                              doctorId: patient.doctorId,
                            });
                          }}
                          className="rounded-lg bg-fb-soft px-3 py-1.5 text-sm font-bold text-fb-deep"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAsk({
                              tone: 'danger',
                              title: 'Voulez-vous vraiment supprimer ?',
                              text: `${patient.name} et ses rendez-vous seront retirés.`,
                              confirm: 'Oui, supprimer',
                              run: () => {
                                onRemovePatient(patient.id);
                                setMessage(`${patient.name} a été retiré.`);
                                setPatientForm((current) => (current?.id === patient.id ? null : current));
                                setSelectedId((current) => (current === patient.id ? null : current));
                              },
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold text-red-600"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {patientForm ? (
            <form onSubmit={savePatient} className="h-fit rounded-2xl bg-white p-4 ring-1 ring-fb-line">
              <h2 className="font-bold">{patientForm.id ? 'Modifier le patient' : 'Nouveau patient'}</h2>
              <label className="mt-3 block text-sm font-bold">
                Nom
                <input
                  required
                  value={patientForm.name}
                  onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                />
              </label>
              <label className="mt-3 block text-sm font-bold">
                Téléphone
                <input
                  required
                  value={patientForm.phone}
                  onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-sm font-bold">
                  Âge
                  <input
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={patientForm.age}
                    onChange={(event) => setPatientForm({ ...patientForm, age: event.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3"
                  />
                </label>
                <label className="text-sm font-bold">
                  Sexe
                  <select
                    value={patientForm.sex}
                    onChange={(event) => setPatientForm({ ...patientForm, sex: event.target.value as Sex })}
                    className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                  >
                    <option value="F">Femme</option>
                    <option value="M">Homme</option>
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-sm font-bold">
                Couverture
                <input
                  value={patientForm.insurance}
                  onChange={(event) => setPatientForm({ ...patientForm, insurance: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                />
              </label>
              <label className="mt-3 block text-sm font-bold">
                Médecin assigné
                <select
                  value={patientForm.doctorId}
                  onChange={(event) => setPatientForm({ ...patientForm, doctorId: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold"
                >
                  {profiles.doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="mt-4 h-11 w-full rounded-xl bg-fb font-bold text-white">
                {patientForm.id ? 'Enregistrer' : 'Créer le patient'}
              </button>
            </form>
          ) : null}
          {selected ? (
            <section className="h-fit rounded-2xl bg-white p-4 ring-1 ring-fb-line">
              <h2 className="font-bold">{selected.name}</h2>
              <p className="text-sm text-fb-muted">
                {history.length} {history.length > 1 ? 'visites' : 'visite'} · {selected.phone}
              </p>
              {history.length === 0 ? <p className="mt-3 text-sm text-fb-muted">Aucune visite pour l’instant.</p> : null}
              <ol className="mt-3 space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="rounded-xl bg-fb-bg px-3 py-2">
                    <p className="font-bold">
                      {formatWhen(item.start)} · {FLOW_LABEL[item.flow]}
                    </p>
                    <p className="text-sm text-fb-muted">
                      {item.reason} · {VISIT_LABEL[item.visitType]} · {PAY_LABEL[payState(item)]} · {dueAmount(item)} DH
                      {profiles.doctor(item.doctorId) ? ` · ${profiles.doctor(item.doctorId)?.name}` : ''}
                    </p>
                    {item.note ? <p className="mt-1 text-sm">{item.note}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-fb-muted ring-1 ring-fb-line">
              Cliquez un patient pour voir son historique. Le dossier médical détaillé reste chez le médecin.
            </p>
          )}
        </div>
      )}
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
    </main>
  );
}
