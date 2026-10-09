'use client';

import { FormEvent, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { useClinic } from '@/doctori/clinic-store';

const PHOTOS = [
  { src: '/services/cabinet.jpg', alt: 'Cabinet médical' },
  { src: '/services/video.jpg', alt: 'Consultation vidéo' },
  { src: '/services/domicile.jpg', alt: 'Visite à domicile' },
  { src: '/services/rappel.jpg', alt: 'Rappel au patient' },
];

export function LoginScreen() {
  const clinic = useClinic();
  const [error, setError] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = clinic.login(String(data.get('email') || ''), String(data.get('password') || ''));
    setError(message || '');
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative min-h-[280px] overflow-hidden lg:min-h-screen">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {PHOTOS.map((photo) => (
            <img key={photo.src} src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#041833]/88 via-[#041833]/45 to-[#0C4DA2]/25" />
        <div className="relative flex h-full flex-col justify-end p-8 text-white sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">Doctori</p>
          <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight sm:text-5xl">Votre cabinet, dans votre bureau.</h1>
          <p className="mt-4 max-w-md text-base text-white/85">
            Agenda, patients, caisse et documents. Le patient n’a pas de compte : c’est vous qui tenez le planning.
          </p>
        </div>
      </section>
      <section className="flex items-center bg-white px-6 py-12 sm:px-12">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fb text-white">
            <Stethoscope size={22} />
          </span>
          <h2 className="mt-6 text-3xl font-bold">Connexion</h2>
          <p className="mt-2 text-fb-muted">Entrez dans le cabinet. Un compte pour le médecin, un pour le secrétariat.</p>
          <label className="mt-8 block text-sm font-bold">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="amal@doctori.ma"
              className="mt-2 h-12 w-full rounded-xl border border-fb-line px-3 font-semibold outline-none ring-fb focus:ring-2"
            />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Mot de passe
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 h-12 w-full rounded-xl border border-fb-line px-3 font-semibold outline-none ring-fb focus:ring-2"
            />
          </label>
          {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button type="submit" className="mt-6 h-12 w-full rounded-xl bg-fb text-base font-bold text-white hover:bg-fb-dark">
            Entrer dans le cabinet
          </button>
          <p className="mt-8 text-sm leading-6 text-fb-muted">
            Chaque médecin a son secrétariat. Démonstration : <span className="font-semibold text-fb-ink">amal@doctori.ma</span> et{' '}
            <span className="font-semibold text-fb-ink">secretaire@doctori.ma</span>. Les autres :{' '}
            <span className="font-semibold text-fb-ink">youssef@doctori.ma</span> avec{' '}
            <span className="font-semibold text-fb-ink">sec.youssef-el-idrissi@doctori.ma</span>. Mot de passe{' '}
            <span className="font-semibold text-fb-ink">doctori</span>.
          </p>
        </form>
      </section>
    </main>
  );
}
