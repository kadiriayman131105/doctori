'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DOCTORS } from './data';
import type { Doctor } from './types';

const KEY = 'doctori-profiles-v1';

export type DoctorPatch = Partial<
  Pick<
    Doctor,
    | 'name'
    | 'specialty'
    | 'neighborhood'
    | 'address'
    | 'fee'
    | 'languages'
    | 'insurance'
    | 'visitTypes'
    | 'experience'
    | 'bio'
    | 'brings'
    | 'diploma'
    | 'photo'
  >
>;

interface ProfileApi {
  ready: boolean;
  doctors: Doctor[];
  doctor: (id: string) => Doctor | undefined;
  save: (id: string, patch: DoctorPatch) => void;
}

const ProfileContext = createContext<ProfileApi | null>(null);

function merge(doctor: Doctor, patch?: DoctorPatch): Doctor {
  if (!patch) return doctor;
  return {
    ...doctor,
    ...patch,
    languages: patch.languages?.length ? patch.languages : doctor.languages,
    insurance: patch.insurance?.length ? patch.insurance : doctor.insurance,
    visitTypes: patch.visitTypes?.length ? patch.visitTypes : doctor.visitTypes,
    brings: patch.brings?.length ? patch.brings : doctor.brings,
    photo: patch.photo !== undefined ? patch.photo : doctor.photo,
    diploma: patch.diploma ?? doctor.diploma,
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [patches, setPatches] = useState<Record<string, DoctorPatch>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPatches(JSON.parse(raw) as Record<string, DoctorPatch>);
    } catch {
      setPatches({});
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(patches));
  }, [patches, ready]);

  const value = useMemo<ProfileApi>(() => {
    const doctors = DOCTORS.map((doctor) => merge(doctor, patches[doctor.id]));
    return {
      ready,
      doctors,
      doctor: (id) => doctors.find((item) => item.id === id),
      save: (id, patch) => {
        setPatches((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
      },
    };
  }, [patches, ready]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('ProfileProvider manquant');
  return context;
}
