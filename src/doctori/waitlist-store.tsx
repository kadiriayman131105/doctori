'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'doctori-waitlist-v1';

export interface WaitEntry {
  id: string;
  doctorId: string;
  name: string;
  phone: string;
  reason: string;
  createdAt: string;
}

interface WaitApi {
  ready: boolean;
  entries: WaitEntry[];
  add: (input: Omit<WaitEntry, 'id' | 'createdAt'>) => string;
  remove: (id: string) => void;
}

const WaitContext = createContext<WaitApi | null>(null);

export function WaitProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WaitEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw) as WaitEntry[]);
    } catch {
      setEntries([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(entries));
  }, [entries, ready]);

  const value = useMemo<WaitApi>(
    () => ({
      ready,
      entries,
      add: (input) => {
        const id = `w-${Date.now()}`;
        setEntries((current) => [{ ...input, id, createdAt: new Date().toISOString() }, ...current]);
        return id;
      },
      remove: (id) => setEntries((current) => current.filter((item) => item.id !== id)),
    }),
    [entries, ready],
  );

  return <WaitContext.Provider value={value}>{children}</WaitContext.Provider>;
}

export function useWaitlist() {
  const context = useContext(WaitContext);
  if (!context) throw new Error('WaitProvider manquant');
  return context;
}
