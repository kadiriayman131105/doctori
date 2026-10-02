'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VisitType } from '@/doctori/types';

const SLIDES: {
  src: string;
  alt: string;
  kicker: string;
  title: string;
  text: string;
  type: VisitType | '';
  cta: string;
}[] = [
  {
    src: '/services/cabinet.jpg',
    alt: 'Cabinet médical lumineux à Casablanca',
    kicker: 'Au cabinet',
    title: 'Le bon médecin, dans votre quartier',
    text: 'Généraliste, dentiste, orthodontiste, orthopédiste : le tarif et le prochain créneau sont visibles avant de réserver.',
    type: 'cabinet',
    cta: 'Voir les cabinets',
  },
  {
    src: '/services/video.jpg',
    alt: 'Médecin en consultation vidéo',
    kicker: 'En vidéo',
    title: 'Une consultation, où que vous soyez',
    text: 'Le soir, sans trajet. Utile pour un avis, un renouvellement ou un enfant qui ne peut pas se déplacer.',
    type: 'video',
    cta: 'Voir la vidéo',
  },
  {
    src: '/services/domicile.jpg',
    alt: 'Médecin en visite à domicile',
    kicker: 'À domicile',
    title: 'Le médecin vient jusqu’à vous',
    text: 'Pour les patients qui ne peuvent pas sortir. Vous indiquez l’adresse, le cabinet confirme le passage.',
    type: 'domicile',
    cta: 'Voir les visites',
  },
  {
    src: '/services/rappel.jpg',
    alt: 'Téléphone avec une confirmation de rendez-vous',
    kicker: 'Rappel WhatsApp',
    title: 'Confirmé, puis rappelé',
    text: 'Le message part sur le téléphone du patient. S’il y a du retard, le secrétariat prévient en un geste.',
    type: '',
    cta: 'Trouver un médecin',
  },
];

export function ServiceCarousel() {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  function go(next: number) {
    const el = scroller.current;
    const count = SLIDES.length;
    const safe = (next + count) % count;
    setIndex(safe);
    if (el) el.scrollTo({ left: safe * el.clientWidth, behavior: 'smooth' });
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const timer = window.setInterval(() => {
      if (paused.current) return;
      setIndex((current) => {
        const next = (current + 1) % SLIDES.length;
        const el = scroller.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
        return next;
      });
    }, 5600);
    return () => window.clearInterval(timer);
  }, []);

  function onScroll() {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function openSlide(type: VisitType | '') {
    window.dispatchEvent(new CustomEvent('doctori-filter', { detail: { type } }));
  }

  return (
    <section
      className="mx-auto max-w-6xl px-4 pt-5"
      aria-roledescription="carrousel"
      aria-label="Services Doctori"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
      onFocusCapture={() => {
        paused.current = true;
      }}
      onBlurCapture={() => {
        paused.current = false;
      }}
    >
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-3xl"
        >
          {SLIDES.map((slide, slideIndex) => (
            <article key={slide.src} className="relative h-[320px] w-full shrink-0 snap-start sm:h-[420px]" aria-hidden={slideIndex !== index}>
              <img src={slide.src} alt={slide.alt} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041833]/90 via-[#041833]/55 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:max-w-xl sm:justify-center sm:p-10">
                <p className="text-sm font-semibold text-white/80">{slide.kicker}</p>
                <h2 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-4xl">{slide.title}</h2>
                <p className="mt-2 text-sm text-white/85 sm:text-base">{slide.text}</p>
                <button
                  type="button"
                  onClick={() => openSlide(slide.type)}
                  className="mt-4 h-11 w-fit rounded-full bg-white px-5 text-sm font-bold text-fb-deep"
                >
                  {slide.cta}
                </button>
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          aria-label="Service précédent"
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-fb-ink shadow sm:grid"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Service suivant"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-fb-ink shadow sm:grid"
        >
          <ChevronRight size={20} />
        </button>
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {SLIDES.map((slide, dot) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Afficher : ${slide.kicker}`}
              aria-current={dot === index}
              onClick={() => go(dot)}
              className={`h-2 rounded-full transition-all ${dot === index ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
