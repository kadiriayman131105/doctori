'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Stethoscope, UserRound } from 'lucide-react';
import { useClinic } from '@/doctori/clinic-store';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const clinic = useClinic();
  const inSpace = pathname.startsWith('/espace');
  const showProfile = inSpace && clinic.role === 'medecin';

  function openProfile() {
    sessionStorage.setItem('doctori-open-profile', '1');
    if (inSpace) window.dispatchEvent(new Event('doctori-profile'));
    else router.push('/espace');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-fb-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-fb text-white">
            <Stethoscope size={18} />
          </span>
          <span className="text-xl font-bold tracking-tight text-fb">Doctori</span>
          <span className="hidden rounded-full bg-fb-soft px-2 py-0.5 text-xs font-semibold text-fb sm:inline">
            Casablanca
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {!inSpace ? (
            <Link href="/espace" className="inline-flex rounded-md bg-fb px-3 py-2 text-sm font-bold text-white hover:bg-fb-dark">
              Espace médecin
            </Link>
          ) : null}
          {showProfile ? (
            <button
              type="button"
              onClick={openProfile}
              className="inline-flex items-center gap-1.5 rounded-md bg-fb px-3 py-2 text-sm font-bold text-white hover:bg-fb-dark"
            >
              <UserRound size={16} />
              Mon profil
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-fb-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-fb-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-fb">Doctori · Casablanca</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/comment-faire" className="font-bold text-fb">
            Comment faire
          </Link>
          <p>Médecins de démonstration. Tarif affiché, créneau réel dans l’agenda, confirmation WhatsApp.</p>
        </div>
      </div>
    </footer>
  );
}
