'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClinicPatient, Consult, Doctor, PrescriptionLine } from '@/doctori/types';
import { PAY_LABEL } from '@/doctori/clinic';
import { useProfiles } from '@/doctori/profiles';
import { formatLong, formatWhen } from '@/doctori/slots';
import { useToast } from './Toast';
import { matchesPatient } from '@/doctori/phone';
import { dueAmount, payState } from './money';
import { printDocument } from './print-document';
import { PatientDocs } from './PatientDocs';

type Kind = 'facture' | 'ordonnance' | 'certificat' | 'feuille';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'facture', label: 'Facture' },
  { id: 'ordonnance', label: 'Ordonnance' },
  { id: 'certificat', label: 'Certificat médical' },
  { id: 'feuille', label: 'Feuille de soins' },
];

function blankLine(): PrescriptionLine {
  return { medicine: '', dose: '', times: '', days: '' };
}

function certificatOf(patient: ClinicPatient, consult: Consult, doctor?: Doctor) {
  const accord = patient.sex === 'F' ? 'e' : '';
  return `Je soussigné(e) ${doctor?.name ?? 'le médecin'}${doctor?.specialty ? `, ${doctor.specialty}` : ''}, certifie avoir examiné ${patient.name}, âgé${accord} de ${patient.age} ans, le ${formatLong(consult.start)}.

Son état de santé nécessite un repos de …… jours, du …… au …….

Certificat établi à Casablanca, à la demande de l’intéressé${accord}, pour servir et valoir ce que de droit.`;
}

