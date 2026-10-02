import type { Slot, VisitType } from './types';
import { DOCTORS } from './data';
import { DEFAULT_WEEK, isOpenAt, type WeekHours } from './hours';

export interface SlotOptions {
  week?: WeekHours;
  closed?: string[];
  busyStarts?: string[];
}

export function slotId(doctorId: string, date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${doctorId}-${y}${m}${d}-${hh}${mm}`;
}

function at(dayOffset: number, hours: number, minutes: number) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function taken(start: string, busy: string[]) {
  const target = new Date(start).getTime();
  return busy.some((item) => Math.abs(new Date(item).getTime() - target) < 30 * 60 * 1000);
}

export function slotsFor(doctorId: string, options?: SlotOptions): Slot[] {
  const doctor = DOCTORS.find((item) => item.id === doctorId);
  if (!doctor) return [];
  const week = options?.week ?? DEFAULT_WEEK;
  const closed = options?.closed ?? [];
  const busy = options?.busyStarts ?? [];
  const slots: Slot[] = [];
  const now = Date.now() + 30 * 60 * 1000;

  for (let day = 0; day < 6; day += 1) {
    for (let hour = 8; hour <= 19; hour += 1) {
      for (const minute of [0, 30]) {
        const date = at(day, hour, minute);
        if (date.getTime() < now || !isOpenAt(date, week, closed)) continue;
        const start = date.toISOString();
        if (taken(start, busy)) continue;
        const base = slotId(doctor.id, date);
        if (doctor.visitTypes.includes('cabinet')) {
          slots.push({ id: base, doctorId: doctor.id, start, visitType: 'cabinet' });
        }
        if (doctor.visitTypes.includes('video') && hour === 18 && minute === 0) {
          slots.push({ id: `${base}-video`, doctorId: doctor.id, start, visitType: 'video' });
        }
        if (doctor.visitTypes.includes('domicile') && hour === 11 && minute === 0) {
          slots.push({ id: `${base}-domicile`, doctorId: doctor.id, start, visitType: 'domicile' });
        }
      }
    }
  }

  return slots.sort((a, b) => +new Date(a.start) - +new Date(b.start));
}

export function nextSlot(doctorId: string, visitType?: VisitType, options?: SlotOptions) {
  return slotsFor(doctorId, options).find((slot) => !visitType || slot.visitType === visitType);
}

export function isSameDay(iso: string, offset = 0) {
  const date = new Date(iso);
  const target = new Date();
  target.setDate(target.getDate() + offset);
  return date.toDateString() === target.toDateString();
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (isSameDay(iso)) return `Aujourd’hui à ${time}`;
  if (isSameDay(iso, 1)) return `Demain à ${time}`;
  const day = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
  return `${day} à ${time}`;
}

export function formatLong(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(iso: string) {
  if (isSameDay(iso)) return 'Aujourd’hui';
  if (isSameDay(iso, 1)) return 'Demain';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}
