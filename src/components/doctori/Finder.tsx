'use client';

import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Baby,
  Bone,
  Brain,
  Check,
  ChevronDown,
  Ear,
  Eye,
  HeartPulse,
  MapPin,
  Search,
  Smile,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NEIGHBORHOODS, SPECIALTIES, VISIT_LABEL } from '@/doctori/data';
import { useProfiles } from '@/doctori/profiles';
import { useClinic } from '@/doctori/clinic-store';
import { useHours } from '@/doctori/hours-store';
import { isSameDay, nextSlot } from '@/doctori/slots';
import type { Insurance, VisitType } from '@/doctori/types';
import { DoctorCard } from './DoctorCard';

const TILES: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Généraliste', value: 'Médecin généraliste', icon: Stethoscope },
  { label: 'Dentiste', value: 'Dentiste', icon: Smile },
  { label: 'Orthodontiste', value: 'Orthodontiste', icon: Sparkles },
  { label: 'Orthopédiste', value: 'Orthopédiste', icon: Bone },
  { label: 'Pédiatre', value: 'Pédiatre', icon: Baby },
  { label: 'Gynécologue', value: 'Gynécologue', icon: HeartPulse },
  { label: 'Dermatologue', value: 'Dermatologue', icon: Sparkles },
  { label: 'Ophtalmologue', value: 'Ophtalmologue', icon: Eye },
  { label: 'Cardiologue', value: 'Cardiologue', icon: HeartPulse },
  { label: 'Psychologue', value: 'Psychologue', icon: Brain },
  { label: 'ORL', value: 'ORL', icon: Ear },
];

const INSURANCES: Insurance[] = ['CNSS', 'CNOPS', 'Mutuelle'];

