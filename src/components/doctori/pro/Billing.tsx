'use client';

import { useMemo, useState } from 'react';
import type { ClinicPatient, Consult, PayMethod } from '@/doctori/types';
import { PAY_LABEL } from '@/doctori/clinic';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { matchesPatient, whatsAppLink } from '@/doctori/phone';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { DateSpan } from './DateSpan';
import { GuardedNumber } from './GuardedNumber';
import { Receipt } from './Receipt';
import { billed, dueAmount, inInterval, payState } from './money';

type PayFilter = 'tous' | 'paye' | 'partiel' | 'impaye';
type MethodFilter = 'tous' | 'especes' | 'carte';

function invoiceNo(id: string) {
  return `FAC-${id.toUpperCase()}`;
}

function restOf(item: Consult) {
  return Math.max(0, dueAmount(item) - item.paid);
}

function methodOf(item: Consult): PayMethod | null {
  if (item.paid <= 0) return null;
  return item.payMethod === 'carte' ? 'carte' : 'especes';
}

export function Billing({
  consults,
  patients,
  onConsult,
  onOpenDocument,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  onConsult: (id: string, patch: Partial<Consult>) => void;
  onOpenDocument?: (patientId: string, consultId: string, kind: 'facture' | 'feuille') => void;
}) {
  const profiles = useProfiles();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<PayFilter>('tous');
  const toast = useToast();
  const [method, setMethod] = useState<MethodFilter>('tous');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [ask, setAsk] = useState<{ title: string; text: string; confirm: string; run: () => void } | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return consults
      .filter(billed)
      .filter((item) => inInterval(item.start, from, to))
      .filter((item) => status === 'tous' || payState(item) === status)
      .filter((item) => {
        if (method === 'tous') return true;
        const current = methodOf(item);
        return method === 'carte' ? current === 'carte' : current === 'especes';
      })
      .filter((item) => {
        if (!needle) return true;
        const patient = patients.find((entry) => entry.id === item.patientId);
        if (patient && matchesPatient(patient, query)) return true;
        return `${invoiceNo(item.id)} ${item.reason}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => +new Date(b.start) - +new Date(a.start));
  }, [consults, from, method, patients, query, status, to]);

  const totals = rows.reduce(
    (sum, item) => {
      const due = dueAmount(item);
      const mode = methodOf(item);
      return {
        turnover: sum.turnover + due,
        collected: sum.collected + item.paid,
        open: sum.open + restOf(item),
        cash: sum.cash + (mode === 'especes' ? item.paid : 0),
        card: sum.card + (mode === 'carte' ? item.paid : 0),
      };
    },
    { turnover: 0, collected: 0, open: 0, cash: 0, card: 0 },
  );
  const unpaid = rows.filter((item) => restOf(item) > 0);
  const open = rows.find((item) => item.id === openId) ?? null;
  const openPatient = patients.find((item) => item.id === open?.patientId);
  const receipt = consults.find((item) => item.id === receiptId);

  function monthSpan() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setFrom(start);
    setTo(end);
  }

  function todaySpan() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setFrom(day);
    setTo(day);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <h2 className="text-xl font-bold">Facturation</h2>
        <p className="text-sm text-fb-muted">Une facture par visite. Les totaux suivent les filtres.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['today', 'Aujourd’hui'],
              ['month', 'Ce mois'],
              ['all', 'Tout'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === 'today') todaySpan();
                else if (id === 'month') monthSpan();
                else {
                  setFrom('');
                  setTo('');
                }
              }}
              className="rounded-full bg-fb-bg px-3 py-1.5 text-sm font-bold"
            >
              {label}
            </button>
          ))}
        </div>
        <DateSpan from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, téléphone, acte ou n° de facture"
            className="h-11 min-w-[220px] flex-1 rounded-xl border border-fb-line px-3 text-sm font-semibold outline-none ring-fb focus:ring-2"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['tous', 'paye', 'partiel', 'impaye'] as const).map((id) => (
            <button key={id} type="button" onClick={() => setStatus(id)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${status === id ? 'bg-fb text-white' : 'bg-fb-bg'}`}>
              {id === 'tous' ? 'Tout paiement' : PAY_LABEL[id]}
            </button>
          ))}
          {(['tous', 'especes', 'carte'] as const).map((id) => (
            <button key={id} type="button" onClick={() => setMethod(id)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${method === id ? 'bg-fb text-white' : 'bg-fb-bg'}`}>
              {id === 'tous' ? 'Tous les modes' : id === 'especes' ? 'Espèces' : 'Carte'}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ['Chiffre d’affaires', totals.turnover],
          ['Encaissé', totals.collected],
          ['Reste dû', totals.open],
          ['Espèces', totals.cash],
          ['Carte', totals.card],
        ].map(([label, value]) => (
          <p key={label} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-fb-line">
            <span className="block text-xs font-bold uppercase text-fb-muted">{label}</span>
            <span className="text-2xl font-bold">{value} DH</span>
          </p>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-fb-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-fb-bg text-xs uppercase tracking-wide text-fb-muted">
            <tr>
              {['N°', 'Date', 'Patient', 'Médecin', 'Acte', 'Couverture', 'À payer', 'Payé', 'Reste', 'Mode', 'Statut'].map((label) => (
                <th key={label} className="px-3 py-3 font-bold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-sm font-bold text-fb-muted">Aucune facture pour ces filtres.</td>
              </tr>
            ) : null}
            {rows.map((item) => {
              const patient = patients.find((entry) => entry.id === item.patientId);
              const due = dueAmount(item);
              const state = payState(item);
              const mode = methodOf(item);
              return (
                <tr key={item.id} className="border-t border-fb-bg">
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => setOpenId(item.id)} className="font-bold text-fb">{invoiceNo(item.id)}</button>
                  </td>
                  <td className="px-3 py-3">{formatWhen(item.start)}</td>
                  <td className="px-3 py-3 font-bold">{patient?.name ?? '—'}</td>
                  <td className="px-3 py-3">{profiles.doctor(item.doctorId)?.name ?? '—'}</td>
                  <td className="px-3 py-3">{item.reason}</td>
                  <td className="px-3 py-3">{patient?.insurance || '—'}</td>
                  <td className="px-3 py-3 font-bold">{due} DH</td>
                  <td className="px-3 py-3">{item.paid} DH</td>
                  <td className="px-3 py-3">{restOf(item)} DH</td>
                  <td className="px-3 py-3">{mode === 'carte' ? 'Carte' : mode === 'especes' ? 'Espèces' : '—'}</td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => setOpenId(item.id)} className={`rounded-full px-2 py-1 text-xs font-bold ${state === 'paye' ? 'bg-fb-green text-white' : 'bg-fb-soft text-fb-deep'}`}>
                      {PAY_LABEL[state]}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 ? (
            <tfoot className="border-t border-fb-line bg-fb-soft text-sm font-bold">
              <tr>
                <td className="px-3 py-3" colSpan={6}>{rows.length} facture{rows.length > 1 ? 's' : ''}</td>
                <td className="px-3 py-3">{totals.turnover} DH</td>
                <td className="px-3 py-3">{totals.collected} DH</td>
                <td className="px-3 py-3">{totals.open} DH</td>
                <td className="px-3 py-3" colSpan={2}>Espèces {totals.cash} · Carte {totals.card}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-fb-line">
        <h3 className="font-bold">Impayés à rappeler</h3>
        <p className="text-sm text-fb-muted">Sur la période et les filtres affichés.</p>
        {unpaid.length === 0 ? <p className="mt-3 text-sm font-bold text-fb-muted">Aucun reste dû.</p> : null}
        <ul className="mt-3 space-y-2">
          {unpaid.map((item) => {
            const patient = patients.find((entry) => entry.id === item.patientId);
            const href = patient
              ? whatsAppLink(patient.phone, `Bonjour ${patient.name}, il reste ${restOf(item)} DH sur la facture ${invoiceNo(item.id)} (${item.reason}).`)
              : '';
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fb-bg px-3 py-3">
                <div>
                  <p className="font-bold">{patient?.name ?? 'Patient'} · {restOf(item)} DH</p>
                  <p className="text-sm text-fb-muted">{invoiceNo(item.id)} · {formatWhen(item.start)} · {item.reason}</p>
                </div>
                <div className="flex gap-2">
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="h-9 rounded-lg bg-fb-green px-3 text-sm font-bold leading-9 text-white">WhatsApp</a>
                  ) : null}
                  <button type="button" onClick={() => setOpenId(item.id)} className="h-9 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">Détail</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {open ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-fb-ink/40 p-4" onClick={() => setOpenId(null)}>
          <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-bold text-fb">{invoiceNo(open.id)}</p>
            <h3 className="text-xl font-bold">{openPatient?.name ?? 'Patient'}</h3>
            <p className="text-sm text-fb-muted">
              {formatWhen(open.start)} · {open.reason} · {profiles.doctor(open.doctorId)?.name} · {openPatient?.insurance || 'Sans couverture'}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Tarif</dt><dd>{open.listPrice} DH</dd></div>
              <div className="flex justify-between"><dt>À payer</dt><dd className="font-bold">{dueAmount(open)} DH</dd></div>
              <div className="flex justify-between"><dt>Reste</dt><dd className="font-bold">{restOf(open)} DH</dd></div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-fb-muted">
                Remise
                <GuardedNumber
                  value={open.discount}
                  min={0}
                  max={open.listPrice}
                  ariaLabel="Remise"
                  onCommit={(discount) => onConsult(open.id, { discount })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold"
                />
              </label>
              <label className="text-xs font-bold text-fb-muted">
                Payé
                <GuardedNumber
                  value={open.paid}
                  min={0}
                  ariaLabel="Payé"
                  onCommit={(paid) => onConsult(open.id, { paid })}
                  className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 text-sm font-semibold"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['especes', 'carte'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    const prev = open.payMethod;
                    onConsult(open.id, { payMethod: mode });
                    toast.show('Enregistré', () => onConsult(open.id, { payMethod: prev }));
                  }}
                  className={`h-10 rounded-lg px-3 text-sm font-bold ${methodOf(open) === mode ? 'bg-fb text-white' : 'bg-fb-bg'}`}
                >
                  {mode === 'especes' ? 'Espèces' : 'Carte'}
                </button>
              ))}
              {payState(open) !== 'paye' ? (
                <button
                  type="button"
                  onClick={() =>
                    setAsk({
                      title: 'Voulez-vous vraiment encaisser ?',
                      text: `Encaisser ${dueAmount(open)} DH pour ${openPatient?.name ?? 'ce patient'}.`,
                      confirm: 'Oui, encaisser',
                      run: () => {
                        onConsult(open.id, { paid: dueAmount(open) });
                        setReceiptId(open.id);
                      },
                    })
                  }
                  className="h-10 rounded-lg bg-fb-soft px-3 text-sm font-bold text-fb-deep"
                >
                  Encaisser {dueAmount(open)} DH
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setAsk({
                      title: 'Voulez-vous vraiment modifier ?',
                      text: `Le paiement de ${openPatient?.name ?? 'ce patient'} redeviendra impayé.`,
                      confirm: 'Oui, modifier',
                      run: () => onConsult(open.id, { paid: 0, payMethod: undefined }),
                    })
                  }
                  className="h-10 rounded-lg bg-fb-bg px-3 text-sm font-bold"
                >
                  Remettre impayé
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {open.paid > 0 ? (
                <button type="button" onClick={() => setReceiptId(open.id)} className="h-10 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">Reçu</button>
              ) : null}
              {onOpenDocument && openPatient ? (
                <>
                  <button type="button" onClick={() => onOpenDocument(openPatient.id, open.id, 'facture')} className="h-10 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">Facture</button>
                  <button type="button" onClick={() => onOpenDocument(openPatient.id, open.id, 'feuille')} className="h-10 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">Feuille de soins</button>
                </>
              ) : null}
              <button type="button" onClick={() => setOpenId(null)} className="h-10 rounded-lg px-3 text-sm font-bold text-fb-muted">Fermer</button>
            </div>
          </div>
        </div>
      ) : null}

      {receipt ? (
        <Receipt
          consult={receipt}
          patient={patients.find((item) => item.id === receipt.patientId)}
          doctorName={profiles.doctor(receipt.doctorId)?.name}
          onClose={() => setReceiptId(null)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(ask)}
        tone="edit"
        title={ask?.title ?? ''}
        text={ask?.text ?? ''}
        confirmLabel={ask?.confirm ?? 'Oui, modifier'}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          ask?.run();
          setAsk(null);
        }}
      />
    </div>
  );
}
