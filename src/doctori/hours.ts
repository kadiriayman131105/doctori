import type { Consult } from './types';

export interface DayHours {
  open: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

export type WeekHours = DayHours[];

const WEEKDAY: DayHours = { open: true, start: '09:00', end: '18:00', breakStart: '12:30', breakEnd: '15:00' };
const SATURDAY: DayHours = { open: true, start: '09:00', end: '13:00', breakStart: '13:00', breakEnd: '13:00' };
const SUNDAY: DayHours = { open: false, start: '09:00', end: '13:00', breakStart: '13:00', breakEnd: '13:00' };

export const DEFAULT_WEEK: WeekHours = [SUNDAY, WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, SATURDAY];

export const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function dateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function minutes(value: string) {
  const [hours, mins] = value.split(':').map(Number);
  return hours * 60 + mins;
}

export function isOpenAt(date: Date, week: WeekHours, closed: string[]) {
  if (closed.includes(dateKey(date))) return false;
  const day = week[date.getDay()] ?? SUNDAY;
  if (!day.open) return false;
  const time = date.getHours() * 60 + date.getMinutes();
  const start = minutes(day.start);
  const end = minutes(day.end);
  if (time < start || time >= end) return false;
  const pauseStart = minutes(day.breakStart);
  const pauseEnd = minutes(day.breakEnd);
  if (pauseEnd > pauseStart && time >= pauseStart && time < pauseEnd) return false;
  return true;
}

export function clashesAt(consults: Consult[], doctorId: string, start: string, ignoreId?: string) {
  const target = new Date(start).getTime();
  if (Number.isNaN(target)) return undefined;
  return consults.find((item) => {
    if (item.id === ignoreId || item.doctorId !== doctorId) return false;
    if (item.flow === 'annule' || item.flow === 'absent') return false;
    return Math.abs(new Date(item.start).getTime() - target) < 30 * 60 * 1000;
  });
}