function fold(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function specialtyMatches(specialty: string, query: string) {
  if (!query.trim()) return true;
  const spec = fold(specialty);
  const q = fold(query);
  return spec.includes(q) || q.includes(spec);
}

function Combo({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = options.filter((option) => fold(option).includes(fold(value)));
  const shown = matches.length ? matches : value ? [] : [...options];

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  function choose(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div ref={root} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fb-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActive((current) => Math.min(current + 1, Math.max(shown.length - 1, 0)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter' && open && shown[active]) {
              event.preventDefault();
              choose(shown[active]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          className="h-12 w-full rounded-2xl border border-fb-line bg-fb-bg px-4 pr-16 text-sm font-semibold outline-none ring-fb focus:bg-white focus:ring-2"
        />
        {value ? (
          <button
            type="button"
            aria-label={`Effacer ${label}`}
            onClick={() => onChange('')}
            className="absolute right-9 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-fb-muted hover:bg-white"
          >
            <X size={14} />
          </button>
        ) : null}
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fb-muted" />
      </div>
      {open ? (
        <ul id={listId} role="listbox" className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-fb-line bg-white p-1 shadow-xl">
          {shown.length === 0 ? <li className="px-3 py-2 text-sm text-fb-muted">Aucun résultat</li> : null}
          {shown.map((option, optionIndex) => (
            <li key={option} role="option" aria-selected={value === option}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                  optionIndex === active || value === option ? 'bg-fb-soft text-fb-deep' : 'hover:bg-fb-bg'
                }`}
              >
                {option}
                {value === option ? <Check size={14} /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FinderBody() {
  const params = useSearchParams();
  const router = useRouter();
  const { doctors } = useProfiles();
  const hours = useHours();
  const clinic = useClinic();
  const [nom, setNom] = useState(params.get('nom') || '');
  const [specialite, setSpecialite] = useState(params.get('specialite') || params.get('q') || '');
  const [quartier, setQuartier] = useState(params.get('quartier') || '');
  const [visit, setVisit] = useState<VisitType | ''>((params.get('type') as VisitType) || '');
  const [assurance, setAssurance] = useState<Insurance | ''>((params.get('assurance') as Insurance) || '');
  const [today, setToday] = useState(params.get('dispo') === 'aujourdhui');
  const [tri, setTri] = useState(params.get('tri') || 'prochain');

  useEffect(() => {
    function onFilter(event: Event) {
      const detail = (event as CustomEvent<{ type?: VisitType | '' }>).detail;
      if (detail?.type !== undefined) setVisit(detail.type);
      document.getElementById('annuaire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.addEventListener('doctori-filter', onFilter);
    return () => window.removeEventListener('doctori-filter', onFilter);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams();
      if (nom.trim()) next.set('nom', nom.trim());
      if (specialite.trim()) next.set('specialite', specialite.trim());
      if (quartier) next.set('quartier', quartier);
      if (visit) next.set('type', visit);
      if (assurance) next.set('assurance', assurance);
      if (today) next.set('dispo', 'aujourdhui');
      if (tri !== 'prochain') next.set('tri', tri);
      const qs = next.toString();
      if (qs === window.location.search.replace(/^\?/, '')) return;
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [nom, specialite, quartier, visit, assurance, today, tri, router]);

  const results = useMemo(() => {
    return doctors.filter((doctor) => {
      if (nom.trim() && !fold(doctor.name).includes(fold(nom))) return false;
      if (!specialtyMatches(doctor.specialty, specialite)) return false;
      if (quartier && doctor.neighborhood !== quartier) return false;
      if (visit && !doctor.visitTypes.includes(visit)) return false;
      if (assurance && !doctor.insurance.includes(assurance)) return false;
      if (today) {
        const slot = nextSlot(doctor.id, visit || undefined, {
          week: hours.week(doctor.id),
          closed: hours.closed(doctor.id),
          busyStarts: clinic.consults
            .filter((item) => item.doctorId === doctor.id && item.flow !== 'annule' && item.flow !== 'absent')
            .map((item) => item.start),
        });
        if (!slot || !isSameDay(slot.start)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (tri === 'tarif') return a.fee - b.fee;
      if (tri === 'avis') return b.rating - a.rating || b.reviewCount - a.reviewCount;
      const aTime = nextSlot(a.id, visit || undefined, {
        week: hours.week(a.id),
        closed: hours.closed(a.id),
      })?.start ?? '9';
      const bTime = nextSlot(b.id, visit || undefined, {
        week: hours.week(b.id),
        closed: hours.closed(b.id),
      })?.start ?? '9';
      return aTime.localeCompare(bTime);
    });
  }, [clinic.consults, doctors, hours, nom, specialite, quartier, visit, assurance, today, tri]);

  const activeFilters = [nom, specialite, quartier, visit, assurance, today ? '1' : ''].filter(Boolean).length;

  function reset() {
    setNom('');
    setSpecialite('');
    setQuartier('');
    setVisit('');
    setAssurance('');
    setToday(false);
    setTri('prochain');
  }

  return (
    <section id="annuaire" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8">
      <div className="rounded-[28px] border border-white bg-white p-4 shadow-[0_20px_50px_-28px_rgba(24,119,242,0.55)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-fb">Annuaire de Casablanca</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Cherchez par nom ou par spécialité</h1>
          </div>
          {activeFilters ? (
            <button type="button" onClick={reset} className="text-sm font-bold text-fb">
              Effacer les filtres
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div>
            <label htmlFor="nom-medecin" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fb-muted">
              Nom du médecin
            </label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fb-muted" />
              <input
                id="nom-medecin"
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                placeholder="Ex. Bennani, Tazi…"
                className="h-12 w-full rounded-2xl border border-fb-line bg-fb-bg pl-10 pr-4 text-sm font-semibold outline-none ring-fb focus:bg-white focus:ring-2"
              />
            </div>
          </div>
          <Combo
            label="Spécialité"
            placeholder="Généraliste, dentiste, ortho…"
            value={specialite}
            options={SPECIALTIES}
            onChange={setSpecialite}
          />
          <Combo
            label="Quartier"
            placeholder="Maarif, Anfa, Racine…"
            value={quartier}
            options={NEIGHBORHOODS}
            onChange={setQuartier}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-fb-bg p-1" role="radiogroup" aria-label="Mode de visite">
            {(['', 'cabinet', 'video', 'domicile'] as const).map((item) => (
              <button
                key={item || 'tous'}
                type="button"
                role="radio"
                aria-checked={visit === item}
                onClick={() => setVisit(item)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                  visit === item ? 'bg-fb text-white shadow' : 'text-fb-ink'
                }`}
              >
                {item ? VISIT_LABEL[item] : 'Tous'}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={today}
            onClick={() => setToday((current) => !current)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              today ? 'bg-fb-green text-white' : 'bg-fb-bg text-fb-ink'
            }`}
          >
            Disponible aujourd’hui
          </button>
          {INSURANCES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={assurance === item}
              onClick={() => setAssurance((current) => (current === item ? '' : item))}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                assurance === item ? 'bg-fb text-white' : 'bg-fb-bg text-fb-ink'
              }`}
            >
              {item}
            </button>
          ))}
          <div className="ml-auto flex rounded-full bg-fb-bg p-1" role="radiogroup" aria-label="Trier les médecins">
            {(
              [
                ['prochain', 'Prochain créneau'],
                ['tarif', 'Tarif'],
                ['avis', 'Avis'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={tri === value}
                onClick={() => setTri(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ${tri === value ? 'bg-white text-fb shadow' : 'text-fb-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {TILES.map((tile) => {
            const selected = fold(specialite) === fold(tile.value) || fold(specialite) === fold(tile.label);
            const Icon = tile.icon;
            return (
              <button
                key={tile.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setSpecialite(selected ? '' : tile.value)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-bold transition ${
                  selected ? 'border-fb bg-fb text-white' : 'border-fb-line bg-white hover:-translate-y-0.5 hover:border-fb hover:shadow'
                }`}
              >
                <Icon size={16} className={selected ? 'text-white' : 'text-fb'} />
                {tile.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <MapPin size={16} className="text-fb" />
        <p className="font-bold">
          {results.length} médecin{results.length > 1 ? 's' : ''} à Casablanca
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-4 rounded-[28px] bg-white px-6 py-14 text-center">
          <p className="text-lg font-bold">Aucun médecin ne correspond</p>
          <p className="mt-1 text-sm text-fb-muted">Essayez « ortho », « dentiste » ou un nom de famille.</p>
          <button type="button" onClick={reset} className="mt-4 rounded-full bg-fb px-4 py-2 text-sm font-bold text-white">
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {results.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} visitType={visit || undefined} />
          ))}
        </div>
      )}
    </section>
  );
}

export function Finder() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-fb-muted">Chargement de l’annuaire…</p>}>
      <FinderBody />
    </Suspense>
  );
}
