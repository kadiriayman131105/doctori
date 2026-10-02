'use client';

import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import type { ClinicPatient, Consult, VisitFlow } from '@/doctori/types';

const COLOR: Record<VisitFlow, string> = {
  a_venir: '#1877F2',
  en_cours: '#F7B928',
  termine: '#31A24C',
  absent: '#8A8D91',
  annule: '#CED0D4',
};

function plusMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

export function ClinicCalendar({
  consults,
  patients,
  editable,
  onMove,
  onSelect,
  onCreate,
}: {
  consults: Consult[];
  patients: ClinicPatient[];
  editable: boolean;
  onMove: (id: string, start: string) => void;
  onSelect: (id: string) => void;
  onCreate?: (start: string) => void;
}) {
  return (
    <div className="doctori-cal rounded-2xl bg-white p-3 ring-1 ring-fb-line">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={frLocale}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek' }}
        buttonText={{ today: 'Aujourd’hui', week: 'Semaine', day: 'Jour' }}
        slotMinTime="08:00:00"
        slotMaxTime="19:30:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        hiddenDays={[0]}
        nowIndicator
        height="auto"
        editable={editable}
        eventDurationEditable={false}
        events={consults
          .filter((item) => item.flow !== 'annule')
          .map((item) => {
            const patient = patients.find((entry) => entry.id === item.patientId);
            return {
              id: item.id,
              title: `${patient?.name ?? 'Patient'} · ${item.reason}`,
              start: item.start,
              end: plusMinutes(item.start, 30),
              backgroundColor: COLOR[item.flow],
              borderColor: COLOR[item.flow],
              textColor: item.flow === 'en_cours' ? '#050505' : '#ffffff',
            };
          })}
        eventClick={(info) => onSelect(info.event.id)}
        dateClick={onCreate ? (info) => onCreate(info.date.toISOString()) : undefined}
        eventDrop={(info) => {
          const start = info.event.start?.toISOString();
          const id = info.event.id;
          info.revert();
          if (start) onMove(id, start);
        }}
      />
    </div>
  );
}
