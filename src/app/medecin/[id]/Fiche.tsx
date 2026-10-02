'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { insuranceLabel, VISIT_LABEL, CABINET_WHATSAPP } from '@/doctori/data';
import { useClinic } from '@/doctori/clinic-store';
import { useHours } from '@/doctori/hours-store';
import { useProfiles } from '@/doctori/profiles';
import { formatLong, formatWhen, slotsFor } from '@/doctori/slots';
import { isMoroccanMobile, useDoctori, whatsAppLink } from '@/doctori/store';
import { initials } from '@/components/doctori/DoctorCard';
import type { VisitType } from '@/doctori/types';

const SlotCalendar = dynamic(() => import('@/components/doctori/SlotCalendar').then((mod) => mod.SlotCalendar), {
  ssr: false,
});

export default function MedecinFiche() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { doctor: findDoctor } = useProfiles();
  const doctor = findDoctor(id);
  const { book, takenSlotIds, ready } = useDoctori();
  const hours = useHours();
  const clinic = useClinic();
  const initialType = (params.get('type') as VisitType) || doctor?.visitTypes[0] || 'cabinet';
  const [visit, setVisit] = useState<VisitType>(
    doctor?.visitTypes.includes(initialType) ? initialType : doctor?.visitTypes[0] || 'cabinet',
  );
  const [chosenSlot, setChosenSlot] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ start: string; name: string } | null>(null);

  const slots = useMemo(() => {
    if (!doctor) return [];
    return slotsFor(doctor.id, {
      week: hours.week(doctor.id),
      closed: hours.closed(doctor.id),
      busyStarts: clinic.consults
        .filter((item) => item.doctorId === doctor.id && item.flow !== 'annule' && item.flow !== 'absent')
        .map((item) => item.start),
    }).filter((slot) => slot.visitType === visit && !takenSlotIds.has(slot.id));
  }, [clinic.consults, doctor, hours, visit, takenSlotIds]);

  const chosen = slots.find((slot) => slot.id === chosenSlot);

  if (!doctor) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">Ce médecin n’est pas dans l’annuaire de Casablanca.</p>
        <Link href="/" className="mt-3 inline-block font-bold text-fb">
          Retour à l’accueil
        </Link>
      </main>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!doctor) return;
    const data = new FormData(event.currentTarget);
    const patientName = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').replace(/\s/g, '');
    const reason = String(data.get('reason') || '').trim();
    const slot = slots.find((item) => item.id === chosenSlot);
    if (!slot) {
      setError('Choisissez un créneau.');
      return;
    }
    if (patientName.length < 3) {
      setError('Indiquez le nom du patient.');
      return;
    }
    if (!isMoroccanMobile(phone)) {
      setError('Numéro marocain attendu, par exemple 0612345678.');
      return;
    }
    book({
      doctorId: doctor.id,
      slotId: slot.id,
      start: slot.start,
      visitType: visit,
      patientName,
      phone,
      reason,
    });
    setDone({ start: slot.start, name: patientName });
    setError('');
  }

  if (done) {
    const message = `Bonjour, je confirme le rendez-vous de ${done.name} avec ${doctor.name} (${VISIT_LABEL[visit]}) le ${formatLong(done.start)}. Adresse : ${doctor.address}. Tarif : ${doctor.fee} DH.`;
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-fb-line">
          <p className="text-sm font-bold text-fb-green">Rendez-vous enregistré</p>
          <h1 className="mt-1 text-2xl font-bold">{formatWhen(done.start)}</h1>
          <p className="mt-2 text-fb-muted">
            {doctor.name} · {doctor.neighborhood} · {doctor.fee} DH
          </p>
          <a
            href={whatsAppLink(CABINET_WHATSAPP, message)}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex h-12 items-center justify-center rounded-lg bg-fb-green font-bold text-white"
          >
            Confirmer sur WhatsApp
          </a>
          <Link href="/" className="mt-3 block text-center font-bold text-fb">
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-fb-line">
        <div className="flex gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-fb text-xl font-bold text-white">
            {doctor.photo ? <img src={doctor.photo} alt="" className="h-full w-full object-cover" /> : initials(doctor.name)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold">{doctor.name}</h1>
              <BadgeCheck className="text-fb" size={18} />
            </div>
            <p className="text-fb-muted">
              {doctor.specialty} · {doctor.experience} ans d’expérience
            </p>
            {doctor.diploma ? <p className="text-sm font-semibold">{doctor.diploma}</p> : null}
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {doctor.rating.toFixed(1)} · {doctor.reviewCount} avis
            </p>
          </div>
        </div>
        <p className="mt-4">{doctor.bio}</p>
        <p className="mt-3 flex items-start gap-2 text-sm text-fb-muted">
          <MapPin size={16} className="mt-0.5 shrink-0 text-fb" />
          {doctor.address}
        </p>
        <p className="mt-3 text-sm">
          <span className="font-bold">Langues.</span> {doctor.languages.join(', ')}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-bold">Prise en charge.</span> {insuranceLabel(doctor.insurance)}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-bold">À apporter.</span> {doctor.brings.join(' · ')}
        </p>
        <div className="mt-5">
          <p className="mb-2 text-sm font-bold">Choisissez un créneau libre</p>
          {ready ? (
            <SlotCalendar slots={slots} chosenId={chosenSlot} onPick={setChosenSlot} />
          ) : (
            <p className="text-sm text-fb-muted">Chargement de l’agenda…</p>
          )}
        </div>
      </section>

      <form onSubmit={onSubmit} className="h-fit rounded-2xl bg-white p-5 ring-1 ring-fb-line">
        <p className="text-2xl font-bold">{doctor.fee} DH</p>
        <p className="text-sm text-fb-muted">Consultation, tarif affiché</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {doctor.visitTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setVisit(type);
                setChosenSlot('');
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                visit === type ? 'bg-fb text-white' : 'bg-fb-bg'
              }`}
            >
              {VISIT_LABEL[type]}
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-fb-soft px-3 py-2 text-sm font-bold text-fb-deep">
          {chosen ? formatWhen(chosen.start) : 'Aucun créneau sélectionné'}
        </p>
        <label className="mt-4 block text-sm font-semibold">
          Nom du patient
          <input
            name="name"
            className="mt-1 h-11 w-full rounded-lg border border-fb-line px-3 font-normal outline-none ring-fb focus:ring-2"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Mobile
          <input
            name="phone"
            inputMode="tel"
            placeholder="06XXXXXXXX"
            className="mt-1 h-11 w-full rounded-lg border border-fb-line px-3 font-normal outline-none ring-fb focus:ring-2"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Motif
          <input
            name="reason"
            className="mt-1 h-11 w-full rounded-lg border border-fb-line px-3 font-normal outline-none ring-fb focus:ring-2"
          />
        </label>
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <button type="submit" className="mt-4 h-12 w-full rounded-lg bg-fb font-bold text-white hover:bg-fb-dark">
          Confirmer le rendez-vous
        </button>
      </form>
    </main>
  );
}
