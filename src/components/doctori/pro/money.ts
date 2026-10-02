import type { Consult } from '@/doctori/types';
import { billed, dueAmount, payState } from '@/doctori/clinic';

export function moneyOf(consults: Consult[]) {
  const active = consults.filter(billed);
  const collected = active.reduce((sum, item) => sum + item.paid, 0);
  const expected = active.reduce((sum, item) => sum + dueAmount(item), 0);
  return { collected, expected, open: Math.max(0, expected - collected), active };
}

export function lastDays(consults: Consult[], days = 7) {
  const points = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day);
    const value = consults
      .filter((item) => {
        const start = new Date(item.start);
        return start.toDateString() === day.toDateString() && billed(item);
      })
      .reduce((sum, item) => sum + item.paid, 0);
    points.push({ label, value });
  }
  return points;
}

export function sameDay(iso: string, offset = 0) {
  const date = new Date(iso);
  const target = new Date();
  target.setDate(target.getDate() + offset);
  return date.toDateString() === target.toDateString();
}

export function inRange(iso: string, range: 'today' | 'week' | 'month' | 'all') {
  if (range === 'all') return true;
  const start = new Date(iso).getTime();
  const now = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (range === 'today') return sameDay(iso);
  if (range === 'week') from.setDate(now.getDate() - 6);
  if (range === 'month') from.setDate(now.getDate() - 30);
  return start >= from.getTime();
}

export { dueAmount, payState, billed };
