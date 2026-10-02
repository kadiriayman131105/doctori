'use client';

import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import type { Doctor, VisitType } from '@/doctori/types';
import { VISIT_LABEL, insuranceLabel } from '@/doctori/data';
import { useClinic } from '@/doctori/clinic-store';
import { useHours } from '@/doctori/hours-store';
import { formatWhen, nextSlot } from '@/doctori/slots';

export function initials(name: string) {
  return name
    .replace(/^Dr\s+/, '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function DoctorCard({ doctor, visitType }: { doctor: Doctor; visitType?: VisitType }) {
  const hours = useHours();
  const clinic = useClinic();
  const kind = visitType && doctor.visitTypes.includes(visitType) ? visitType : undefined;
  const slot = nextSlot(doctor.id, kind, {
    week: hours.week(doctor.id),
    closed: hours.closed(doctor.id),
    busyStarts: clinic.consults
      .filter((item) => item.doctorId === doctor.id && item.flow !== 'annule' && item.flow !== 'absent')
      .map((item) => item.start),
  });
  const today = slot ? formatWhen(slot.start).startsWith('Aujourd') : false;

  return (
    <article className="flex flex-col rounded-2xl border border-fb-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-fb text-lg font-bold text-white">
          {doctor.photo ? <img src={doctor.photo} alt="" className="h-full w-full object-cover" /> : initials(doctor.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-base font-bold text-fb-ink">{doctor.name}</h2>
            <BadgeCheck size={16} className="shrink-0 text-fb" aria-label="Profil vérifié" />
          </div>
          <p className="text-sm text-fb-muted">
            {doctor.specialty} · {doctor.neighborhood}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-fb-ink">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {doctor.rating.toFixed(1)}
            <span className="font-normal text-fb-muted">({doctor.reviewCount} avis)</span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-fb-muted">{insuranceLabel(doctor.insurance)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {doctor.visitTypes.map((type) => (
          <span key={type} className="rounded-full bg-fb-soft px-2 py-0.5 text-xs font-semibold text-fb-deep">
            {VISIT_LABEL[type]}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-fb-bg pt-3">
        <div>
          <p className="text-lg font-bold text-fb-ink">{doctor.fee} DH</p>
          <p className={`text-sm font-semibold ${today ? 'text-fb-green' : 'text-fb'}`}>
            {slot ? formatWhen(slot.start) : 'Complet cette semaine'}
          </p>
        </div>
        <Link
          href={`/medecin/${doctor.id}${visitType ? `?type=${visitType}` : ''}`}
          className="rounded-lg bg-fb px-3 py-2 text-sm font-bold text-white hover:bg-fb-dark"
        >
          Voir les créneaux
        </Link>
      </div>
    </article>
  );
}
