'use client';

import { LoginScreen } from '@/components/doctori/LoginScreen';
import { ProApp } from '@/components/doctori/pro/ProApp';
import { useClinic } from '@/doctori/clinic-store';

export default function HomePage() {
  const clinic = useClinic();
  if (!clinic.ready) return <p className="px-4 py-16 text-center text-fb-muted">Ouverture du cabinet…</p>;
  if (!clinic.role) return <LoginScreen />;
  return <ProApp />;
}
