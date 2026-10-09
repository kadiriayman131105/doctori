'use client';

import { useState } from 'react';
import type { ClinicPatient, Consult } from '@/doctori/types';
import { patientDocsOf, prescriptionText, type PatientDoc, type PatientDocKind } from '@/doctori/patient-docs';
import { useProfiles } from '@/doctori/profiles';
import { formatLong, formatWhen } from '@/doctori/slots';
import { dueAmount, payState } from './money';
import { PAY_LABEL } from '@/doctori/clinic';
import { printDocument } from './print-document';

const KIND_LABEL: Record<PatientDocKind, string> = {
  facture: 'Facture',
  ordonnance: 'Ordonnance',
  certificat: 'Certificat médical',
  feuille: 'Feuille de soins',
};

export function PatientDocs({
  patient,
  consults,
  onOpen,
}: {
  patient: ClinicPatient;
  consults: Consult[];
  onOpen?: (consultId: string, kind: PatientDocKind) => void;
}) {
  const profiles = useProfiles();
  const docs = patientDocsOf(consults.filter((item) => item.patientId === patient.id));
  const [open, setOpen] = useState<PatientDoc | null>(null);
  const consult = open ? consults.find((item) => item.id === open.consultId) : undefined;
  const doctor = consult ? profiles.doctor(consult.doctorId) : undefined;
  const due = consult ? dueAmount(consult) : 0;

  return (
    <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <h3 className="font-bold">Documents enregistrés</h3>
      <p className="text-sm text-fb-muted">Ordonnances, certificats et factures liés à {patient.name}.</p>
      {docs.length === 0 ? (
        <p className="mt-3 text-sm text-fb-muted">Rien n’est encore enregistré sur cette fiche. Dans Document, utilisez Enregistrer sur la fiche.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {docs.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpen(item)}
                className="w-full rounded-xl bg-fb-bg px-3 py-2 text-left"
              >
                <p className="font-bold">
                  {item.title} · {formatWhen(item.start)}
                </p>
                <p className="text-sm text-fb-muted">{item.hint}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && consult ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 print:static print:bg-transparent print:p-0">
          <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-4 shadow-xl">
            <article className="doctori-print rounded-2xl p-2">
              <p className="text-sm font-bold text-fb">Doctori · Casablanca</p>
              <h3 className="mt-1 text-xl font-bold">{KIND_LABEL[open.kind]}</h3>
              <p className="text-sm text-fb-muted">{formatLong(consult.start)}</p>
              <p className="mt-2 text-sm">
                <span className="font-bold">{doctor?.name ?? 'Médecin'}</span>
                {doctor?.specialty ? ` · ${doctor.specialty}` : ''}
              </p>
              <p className="text-sm font-bold">{patient.name} · {patient.age} ans</p>
              {open.kind === 'ordonnance' ? (
                <ol className="mt-4 space-y-2">
                  {(consult.prescriptionLines || []).filter((line) => line.medicine.trim()).map((line, index) => (
                    <li key={`${line.medicine}-${index}`}>
                      <p className="font-bold">{index + 1}. {line.medicine}</p>
                      <p className="text-sm">{[line.dose, line.times, line.days].filter(Boolean).join(' · ')}</p>
                    </li>
                  ))}
                  {!consult.prescriptionLines?.length && consult.prescription ? <p className="whitespace-pre-wrap text-sm">{consult.prescription}</p> : null}
                  {!prescriptionText(consult) ? <p className="text-sm text-fb-muted">Ordonnance vide.</p> : null}
                </ol>
              ) : null}
              {open.kind === 'certificat' ? (
                <p className="mt-4 whitespace-pre-wrap text-sm">{consult.certificate}</p>
              ) : null}
              {open.kind === 'facture' || open.kind === 'feuille' ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-fb-muted">Acte</dt><dd className="font-bold">{consult.reason}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-fb-muted">Montant</dt><dd className="font-bold">{due} DH</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-fb-muted">Paiement</dt><dd className="font-bold">{PAY_LABEL[payState(consult)]} · {consult.paid} DH</dd></div>
                </dl>
              ) : null}
            </article>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <button type="button" onClick={printDocument} className="h-11 rounded-xl bg-fb px-4 font-bold text-white">
                Imprimer
              </button>
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpen(consult.id, open.kind);
                    setOpen(null);
                  }}
                  className="h-11 rounded-xl bg-fb-soft px-4 font-bold text-fb-deep"
                >
                  Ouvrir dans Document
                </button>
              ) : null}
              <button type="button" onClick={() => setOpen(null)} className="h-11 rounded-xl px-4 font-bold text-fb-muted">
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
