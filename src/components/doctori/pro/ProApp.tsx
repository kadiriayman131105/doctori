'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeftRight, CalendarDays, LayoutDashboard, LogOut, Receipt, Users } from 'lucide-react';
import { ACCOUNTS } from '@/doctori/clinic';
import { useClinic } from '@/doctori/clinic-store';
import { useProfiles } from '@/doctori/profiles';
import { Agenda } from './Agenda';
import { Billing } from './Billing';
import { Overview } from './Overview';
import { Patients } from './Patients';
import { HoursEditor } from './HoursEditor';
import { ProfileForm } from './ProfileForm';
import { SecretaryDesk } from './SecretaryDesk';

type Tab = 'board' | 'agenda' | 'patients' | 'billing' | 'profil';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'board', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'agenda', label: 'Rendez-vous', icon: CalendarDays },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'billing', label: 'Facturation', icon: Receipt },
];

export function ProApp() {
  const clinic = useClinic();
  const profiles = useProfiles();
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('board');
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    function openProfile() {
      setTab('profil');
    }
    if (sessionStorage.getItem('doctori-open-profile') === '1') {
      sessionStorage.removeItem('doctori-open-profile');
      setTab('profil');
    }
    window.addEventListener('doctori-profile', openProfile);
    return () => window.removeEventListener('doctori-profile', openProfile);
  }, []);

  if (!clinic.ready) return <p className="px-4 py-16 text-center text-fb-muted">Ouverture du cabinet…</p>;

  if (!clinic.role) {
    function onSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const message = clinic.login(String(data.get('email') || ''), String(data.get('password') || ''));
      setError(message || '');
    }

    return (
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-2">
        <section>
          <p className="text-sm font-bold text-fb">Espace médecin</p>
          <h1 className="mt-2 text-3xl font-bold">Le cabinet, les patients et les paiements</h1>
          <p className="mt-3 text-fb-muted">
            Agenda filtré, fiches avec âge, sexe et notes, remises, et ce qui est encaissé ou encore dû.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {ACCOUNTS.map((account) => {
              return (
                <li key={account.email} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-fb-line">
                  <p className="font-bold">{account.label}</p>
                  <p className="text-fb-muted">
                    {account.email} · mot de passe <span className="font-bold text-fb-ink">{account.password}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
        <form onSubmit={onSubmit} className="h-fit rounded-3xl bg-white p-6 ring-1 ring-fb-line">
          <h2 className="text-xl font-bold">Connexion</h2>
          <label className="mt-4 block text-sm font-bold">
            E-mail
            <input name="email" type="email" autoComplete="username" required className="mt-1 h-12 w-full rounded-xl border border-fb-line px-3 font-semibold outline-none ring-fb focus:ring-2" />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Mot de passe
            <input name="password" type="password" autoComplete="current-password" required className="mt-1 h-12 w-full rounded-xl border border-fb-line px-3 font-semibold outline-none ring-fb focus:ring-2" />
          </label>
          {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button type="submit" className="mt-5 h-12 w-full rounded-xl bg-fb font-bold text-white hover:bg-fb-dark">
            Entrer dans le cabinet
          </button>
        </form>
      </main>
    );
  }

  if (clinic.role === 'secretaire') {
    return (
      <SecretaryDesk
        patients={clinic.patients}
        consults={clinic.consults}
        onConsult={clinic.updateConsult}
        onAddConsult={clinic.addConsult}
        onRemoveConsult={clinic.removeConsult}
        onPatient={clinic.updatePatient}
        onAddPatient={clinic.addPatient}
        onRemovePatient={clinic.removePatient}
        onAssign={clinic.assignPatient}
        onSwitch={clinic.switchView}
        onLogout={clinic.logout}
      />
    );
  }

  const doctor = profiles.doctor(clinic.doctorId || '');
  const patients = clinic.patients.filter((item) => item.doctorId === clinic.doctorId);
  const consults = clinic.consults.filter((item) => item.doctorId === clinic.doctorId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-fb">{doctor?.specialty}</p>
          <h1 className="text-2xl font-bold">{doctor?.name}</h1>
          <p className="text-sm text-fb-muted">{doctor?.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={clinic.switchView} className="inline-flex items-center gap-1 rounded-xl bg-fb-soft px-3 py-2 text-sm font-bold text-fb-deep">
            <ArrowLeftRight size={16} />
            Basculer vers secrétaire
          </button>
          <button type="button" onClick={clinic.logout} className="inline-flex items-center gap-1 rounded-xl bg-fb-bg px-3 py-2 text-sm font-bold">
            <LogOut size={16} />
            Sortir
          </button>
        </div>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                tab === item.id ? 'bg-fb text-white' : 'bg-white ring-1 ring-fb-line'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
      {tab === 'board' ? <Overview consults={consults} patients={patients} onOpen={() => setTab('agenda')} /> : null}
      {tab === 'agenda' ? (
        <Agenda
          consults={consults}
          patients={patients}
          onConsult={clinic.updateConsult}
          onAdd={clinic.addConsult}
          doctorId={clinic.doctorId || undefined}
          defaultFee={doctor?.fee}
          onOpenPatient={(patientId) => {
            setFocus(patientId);
            setTab('patients');
          }}
        />
      ) : null}
      {tab === 'patients' ? (
        <Patients
          patients={patients}
          consults={consults}
          onPatient={clinic.updatePatient}
          onAdd={clinic.addConsult}
          onCreate={clinic.addPatient}
          doctorId={clinic.doctorId || undefined}
          focusId={focus}
        />
      ) : null}
      {tab === 'billing' ? <Billing consults={consults} patients={patients} onConsult={clinic.updateConsult} /> : null}
      {tab === 'profil' && doctor ? (
        <>
          <ProfileForm doctor={doctor} onSave={(patch) => profiles.save(doctor.id, patch)} />
          <HoursEditor doctorId={doctor.id} />
        </>
      ) : null}
    </main>
  );
}
