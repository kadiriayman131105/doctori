import type { ClinicPatient, Consult } from '@/doctori/types';
import { PAY_LABEL } from '@/doctori/clinic';
import { formatWhen } from '@/doctori/slots';
import { Donut } from './Charts';
import { billed, dueAmount, moneyOf, payState } from './money';

export function Billing({
  consults,
  patients,
  onConsult,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
}) {
  const money = moneyOf(consults);
  const rows = consults
    .filter(billed)
    .sort((a, b) => +new Date(b.start) - +new Date(a.start));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <h2 className="mb-3 font-bold">Encaissé et reste dû</h2>
        <Donut paid={money.collected} unpaid={money.open} />
      </section>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-fb-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-fb-bg text-xs uppercase tracking-wide text-fb-muted">
            <tr>
              {['Date', 'Patient', 'Tarif', 'Remise', 'À payer', 'Payé', 'Statut'].map((label) => (
                <th key={label} className="px-3 py-3 font-bold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const patient = patients.find((entry) => entry.id === item.patientId);
              const due = dueAmount(item);
              const state = payState(item);
              return (
                <tr key={item.id} className="border-t border-fb-bg">
                  <td className="px-3 py-3">{formatWhen(item.start)}</td>
                  <td className="px-3 py-3 font-bold">{patient?.name}</td>
                  <td className="px-3 py-3">{item.listPrice} DH</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      max={item.listPrice}
                      value={item.discount}
                      aria-label={`Remise ${patient?.name}`}
                      onChange={(event) => onConsult(item.id, { discount: Number(event.target.value) || 0 })}
                      className="h-9 w-20 rounded-lg border border-fb-line px-2 font-semibold"
                    />
                  </td>
                  <td className="px-3 py-3 font-bold">{due} DH</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      value={item.paid}
                      aria-label={`Payé ${patient?.name}`}
                      onChange={(event) => onConsult(item.id, { paid: Number(event.target.value) || 0 })}
                      className="h-9 w-20 rounded-lg border border-fb-line px-2 font-semibold"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onConsult(item.id, { paid: state === 'paye' ? 0 : due })}
                      className={`rounded-full px-2 py-1 text-xs font-bold ${state === 'paye' ? 'bg-fb-green text-white' : 'bg-fb-soft text-fb-deep'}`}
                    >
                      {PAY_LABEL[state]}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
