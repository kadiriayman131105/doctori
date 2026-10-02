'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ClinicPatient, Consult } from './types';
import { ACCOUNTS, buildClinic } from './clinic';

const SESSION = 'doctori-pro-session';
const DATA = 'doctori-pro-data-v1';

interface Saved {
  patients: ClinicPatient[];
  consults: Consult[];
}

type Role = 'medecin' | 'secretaire';

interface Session {
  role: Role;
  doctorId: string | null;
}

interface ClinicApi {
  ready: boolean;
  role: Role | null;
  doctorId: string | null;
  patients: ClinicPatient[];
  consults: Consult[];
  login: (email: string, password: string) => string | null;
  logout: () => void;
  updatePatient: (id: string, patch: Partial<ClinicPatient>) => void;
  updateConsult: (id: string, patch: Partial<Consult>) => void;
  addConsult: (input: Omit<Consult, 'id'>) => void;
  removeConsult: (id: string) => void;
  addPatient: (input: Omit<ClinicPatient, 'id'>) => string;
  removePatient: (id: string) => void;
  assignPatient: (id: string, doctorId: string) => void;
  switchView: () => void;
}

const ClinicContext = createContext<ClinicApi | null>(null);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patients, setPatients] = useState<ClinicPatient[]>([]);
  const [consults, setConsults] = useState<Consult[]>([]);

  useEffect(() => {
    const seed = buildClinic();
    try {
      const raw = localStorage.getItem(DATA);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        setPatients(saved.patients?.length ? saved.patients : seed.patients);
        setConsults(saved.consults?.length ? saved.consults : seed.consults);
      } else {
        setPatients(seed.patients);
        setConsults(seed.consults);
      }
    } catch {
      setPatients(seed.patients);
      setConsults(seed.consults);
    }
    const sessionRaw = localStorage.getItem(SESSION);
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw) as Session;
        if (session.role === 'medecin' || session.role === 'secretaire') {
          setRole(session.role);
          setDoctorId(session.doctorId);
        }
      } catch {
        setRole('medecin');
        setDoctorId(sessionRaw);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(DATA, JSON.stringify({ patients, consults }));
  }, [patients, consults, ready]);

  const value = useMemo<ClinicApi>(
    () => ({
      ready,
      role,
      doctorId,
      patients,
      consults,
      login: (email, password) => {
        const account = ACCOUNTS.find(
          (item) => item.email === email.trim().toLowerCase() && item.password === password,
        );
        if (!account) return 'E-mail ou mot de passe incorrect.';
        const session: Session = { role: account.role, doctorId: account.doctorId || null };
        localStorage.setItem(SESSION, JSON.stringify(session));
        setRole(session.role);
        setDoctorId(session.doctorId);
        return null;
      },
      logout: () => {
        localStorage.removeItem(SESSION);
        setRole(null);
        setDoctorId(null);
      },
      switchView: () => {
        setRole((current) => {
          const next = current === 'secretaire' ? 'medecin' : 'secretaire';
          setDoctorId((currentId) => {
            const nextId = next === 'medecin' ? currentId || 'amal-bennani' : currentId;
            localStorage.setItem(SESSION, JSON.stringify({ role: next, doctorId: nextId }));
            return nextId;
          });
          return next;
        });
      },
      updatePatient: (id, patch) => {
        setPatients((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      },
      updateConsult: (id, patch) => {
        setConsults((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      },
      addConsult: (input) => {
        setConsults((current) => [{ ...input, id: `c-${Date.now()}` }, ...current]);
      },
      removeConsult: (id) => {
        setConsults((current) => current.filter((item) => item.id !== id));
      },
      addPatient: (input) => {
        const id = `p-${Date.now()}`;
        setPatients((current) => [{ ...input, id }, ...current]);
        return id;
      },
      removePatient: (id) => {
        setPatients((current) => current.filter((item) => item.id !== id));
        setConsults((current) => current.filter((item) => item.patientId !== id));
      },
      assignPatient: (id, nextDoctorId) => {
        setPatients((current) => current.map((item) => (item.id === id ? { ...item, doctorId: nextDoctorId } : item)));
        setConsults((current) =>
          current.map((item) =>
            item.patientId === id && item.flow === 'a_venir' ? { ...item, doctorId: nextDoctorId } : item,
          ),
        );
      },
    }),
    [ready, role, doctorId, patients, consults],
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) throw new Error('ClinicProvider manquant');
  return context;
}
