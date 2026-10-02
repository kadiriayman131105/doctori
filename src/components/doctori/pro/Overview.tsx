import type { ClinicPatient, Consult } from '@/doctori/types';
import { FLOW_LABEL } from '@/doctori/clinic';
import { formatWhen } from '@/doctori/slots';
import { Bars, Donut } from './Charts';
import { lastDays, moneyOf, sameDay } from './money';

export function Overview({
  consults,
  patients,
  onOpen,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onOpen: () => void;
}) {
  const money = moneyOf(consults);
  const today = consults.filter((item) => sameDay(item.start)).sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const done = consults.filter((item) => item.flow === 'termine').length;
  const waiting = consults.filter((item) => item.flow === 'a_venir' || item.flow === 'en_cours').length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Encaissé', `${money.collected} DH`, 'Consultations terminées ou en cours'],
          ['Reste à encaisser', `${money.open} DH`, 'Après remises'],
          ['Patients suivis', String(patients.length), 'Fiches du cabinet'],
          ['À voir', String(waiting), `${done} consultations terminées`],
        ].map(([title, value, hint]) => (
          <article key={title} className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
            <p className="text-sm font-semibold text-fb-muted">{title}</p>
            <p className="mt-1 text-2xl font-bold text-fb">{value}</p>
            <p className="mt-1 text-xs text-fb-muted">{hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
          <h2 className="font-bold">Encaissements sur 7 jours</h2>
          <p className="mb-3 text-sm text-fb-muted">Somme réellement payée, en dirhams.</p>
          <Bars points={lastDays(consults)} />
        </section>
        <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
          <h2 className="mb-4 font-bold">Facturation</h2>
          <Donut paid={money.collected} unpaid={money.open} />
        </section>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Aujourd’hui</h2>
          <button type="button" onClick={onOpen} className="text-sm font-bold text-fb">
            Tout l’agenda
          </button>
        </div>
        {today.length === 0 ? <p className="text-sm text-fb-muted">Aucun rendez-vous aujourd’hui.</p> : null}
        <ul className="divide-y divide-fb-bg">
          {today.map((item) => {
            const patient = patients.find((entry) => entry.id === item.patientId);
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-bold">{patient?.name}</p>
                  <p className="text-fb-muted">
                    {formatWhen(item.start)} · {item.reason}
                  </p>
                </div>
                <span className="rounded-full bg-fb-soft px-2 py-1 text-xs font-bold text-fb-deep">{FLOW_LABEL[item.flow]}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
