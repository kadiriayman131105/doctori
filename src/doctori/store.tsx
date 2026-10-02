'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Booking, BookingStatus, VisitType } from './types';

const KEY = 'doctori-bookings-v1';

interface BookInput {
  doctorId: string;
  slotId: string;
  start: string;
  visitType: VisitType;
  patientName: string;
  phone: string;
  reason: string;
}

interface DoctoriState {
  ready: boolean;
  bookings: Booking[];
  book: (input: BookInput) => Booking;
  setStatus: (id: string, status: BookingStatus) => void;
  takenSlotIds: Set<string>;
}

const DoctoriContext = createContext<DoctoriState | null>(null);

export function DoctoriProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setBookings(JSON.parse(raw) as Booking[]);
    } catch {
      setBookings([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(bookings));
  }, [bookings, ready]);

  const value = useMemo<DoctoriState>(() => {
    const takenSlotIds = new Set(
      bookings.filter((item) => item.status !== 'annule').map((item) => item.slotId),
    );
    return {
      ready,
      bookings,
      takenSlotIds,
      book: (input) => {
        const booking: Booking = {
          ...input,
          id: `rdv-${Date.now()}`,
          status: 'confirme',
          createdAt: new Date().toISOString(),
        };
        setBookings((current) => [booking, ...current]);
        return booking;
      },
      setStatus: (id, status) => {
        setBookings((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      },
    };
  }, [bookings, ready]);

  return <DoctoriContext.Provider value={value}>{children}</DoctoriContext.Provider>;
}

export function useDoctori() {
  const context = useContext(DoctoriContext);
  if (!context) throw new Error('DoctoriProvider manquant');
  return context;
}

export function whatsAppLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('212') ? digits : digits.startsWith('0') ? `212${digits.slice(1)}` : `212${digits}`;
  return `https://wa.me/${local}?text=${encodeURIComponent(text)}`;
}

export function isMoroccanMobile(phone: string) {
  return /^(06|07)\d{8}$/.test(phone.replace(/\s/g, ''));
}
