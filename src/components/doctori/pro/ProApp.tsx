'use client';

import { useEffect, useState } from 'react';
import { BureauNav } from './BureauNav';
import { useClinic } from '@/doctori/clinic-store';
import { useProfiles } from '@/doctori/profiles';
import { Agenda } from './Agenda';
import { Documents } from './Documents';
import { Billing } from './Billing';
import { Overview } from './Overview';
import { Patients } from './Patients';
import { AbsenceBar, HoursEditor } from './HoursEditor';
import { CabinetBackup } from './CabinetBackup';
import { ProfileForm } from './ProfileForm';
import { SecretaryDesk } from './SecretaryDesk';

type Tab = 'board' | 'agenda' | 'patients' | 'billing' | 'documents' | 'profil';

const DOCTOR_MENUS = [
  {
    label: 'Cabinet',
    items: [
      { id: 'board', label: 'Tableau de bord' },
      { id: 'agenda', label: 'Rendez-vous' },
      { id: 'patients', label: 'Patients' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { id: 'billing', label: 'Facturation' },
      { id: 'documents', label: 'Document' },
    ],
  },
];

export function ProApp() {
  const clinic = useClinic();
  const profiles = useProfiles();
  const [tab, setTab] = useState<Tab>('board');
  const [focus, setFocus] = useState<string | null>(null);
  const [docPatient, setDocPatient] = useState<string | null>(null);
  const [docConsult, setDocConsult] = useState<string | null>(null);
  const [docKind, setDocKind] = useState<'facture' | 'ordonnance' | 'certificat' | 'feuille' | null>(null);

  function openDocument(patientId: string, consultId?: string, kind?: 'facture' | 'feuille' | 'ordonnance' | 'certificat') {
    setDocPatient(patientId);
    setDocConsult(consultId || null);
    setDocKind(kind ?? 'facture');
    setTab('documents');
  }

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

  if (!clinic.ready || !clinic.role) return <p className="px-4 py-16 text-center text-fb-muted">Ouverture du cabinet…</p>;

  if (clinic.role === 'secretaire') {
    const doctorId = clinic.doctorId || 'amal-bennani';
    const ownConsults = clinic.consults.filter((item) => item.doctorId === doctorId);
    const seen = new Set(ownConsults.map((item) => item.patientId));
    const ownPatients = clinic.patients.filter((item) => item.doctorId === doctorId || seen.has(item.id));
    return (
      <SecretaryDesk
        doctorId={doctorId}
        doctorName={profiles.doctor(doctorId)?.name || 'Médecin'}
        patients={ownPatients}
        consults={ownConsults}
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
  const consults = clinic.consults.filter((item) => item.doctorId === clinic.doctorId);
  const seen = new Set(consults.map((item) => item.patientId));
  const patients = clinic.patients.filter((item) => item.doctorId === clinic.doctorId || seen.has(item.id));

  return (
    <>
      <BureauNav
        who={doctor?.name || 'Médecin'}
        groups={DOCTOR_MENUS}
        active={tab}
        onSelect={(id) => setTab(id as Tab)}
        switchLabel="Secrétariat"
        onSwitch={clinic.switchView}
        onLogout={clinic.logout}
        onProfile={() => setTab('profil')}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
      {tab === 'board' ? <Overview consults={consults} patients={patients} onOpen={() => setTab('agenda')} onConsult={clinic.updateConsult} onOpenPatient={(patientId) => { setFocus(patientId); setTab('patients'); }} /> : null}
      {tab === 'agenda' ? (
        <>
        <AbsenceBar doctorId={clinic.doctorId || doctor?.id || 'amal-bennani'} />
        <Agenda
          consults={consults}
          allConsults={consults}
          patients={patients}
          onConsult={clinic.updateConsult}
          onAdd={clinic.addConsult}
          doctorId={clinic.doctorId || undefined}
          defaultFee={doctor?.fee}
          onOpenPatient={(patientId) => {
            setFocus(patientId);
            setTab('patients');
          }}
          onOpenDocument={openDocument}
        />
        </>
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
          onDocument={(patientId, consultId, kind) => openDocument(patientId, consultId, kind)}
        />
      ) : null}
      {tab === 'documents' ? (
        <Documents
          patients={patients}
          consults={consults}
          patientId={docPatient}
          consultId={docConsult}
          startKind={docKind}
          onSave={clinic.updateConsult}
        />
      ) : null}
      {tab === 'billing' ? (
        <Billing consults={consults} patients={patients} onConsult={clinic.updateConsult} onOpenDocument={openDocument} />
      ) : null}
      {tab === 'profil' && doctor ? (
        <>
          <div className="space-y-4">
            <ProfileForm doctor={doctor} onSave={(patch) => profiles.save(doctor.id, patch)} />
            <HoursEditor doctorId={doctor.id} />
            <CabinetBackup />
          </div>
        </>
      ) : null}
    </main>
    </>
  );
}
