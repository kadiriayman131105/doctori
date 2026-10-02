'use client';

import { FormEvent, useState } from 'react';
import type { Doctor, Insurance, VisitType } from '@/doctori/types';
import { VISIT_LABEL } from '@/doctori/data';
import { initials } from '@/components/doctori/DoctorCard';
import { ConfirmDialog } from './ConfirmDialog';

const INSURANCES: Insurance[] = ['CNSS', 'CNOPS', 'Mutuelle'];
const VISITS: VisitType[] = ['cabinet', 'video', 'domicile'];

export function ProfileForm({ doctor, onSave }: { doctor: Doctor; onSave: (patch: Partial<Doctor>) => void }) {
  const [photo, setPhoto] = useState(doctor.photo || '');
  const [saved, setSaved] = useState('');
  const [pending, setPending] = useState<Partial<Doctor> | null>(null);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > 700_000) {
      setSaved('Photo trop lourde. Choisissez une image de moins de 700 Ko.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const insurance = INSURANCES.filter((item) => data.get(`ins-${item}`) === 'on');
    const visitTypes = VISITS.filter((item) => data.get(`visit-${item}`) === 'on');
    setPending({
      name: String(data.get('name') || doctor.name).trim(),
      specialty: String(data.get('specialty') || doctor.specialty).trim(),
      diploma: String(data.get('diploma') || '').trim(),
      experience: Math.max(0, Number(data.get('experience')) || 0),
      bio: String(data.get('bio') || '').trim(),
      fee: Math.max(0, Number(data.get('fee')) || 0),
      neighborhood: String(data.get('neighborhood') || '').trim(),
      address: String(data.get('address') || '').trim(),
      languages: String(data.get('languages') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      brings: String(data.get('brings') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      insurance: insurance.length ? insurance : doctor.insurance,
      visitTypes: visitTypes.length ? visitTypes : doctor.visitTypes,
      photo,
    });
  }

  return (
    <>
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-fb-line lg:grid-cols-[180px_1fr]">
      <div>
        <div className="grid h-36 w-36 place-items-center overflow-hidden rounded-full bg-fb text-3xl font-bold text-white">
          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials(doctor.name)}
        </div>
        <label className="mt-3 block text-sm font-bold">
          Photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onPhoto(event.target.files?.[0])}
            className="mt-1 block w-full text-sm"
          />
        </label>
        {photo ? (
          <button type="button" onClick={() => setPhoto('')} className="mt-2 text-sm font-bold text-red-600">
            Retirer la photo
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Nom affiché
          <input name="name" defaultValue={doctor.name} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold">
          Spécialité
          <input name="specialty" defaultValue={doctor.specialty} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Diplôme
          <input name="diploma" defaultValue={doctor.diploma || ''} placeholder="Doctorat en médecine, Université Hassan II" className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold">
          Années d’expérience
          <input name="experience" type="number" min={0} defaultValue={doctor.experience} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold">
          Prix de consultation (DH)
          <input name="fee" type="number" min={0} defaultValue={doctor.fee} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold">
          Quartier
          <input name="neighborhood" defaultValue={doctor.neighborhood} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold">
          Adresse
          <input name="address" defaultValue={doctor.address} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Description
          <textarea name="bio" defaultValue={doctor.bio} rows={4} className="mt-1 w-full rounded-xl border border-fb-line px-3 py-2 font-medium" />
        </label>
        <label className="text-sm font-bold">
          Langues, séparées par une virgule
          <input name="languages" defaultValue={doctor.languages.join(', ')} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <label className="text-sm font-bold">
          À apporter, séparé par une virgule
          <input name="brings" defaultValue={doctor.brings.join(', ')} className="mt-1 h-11 w-full rounded-xl border border-fb-line px-3 font-semibold" />
        </label>
        <fieldset className="text-sm font-bold">
          <legend>Prise en charge</legend>
          <div className="mt-2 flex flex-wrap gap-2 font-semibold">
            {INSURANCES.map((item) => (
              <label key={item} className="inline-flex items-center gap-1 rounded-full bg-fb-bg px-3 py-1.5">
                <input type="checkbox" name={`ins-${item}`} defaultChecked={doctor.insurance.includes(item)} />
                {item}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="text-sm font-bold">
          <legend>Modes de visite</legend>
          <div className="mt-2 flex flex-wrap gap-2 font-semibold">
            {VISITS.map((item) => (
              <label key={item} className="inline-flex items-center gap-1 rounded-full bg-fb-bg px-3 py-1.5">
                <input type="checkbox" name={`visit-${item}`} defaultChecked={doctor.visitTypes.includes(item)} />
                {VISIT_LABEL[item]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <button type="submit" className="h-11 rounded-xl bg-fb px-5 font-bold text-white">
            Enregistrer mon profil
          </button>
          {saved ? <p className="mt-2 text-sm font-bold text-fb-green">{saved}</p> : null}
        </div>
      </div>
    </form>
    <ConfirmDialog
      open={Boolean(pending)}
      tone="edit"
      title="Voulez-vous vraiment modifier ?"
      text="Votre photo, diplôme, description et prix seront visibles sur votre carte."
      confirmLabel="Oui, modifier"
      onCancel={() => setPending(null)}
      onConfirm={() => {
        if (pending) onSave(pending);
        setPending(null);
        setSaved('Profil enregistré. Il apparaît sur votre carte et votre fiche.');
      }}
    />
    </>
  );
}
