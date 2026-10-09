'use client';

import { useState } from 'react';
import type { ClinicPatient, Consult } from '@/doctori/types';
import { clashesAt, isOpenAt, type WeekHours } from '@/doctori/hours';
import { useHours } from '@/doctori/hours-store';
import { useProfiles } from '@/doctori/profiles';
import { formatWhen } from '@/doctori/slots';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

function inFifteenDays(fromIso: string, week: WeekHours, closed: string[]) {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + 15);
  for (let i = 0; i < 14; i += 1) {
    if (isOpenAt(date, week, closed)) return date.toISOString();
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString();
}

export function FollowUpButton({
  consult,
  patient,
  consults,
  onAdd,
}: {
  consult: Consult;
  patient: ClinicPatient;
  consults: Consult[];
  onAdd?: (input: Omit<Consult, 'id'>) => string | void;
}) {
  const hours = useHours();
  const profiles = useProfiles();
  const toast = useToast();
  const [clash, setClash] = useState<{ text: string; run: () => void } | null>(null);
  if (!onAdd) return null;

  function place() {
    const doctor = profiles.doctor(consult.doctorId);
    const start = inFifteenDays(consult.start, hours.week(consult.doctorId), hours.closed(consult.doctorId));
    const input: Omit<Consult, 'id'> = {
      doctorId: consult.doctorId,
      patientId: consult.patientId,
      start,
      visitType: consult.visitType,
      reason: 'Contrôle',
      flow: 'a_venir',
      listPrice: doctor?.fee ?? consult.listPrice,
      discount: 0,
      paid: 0,
      note: '',
    };
    const write = () => {
      onAdd?.(input);
      toast.show(`Contrôle posé le ${formatWhen(start)}`);
    };
    const other = clashesAt(consults, consult.doctorId, start);
    if (other) {
      const name = other.patientId === patient.id ? patient.name : 'Un autre patient';
      setClash({
        text: `${name} a déjà une consultation à ${formatWhen(other.start)}. Continuer quand même ?`,
        run: write,
      });
      return;
    }
    write();
  }

  return (
    <>
      <button type="button" onClick={place} className="h-10 rounded-lg bg-white px-3 text-sm font-bold ring-1 ring-fb-line">
        Contrôle dans 15 jours
      </button>
      <ConfirmDialog
        open={Boolean(clash)}
        tone="edit"
        title="Ce créneau est déjà pris"
        text={clash?.text ?? ''}
        confirmLabel="Continuer quand même"
        onCancel={() => setClash(null)}
        onConfirm={() => {
          clash?.run();
          setClash(null);
        }}
      />
    </>
  );
}
