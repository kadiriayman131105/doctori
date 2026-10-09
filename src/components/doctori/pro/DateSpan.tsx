'use client';

export function nextDay(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function spanBounds(from: string, to: string) {
  if (!from && !to) return undefined;
  return { start: from || undefined, end: to ? nextDay(to) : undefined };
}

export function DateSpan({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  function apply(nextFrom: string, nextTo: string) {
    if (nextFrom && nextTo && nextFrom > nextTo) onChange(nextTo, nextFrom);
    else onChange(nextFrom, nextTo);
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <label className="text-xs font-bold uppercase tracking-wide text-fb-muted">
        Du
        <input
          type="date"
          value={from}
          onChange={(event) => apply(event.target.value, to)}
          className="mt-1 block h-11 rounded-xl border border-fb-line px-3 text-sm font-semibold normal-case"
        />
      </label>
      <label className="text-xs font-bold uppercase tracking-wide text-fb-muted">
        Au
        <input
          type="date"
          value={to}
          onChange={(event) => apply(from, event.target.value)}
          className="mt-1 block h-11 rounded-xl border border-fb-line px-3 text-sm font-semibold normal-case"
        />
      </label>
      {from || to ? (
        <button type="button" onClick={() => onChange('', '')} className="h-11 rounded-xl bg-fb-bg px-3 text-sm font-bold">
          Toute la période
        </button>
      ) : (
        <p className="pb-2 text-sm text-fb-muted">Choisissez une date de début et une date de fin.</p>
      )}
    </div>
  );
}
