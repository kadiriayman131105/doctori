'use client';

import { useClinic } from '@/doctori/clinic-store';

export function Footer() {
  const clinic = useClinic();
  if (!clinic.role) return null;
  return (
    <footer className="mt-16 border-t border-fb-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-fb-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-fb">Doctori</p>
        <p>Logiciel de cabinet. Le patient n’a pas de compte.</p>
      </div>
    </footer>
  );
}