export function Documents({
  patients,
  consults,
  patientId,
  consultId,
  startKind,
  onSave,
}: {
  patients: ClinicPatient[];
  consults: Consult[];
  patientId?: string | null;
  consultId?: string | null;
  startKind?: Kind | null;
  onSave: (id: string, patch: Partial<Consult>) => void;
}) {
  const profiles = useProfiles();
  const [query, setQuery] = useState('');
  const [pickedPatient, setPickedPatient] = useState(patientId || '');
  const [pickedConsult, setPickedConsult] = useState(consultId || '');
  const [kind, setKind] = useState<Kind>('facture');
  const [lines, setLines] = useState<PrescriptionLine[]>([blankLine()]);
  const [certificate, setCertificate] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (patientId) setPickedPatient(patientId);
  }, [patientId]);

  useEffect(() => {
    if (consultId) setPickedConsult(consultId);
  }, [consultId]);

  useEffect(() => {
    if (startKind) setKind(startKind);
  }, [startKind, consultId]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return patients.filter((patient) => !needle || matchesPatient(patient, query));
  }, [patients, query]);

  const patient = patients.find((item) => item.id === pickedPatient);
  const bills = useMemo(
    () =>
      consults
        .filter((item) => item.patientId === pickedPatient && item.flow !== 'annule')
        .sort((a, b) => +new Date(b.start) - +new Date(a.start)),
    [consults, pickedPatient],
  );
  const consult = bills.find((item) => item.id === pickedConsult) ?? null;
  const doctor = profiles.doctor(consult?.doctorId || patient?.doctorId || '');

  useEffect(() => {
    if (!pickedPatient) return;
    setPickedConsult((current) => (bills.some((item) => item.id === current) ? current : bills[0]?.id ?? ''));
  }, [bills, pickedPatient]);

  useEffect(() => {
    if (!consult || !patient) return;
    setLines(consult.prescriptionLines?.length ? consult.prescriptionLines : [blankLine()]);
    setCertificate(consult.certificate || certificatOf(patient, consult, profiles.doctor(consult.doctorId)));
    // Reset only when the chosen visit changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consult?.id, patient?.id]);

  const due = consult ? dueAmount(consult) : 0;
  const rest = consult ? Math.max(0, due - consult.paid) : 0;

  function save() {
    if (!consult) return;
    if (kind === 'ordonnance') onSave(consult.id, { prescriptionLines: lines.filter((line) => line.medicine.trim()) });
    if (kind === 'certificat') onSave(consult.id, { certificate });
  }

  return (
    <section className="grid items-start gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-2xl bg-white p-3 ring-1 ring-fb-line">
        <h2 className="px-1 text-lg font-bold">Document</h2>
        <p className="px-1 text-sm text-fb-muted">Choisissez le patient, puis sa facture.</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nom ou téléphone…"
          className="mt-3 h-11 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold outline-none ring-fb focus:ring-2"
        />
        <ul className="mt-3 max-h-[520px] space-y-1 overflow-auto">
          {rows.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setPickedPatient(item.id);
                  setPickedConsult('');
                  setKind('facture');
                }}
                className={`w-full rounded-xl px-3 py-2 text-left ${pickedPatient === item.id ? 'bg-fb-soft' : 'hover:bg-fb-bg'}`}
              >
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-fb-muted">{item.phone}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!patient ? (
        <p className="rounded-2xl bg-white p-8 text-center font-bold ring-1 ring-fb-line">Sélectionnez un patient pour ouvrir ses documents.</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
            <p className="font-bold">{patient.name}</p>
            <p className="text-sm text-fb-muted">
              {patient.age} ans · {patient.phone}
              {bills.length ? ` · ${bills.length} facture${bills.length > 1 ? 's' : ''}` : ''}
            </p>
            <PatientDocs
              patient={patient}
              consults={consults}
              onOpen={(id, nextKind) => {
                setPickedConsult(id);
                setKind(nextKind);
              }}
            />
            {bills.length === 0 ? (
              <p className="mt-3 text-sm font-bold text-fb-muted">Aucune facture pour ce patient. Posez d’abord un rendez-vous.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {bills.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setPickedConsult(item.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left ${consult?.id === item.id ? 'bg-fb text-white' : 'bg-fb-bg'}`}
                    >
                      <p className="font-bold">{formatWhen(item.start)} · {item.reason}</p>
                      <p className={`text-sm ${consult?.id === item.id ? 'text-white/80' : 'text-fb-muted'}`}>
                        {dueAmount(item)} DH · {PAY_LABEL[payState(item)]} · {profiles.doctor(item.doctorId)?.name}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {consult ? (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
              <div className="flex flex-wrap gap-2 print:hidden">
                {KINDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${kind === item.id ? 'bg-fb text-white' : 'bg-fb-bg'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <article className="doctori-print mt-4 rounded-2xl bg-white p-5 ring-1 ring-fb-line">
                <p className="text-sm font-bold text-fb">Doctori · Casablanca</p>
                <h3 className="mt-1 text-xl font-bold">{KINDS.find((item) => item.id === kind)?.label}</h3>
                <p className="text-sm text-fb-muted">{formatLong(consult.start)}</p>
                <p className="mt-2 text-sm">
                  <span className="font-bold">{doctor?.name ?? 'Médecin'}</span>
                  {doctor?.specialty ? ` · ${doctor.specialty}` : ''}
                  {doctor?.diploma ? ` · ${doctor.diploma}` : ''}
                </p>
                <p className="text-sm text-fb-muted">{doctor?.address}</p>
                {kind === 'facture' || kind === 'feuille' ? (
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-fb-muted">Patient</dt><dd className="font-bold">{patient.name} · {patient.age} ans</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-fb-muted">Couverture</dt><dd className="font-bold">{patient.insurance || 'Aucune'}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-fb-muted">Acte</dt><dd className="text-right font-bold">{consult.reason}</dd></div>
                    {kind === 'facture' ? (
                      <>
                        <div className="flex justify-between gap-3 border-t border-fb-line pt-2"><dt>Tarif</dt><dd>{consult.listPrice} DH</dd></div>
                        <div className="flex justify-between gap-3"><dt>Remise</dt><dd>{consult.discount} DH</dd></div>
                        <div className="flex justify-between gap-3"><dt>À payer</dt><dd className="font-bold">{due} DH</dd></div>
                        <div className="flex justify-between gap-3"><dt>Payé</dt><dd className="font-bold">{consult.paid} DH</dd></div>
                        <div className="flex justify-between gap-3"><dt>Reste</dt><dd className="font-bold">{rest} DH</dd></div>
                      </>
                    ) : (
                      <div className="flex justify-between gap-3 border-t border-fb-line pt-2"><dt>Montant</dt><dd className="font-bold">{due} DH</dd></div>
                    )}
                  </dl>
                ) : null}
                {kind === 'feuille' ? <p className="mt-4 text-sm">Document remis à l’assuré pour sa prise en charge {patient.insurance || 'CNSS / CNOPS'}.</p> : null}
                {kind === 'ordonnance' ? (
                  <div className="mt-4 space-y-3">
                    <ol className="hidden space-y-2 print:block">
                      {lines.filter((line) => line.medicine.trim()).map((line, index) => (
                        <li key={`${line.medicine}-${index}`}>
                          <p className="font-bold">{index + 1}. {line.medicine}</p>
                          <p>{[line.dose, line.times, line.days].filter(Boolean).join(' · ')}</p>
                        </li>
                      ))}
                    </ol>
                    <div className="space-y-2 print:hidden">
                      {lines.map((line, index) => (
                        <div key={index} className="grid gap-2 rounded-xl bg-fb-bg p-3 sm:grid-cols-2">
                          <input value={line.medicine} onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, medicine: event.target.value } : item)))} placeholder="Médicament" className="h-10 rounded-lg border border-fb-line px-2 text-sm font-semibold sm:col-span-2" />
                          <input value={line.dose} onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, dose: event.target.value } : item)))} placeholder="Dose, ex. 1 comprimé" className="h-10 rounded-lg border border-fb-line px-2 text-sm" />
                          <input value={line.times} onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, times: event.target.value } : item)))} placeholder="Ex. 2 fois par jour" className="h-10 rounded-lg border border-fb-line px-2 text-sm" />
                          <input value={line.days} onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, days: event.target.value } : item)))} placeholder="Ex. 7 jours" className="h-10 rounded-lg border border-fb-line px-2 text-sm" />
                          {lines.length > 1 ? (
                            <button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))} className="text-left text-sm font-bold text-red-600">Retirer</button>
                          ) : null}
                        </div>
                      ))}
                      <button type="button" onClick={() => setLines((current) => [...current, blankLine()])} className="text-sm font-bold text-fb">Ajouter un médicament</button>
                    </div>
                  </div>
                ) : null}
                {kind === 'certificat' ? (
                  <label className="mt-4 block text-sm font-bold">
                    Texte du certificat
                    <textarea value={certificate} onChange={(event) => setCertificate(event.target.value)} rows={12} className="mt-1 w-full rounded-xl border border-fb-line px-3 py-2 font-medium" />
                  </label>
                ) : null}
              </article>
              <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                <button type="button" onClick={printDocument} className="h-11 rounded-xl bg-fb px-4 font-bold text-white">
                  Imprimer
                </button>
                {kind === 'ordonnance' || kind === 'certificat' ? (
                  <button
                    type="button"
                    onClick={() => {
                      save();
                      toast.show('Enregistré');
                    }}
                    className="h-11 rounded-xl bg-fb-soft px-4 font-bold text-fb-deep"
                  >
                    Enregistrer sur la fiche
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
