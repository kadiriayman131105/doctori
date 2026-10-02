import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espace médecin — Doctori',
  description: 'Agenda, patients et facturation du cabinet Doctori à Casablanca.',
};

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
