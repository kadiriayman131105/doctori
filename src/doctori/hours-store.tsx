'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_WEEK, type WeekHours } from './hours';

const KEY = 'doctori-hours-v1';

interface SavedHours {
  week: WeekHours;
  closed: string[];
}

interface HoursApi {
  ready: boolean;
  week: (doctorId: string) => WeekHours;
  closed: (doctorId: string) => string[];
  saveWeek: (doctorId: string, week: WeekHours) => void;
  toggleClosed: (doctorId: string, day: string) => boolean;
  closeDays: (doctorIds: string[], days: string[]) => number;
  saveClosed: (doctorId: string, closed: string[]) => void;
}

const HoursContext = createContext<HoursApi | null>(null);

export function HoursProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Record<string, SavedHours>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSaved(JSON.parse(raw) as Record<string, SavedHours>);
    } catch {
      setSaved({});
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(saved));
  }, [saved, ready]);

  const value = useMemo<HoursApi>(
    () => ({
      ready,
      week: (doctorId) => saved[doctorId]?.week ?? DEFAULT_WEEK,
      closed: (doctorId) => saved[doctorId]?.closed ?? [],
      saveWeek: (doctorId, week) => {
        setSaved((current) => ({
          ...current,
          [doctorId]: { week, closed: current[doctorId]?.closed ?? [] },
        }));
      },
      toggleClosed: (doctorId, day) => {
        const previous = saved[doctorId]?.closed ?? [];
        const blocked = !previous.includes(day);
        const closed = blocked ? [...previous, day] : previous.filter((item) => item !== day);
        setSaved((current) => ({
          ...current,
          [doctorId]: { week: current[doctorId]?.week ?? DEFAULT_WEEK, closed },
        }));
        return blocked;
      },
      saveClosed: (doctorId, closed) => {
        setSaved((current) => ({
          ...current,
          [doctorId]: { week: current[doctorId]?.week ?? DEFAULT_WEEK, closed },
        }));
      },
      closeDays: (doctorIds, days) => {
        let added = 0;
        const next = { ...saved };
        for (const doctorId of doctorIds) {
          const previous = saved[doctorId]?.closed ?? [];
          const closed = Array.from(new Set([...previous, ...days]));
          added += closed.length - previous.length;
          next[doctorId] = { week: saved[doctorId]?.week ?? DEFAULT_WEEK, closed };
        }
        setSaved(next);
        return added;
      },
    }),
    [ready, saved],
  );

  return <HoursContext.Provider value={value}>{children}</HoursContext.Provider>;
}

export function useHours() {
  const context = useContext(HoursContext);
  if (!context) throw new Error('HoursProvider manquant');
  return context;
}
