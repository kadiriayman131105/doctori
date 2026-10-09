'use client';

import type { ClinicPatient, Consult } from '@/doctori/types';
import { FLOW_LABEL, PAY_LABEL } from '@/doctori/clinic';
import { formatWhen } from '@/doctori/slots';
import { dueAmount, payState, sameDay } from './money';
import { printDocument } from './print-document';
import { useToast } from './Toast';

function stamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function DayExport({
  consults,
  patients,
  doctorName,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  doctorName?: string;
}) {
  const toast = useToast();
  const day = stamp();
  const rows = consults
    .filter((item) => sameDay(item.start) && item.flow !== 'annule')
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));

  function json() {
    const payload = {
      jour: day,
      medecin: doctorName ?? '',
      visites: rows.map((item) => {
        const patient = patients.find((entry) => entry.id === item.patientId);
        return {
          heure: item.start,
          patient: patient?.name ?? '',
          telephone: patient?.phone ?? '',
          motif: item.reason,
          etat: FLOW_LABEL[item.flow],
          paiement: PAY_LABEL[payState(item)],
          du: dueAmount(item),
          paye: item.paid,
        };
      }),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `doctori-${day}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.show('Fichier JSON téléchargé.');
  }

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <h2 className="font-bold">Sauvegarde du jour</h2>
      <p className="text-sm text-fb-muted">Une copie des visites d’aujourd’hui, sans service payant.</p>
      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={json} className="h-11 rounded-xl bg-fb px-4 text-sm font-bold text-white">
          Export JSON
        </button>
        <button type="button" onClick={printDocument} className="h-11 rounded-xl bg-fb-soft px-4 text-sm font-bold text-fb-deep">
          PDF / imprimer
        </button>
      </div>
      <article className="doctori-print mt-4 hidden print:block">
        <p className="text-sm font-bold text-fb">Doctori · {doctorName}</p>
        <h3 className="text-xl font-bold">Journée du {day}</h3>
        {rows.length === 0 ? <p>Aucune visite aujourd’hui.</p> : null}
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((item) => {
            const patient = patients.find((entry) => entry.id === item.patientId);
            return (
              <li key={item.id}>
                <p className="font-bold">
                  {formatWhen(item.start)} · {patient?.name} · {item.reason}
                </p>
                <p>
                  {FLOW_LABEL[item.flow]} · {PAY_LABEL[payState(item)]} · {dueAmount(item)} DH
                  {patient?.phone ? ` · ${patient.phone}` : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}
