'use client';

import type { ClinicPatient, Consult } from '@/doctori/types';
import { formatLong } from '@/doctori/slots';
import { dueAmount } from './money';
import { printDocument } from './print-document';

export function Receipt({
  consult,
  patient,
  doctorName,
  onClose,
}: {
  consult: Consult;
  patient?: ClinicPatient;
  doctorName?: string;
  onClose: () => void;
}) {
  const due = dueAmount(consult);
  const rest = Math.max(0, due - consult.paid);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-fb-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="doctori-receipt w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-bold text-fb">Doctori · Casablanca</p>
        <h2 id="receipt-title" className="mt-1 text-2xl font-bold">Reçu</h2>
        <p className="text-sm text-fb-muted">{formatLong(consult.start)}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-fb-muted">Patient</dt><dd className="font-bold">{patient?.name ?? '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-fb-muted">Médecin</dt><dd className="font-bold">{doctorName ?? '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-fb-muted">Acte</dt><dd className="text-right font-bold">{consult.reason}</dd></div>
          <div className="flex justify-between gap-3 border-t border-fb-line pt-2"><dt>Tarif</dt><dd>{consult.listPrice} DH</dd></div>
          <div className="flex justify-between gap-3"><dt>Remise</dt><dd>{consult.discount} DH</dd></div>
          <div className="flex justify-between gap-3"><dt>À payer</dt><dd className="font-bold">{due} DH</dd></div>
          <div className="flex justify-between gap-3"><dt>Payé</dt><dd className="font-bold text-fb-green">{consult.paid} DH</dd></div>
          <div className="flex justify-between gap-3"><dt>Reste</dt><dd className="font-bold">{rest} DH</dd></div>
        </dl>
        <div className="mt-5 flex gap-2 print:hidden">
          <button type="button" onClick={printDocument} className="h-11 flex-1 rounded-xl bg-fb font-bold text-white">
            Imprimer
          </button>
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-fb-bg px-4 font-bold">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
