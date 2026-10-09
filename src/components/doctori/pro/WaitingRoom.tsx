'use client';

import type { ClinicPatient, Consult, VisitFlow } from '@/doctori/types';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { useToast } from './Toast';
import { sameDay } from './money';

const COLUMNS: { flow: VisitFlow; title: string; action?: { flow: VisitFlow; label: string } }[] = [
  { flow: 'a_venir', title: 'Pas encore arrivé', action: { flow: 'arrive', label: 'Arrivé' } },
  { flow: 'arrive', title: 'En salle', action: { flow: 'en_cours', label: 'Faire entrer' } },
  { flow: 'en_cours', title: 'En consultation', action: { flow: 'termine', label: 'Terminer' } },
  { flow: 'termine', title: 'Terminé' },
];

export function WaitingRoom({
  consults,
  patients,
  onConsult,
  onOpenPatient,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
  onOpenPatient?: (patientId: string) => void;
}) {
  const profiles = useProfiles();
  const toast = useToast();
  const today = consults
    .filter((item) => sameDay(item.start) && item.flow !== 'annule' && item.flow !== 'absent')
    .sort((a, b) => +new Date(a.start) - +new Date(b.start));

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-bold">Salle d’attente</h2>
        <p className="text-sm text-fb-muted">Aujourd’hui, dans l’ordre des rendez-vous.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const rows = today.filter((item) => item.flow === column.flow);
          return (
            <div key={column.flow} className="rounded-2xl bg-white p-3 ring-1 ring-fb-line">
              <p className="text-sm font-bold">
                {column.title} <span className="text-fb-muted">{rows.length}</span>
              </p>
              <ul className="mt-2 space-y-2">
                {rows.length === 0 ? <li className="rounded-xl bg-fb-bg px-3 py-4 text-sm text-fb-muted">Personne</li> : null}
                {rows.map((item) => {
                  const patient = patients.find((entry) => entry.id === item.patientId);
                  const doctor = profiles.doctor(item.doctorId);
                  return (
                    <li key={item.id} className="rounded-xl bg-fb-bg p-3">
                      {patient && onOpenPatient ? (
                        <button
                          type="button"
                          onClick={() => onOpenPatient(patient.id)}
                          className="text-left font-bold text-fb underline-offset-2 hover:underline"
                        >
                          {patient.name}
                        </button>
                      ) : (
                        <p className="font-bold">{patient?.name ?? 'Patient'}</p>
                      )}
                      <p className="text-sm text-fb-muted">
                        {formatWhen(item.start)} · {item.reason}
                      </p>
                      <p className="text-sm text-fb-muted">{doctor?.name}</p>
                      {column.action ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = column.action;
                            if (!next) return;
                            const prev = item.flow;
                            onConsult(item.id, { flow: next.flow });
                            toast.show('Enregistré', () => onConsult(item.id, { flow: prev }));
                          }}
                          className="mt-2 h-9 w-full rounded-lg bg-fb text-sm font-bold text-white"
                        >
                          {column.action.label}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
