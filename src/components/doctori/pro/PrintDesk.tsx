'use client';

import { useState } from 'react';
import type { ClinicPatient, Consult, Doctor } from '@/doctori/types';
import { formatLong } from '@/doctori/slots';
import { dueAmount } from './money';
import { printDocument } from './print-document';
import { useToast } from './Toast';

type Kind = 'facture' | 'ordonnance' | 'certificat';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'facture', label: 'Facture' },
  { id: 'ordonnance', label: 'Ordonnance' },
  { id: 'certificat', label: 'Certificat médical' },
];

function ordonnanceOf(patient: ClinicPatient) {
  return `${patient.name} · ${patient.age} ans

1.
Posologie :
Durée :

2.
Posologie :
Durée :`;
}

function certificatOf(patient: ClinicPatient, consult: Consult, doctor?: Doctor) {
  const accord = patient.sex === 'F' ? 'e' : '';
  return `Je soussigné(e) ${doctor?.name ?? 'le médecin'}${doctor?.specialty ? `, ${doctor.specialty}` : ''}, certifie avoir examiné ${patient.name}, âgé${accord} de ${patient.age} ans, le ${formatLong(consult.start)}.

Son état de santé nécessite un repos de …… jours, du …… au …….

Certificat établi à Casablanca, à la demande de l’intéressé${accord}, pour servir et valoir ce que de droit.`;
}

export function PrintDesk({
  consult,
  patient,
  doctor,
  onClose,
  onSave,
}: {
  consult: Consult;
  patient: ClinicPatient;
  doctor?: Doctor;
  onClose: () => void;
  onSave: (patch: Partial<Consult>) => void;
}) {
  const [kind, setKind] = useState<Kind>('facture');
  const [prescription, setPrescription] = useState(consult.prescription || ordonnanceOf(patient));
  const [certificate, setCertificate] = useState(consult.certificate || certificatOf(patient, consult, doctor));
  const toast = useToast();
  const due = dueAmount(consult);
  const rest = Math.max(0, due - consult.paid);

  function save() {
    if (kind === 'ordonnance') onSave({ prescription });
    if (kind === 'certificat') onSave({ certificate });
  }

  return (
    <>
    <div className="fixed inset-0 z-50 grid place-items-center bg-fb-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-bold text-fb">Imprimer</p>
        <h2 id="print-title" className="text-2xl font-bold">{patient.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
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

          {kind === 'facture' ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-fb-muted">N°</dt><dd className="font-bold">{consult.id}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-fb-muted">Patient</dt><dd className="font-bold">{patient.name}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-fb-muted">Acte</dt><dd className="text-right font-bold">{consult.reason}</dd></div>
              <div className="flex justify-between gap-3 border-t border-fb-line pt-2"><dt>Tarif</dt><dd>{consult.listPrice} DH</dd></div>
              <div className="flex justify-between gap-3"><dt>Remise</dt><dd>{consult.discount} DH</dd></div>
              <div className="flex justify-between gap-3"><dt>À payer</dt><dd className="font-bold">{due} DH</dd></div>
              <div className="flex justify-between gap-3"><dt>Payé</dt><dd className="font-bold">{consult.paid} DH</dd></div>
              <div className="flex justify-between gap-3"><dt>Reste</dt><dd className="font-bold">{rest} DH</dd></div>
            </dl>
          ) : (
            <label className="mt-4 block text-sm font-bold">
              {kind === 'ordonnance' ? 'Médicaments' : 'Texte du certificat'}
              <textarea
                value={kind === 'ordonnance' ? prescription : certificate}
                onChange={(event) => (kind === 'ordonnance' ? setPrescription(event.target.value) : setCertificate(event.target.value))}
                rows={12}
                className="mt-1 w-full rounded-xl border border-fb-line px-3 py-2 font-medium"
              />
            </label>
          )}
        </article>

        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={printDocument} className="h-11 rounded-xl bg-fb px-4 font-bold text-white">
            Imprimer
          </button>
          {kind !== 'facture' ? (
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
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-fb-bg px-4 font-bold">
            Fermer
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
