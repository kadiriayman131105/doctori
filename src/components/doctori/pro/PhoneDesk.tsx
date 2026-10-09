'use client';

import { useMemo, useState } from 'react';
import { Phone, Send } from 'lucide-react';
import type { ClinicPatient, Consult } from '@/doctori/types';
import { useProfiles } from '@/doctori/profiles';
import { formatLong, formatWhen } from '@/doctori/slots';
import { phoneDigits, whatsAppLink } from '@/doctori/phone';
import { useToast } from './Toast';

export function PhoneDesk({ patients, consults }: { patients: ClinicPatient[]; consults: Consult[] }) {
  const [query, setQuery] = useState('');
  const profiles = useProfiles();
  const toast = useToast();
  const key = phoneDigits(query);

  const matches = useMemo(() => {
    if (key.length < 4) return [];
    return patients.filter((patient) => {
      const phone = phoneDigits(patient.phone);
      return phone.includes(key) || key.endsWith(phone.slice(-9));
    });
  }, [key, patients]);

  return (
    <section className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-fb-line">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-fb-soft text-fb">
          <Phone size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Appel au cabinet</h2>
          <p className="text-sm text-fb-muted">Cherchez par téléphone, puis ouvrez WhatsApp (gratuit, wa.me).</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputMode="tel"
            placeholder="06…"
            aria-label="Numéro du patient"
            className="mt-3 h-12 w-full rounded-xl border border-fb-line px-3 text-lg font-bold outline-none ring-fb focus:ring-2"
          />
        </div>
      </div>
      {key.length >= 4 && matches.length === 0 ? (
        <p className="mt-3 text-sm font-bold text-fb-muted">Aucun patient avec ce numéro.</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {matches.map((patient) => {
          const doctor = profiles.doctor(patient.doctorId);
          const now = Date.now() - 30 * 60 * 1000;
          const next = consults
            .filter(
              (item) =>
                item.patientId === patient.id &&
                (item.flow === 'a_venir' || item.flow === 'arrive' || item.flow === 'en_cours') &&
                new Date(item.start).getTime() >= now,
            )
            .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];
          const href =
            next && doctor
              ? whatsAppLink(
                  patient.phone,
                  `Bonjour ${patient.name}, rappel de votre rendez-vous avec ${doctor.name} le ${formatLong(next.start)}. Adresse : ${doctor.address}. Tarif : ${next.listPrice} DH. Merci de confirmer.`,
                )
              : '';
          return (
            <li key={patient.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fb-bg px-3 py-3">
              <div>
                <p className="font-bold">{patient.name}</p>
                <p className="text-sm text-fb-muted">
                  {patient.phone}
                  {doctor ? ` · ${doctor.name}` : ''}
                </p>
                <p className="mt-1 text-sm font-bold">
                  {next ? `Prochain rendez-vous : ${formatWhen(next.start)}` : 'Aucun rendez-vous à venir.'}
                </p>
              </div>
              {next ? (
                <button
                  type="button"
                  onClick={() => {
                    window.open(href, '_blank', 'noopener,noreferrer');
                    toast.show('WhatsApp ouvert');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-fb-green px-3 py-2 text-sm font-bold text-white"
                >
                  <Send size={16} />
                  Rappel WhatsApp
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
