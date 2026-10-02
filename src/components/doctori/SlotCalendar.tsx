'use client';

import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import type { Slot } from '@/doctori/types';

function plusMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

export function SlotCalendar({
  slots,
  chosenId,
  onPick,
}: {
  slots: Slot[];
  chosenId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="doctori-cal">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={frLocale}
        headerToolbar={{ left: 'prev,next', center: 'title', right: 'timeGridDay,timeGridWeek' }}
        buttonText={{ week: 'Semaine', day: 'Jour' }}
        slotMinTime="08:30:00"
        slotMaxTime="19:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        hiddenDays={[0]}
        height="auto"
        events={slots.map((slot) => ({
          id: slot.id,
          title: slot.id === chosenId ? 'Créneau choisi' : 'Libre',
          start: slot.start,
          end: plusMinutes(slot.start, 30),
          backgroundColor: slot.id === chosenId ? '#1877F2' : '#E7F3FF',
          borderColor: slot.id === chosenId ? '#1877F2' : '#B9D6FB',
          textColor: slot.id === chosenId ? '#ffffff' : '#0C4DA2',
        }))}
        eventClick={(info) => onPick(info.event.id)}
      />
    </div>
  );
}
