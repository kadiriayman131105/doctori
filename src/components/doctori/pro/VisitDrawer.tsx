'use client';

import { X } from 'lucide-react';
import type { ClinicPatient, Consult } from '@/doctori/types';
import { FLOW_LABEL, PAY_LABEL } from '@/doctori/clinic';
import { VISIT_LABEL } from '@/doctori/data';
import { formatWhen } from '@/doctori/slots';
import { dueAmount, payState } from './money';
import { PatientDocs } from './PatientDocs';
import type { PatientDocKind } from '@/doctori/patient-docs';

export function VisitDrawer({
  consult,
  patient,
  doctorName,
  history,
  onClose,
  onOpenDoc,
  children,
}: {
  consult: Consult;
  patient?: ClinicPatient;
  doctorName?: string;
  history: Consult[];
  onClose: () => void;
  onOpenDoc?: (consultId: string, kind: PatientDocKind) => void;
  children?: React.ReactNode;
}) {
  return (
    <aside className="animate-sheet rounded-2xl bg-white p-4 ring-1 ring-fb-line">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-fb">Patient</p>
          <h2 className="text-xl font-bold">{patient?.name ?? 'Patient'}</h2>
          <p className="text-sm text-fb-muted">
            {patient?.phone || 'Téléphone non renseigné'}
            {doctorName ? ` · ${doctorName}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-fb-bg" aria-label="Fermer la fiche">
          <X size={16} />
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-fb-bg px-3 py-2">
          <dt className="text-xs font-bold text-fb-muted">Âge</dt>
          <dd className="font-bold">{patient?.age ? `${patient.age} ans` : 'Non renseigné'}</dd>
        </div>
        <div className="rounded-xl bg-fb-bg px-3 py-2">
          <dt className="text-xs font-bold text-fb-muted">Sexe</dt>
          <dd className="font-bold">{patient ? (patient.sex === 'F' ? 'Femme' : 'Homme') : '—'}</dd>
        </div>
        <div className="rounded-xl bg-fb-bg px-3 py-2">
          <dt className="text-xs font-bold text-fb-muted">Couverture</dt>
          <dd className="font-bold">{patient?.insurance || '—'}</dd>
        </div>
        <div className="rounded-xl bg-fb-bg px-3 py-2">
          <dt className="text-xs font-bold text-fb-muted">Ce rendez-vous</dt>
          <dd className="font-bold">{FLOW_LABEL[consult.flow]}</dd>
        </div>
      </dl>
      {patient?.conditions ? <p className="mt-3 text-sm"><span className="font-bold">Maladies. </span>{patient.conditions}</p> : null}
      {patient?.allergies ? <p className="mt-1 text-sm"><span className="font-bold">Allergies. </span>{patient.allergies}</p> : null}
      {patient?.notes ? <p className="mt-1 text-sm text-fb-muted">{patient.notes}</p> : null}
      <p className="mt-3 text-sm font-bold">
        {formatWhen(consult.start)} · {VISIT_LABEL[consult.visitType]} · {consult.reason}
      </p>
      {children}
      <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-fb-muted">Historique</h3>
      <ul className="mt-2 max-h-72 space-y-2 overflow-auto">
        {history.length === 0 ? <li className="text-sm text-fb-muted">Aucune autre visite.</li> : null}
        {history.map((item) => {
          const due = dueAmount(item);
          const current = item.id === consult.id;
          return (
            <li key={item.id} className={`rounded-xl px-3 py-2 text-sm ${current ? 'bg-fb-soft' : 'bg-fb-bg'}`}>
              <p className="font-bold">{formatWhen(item.start)}{current ? ' · celle-ci' : ''}</p>
              <p className="text-fb-muted">
                {item.reason} · {FLOW_LABEL[item.flow]} · {PAY_LABEL[payState(item)]} · {due} DH
              </p>
              {item.tension || item.weight || item.temperature ? (
                <p className="mt-1 text-fb-muted">
                  {[item.tension ? `TA ${item.tension}` : '', item.weight ? `${item.weight} kg` : '', item.temperature ? `${item.temperature} °C` : ''].filter(Boolean).join(' · ')}
                </p>
              ) : null}
              {item.note ? <p className="mt-1">{item.note}</p> : null}
            </li>
          );
        })}
      </ul>
      {patient ? <PatientDocs patient={patient} consults={history} onOpen={onOpenDoc} /> : null}
    </aside>
  );
}
