export function Bars({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex h-44 items-end gap-2">
      {points.map((point) => (
        <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
          <p className="text-center text-[10px] font-bold text-fb-muted">{point.value ? `${point.value}` : ''}</p>
          <div className="flex flex-1 items-end">
            <div
              className="w-full rounded-t-xl bg-fb"
              style={{ height: point.value ? `${Math.max(8, (point.value / max) * 100)}%` : '0%' }}
              title={`${point.label} : ${point.value} DH`}
            />
          </div>
          <p className="truncate text-center text-[10px] font-semibold text-fb-muted">{point.label}</p>
        </div>
      ))}
    </div>
  );
}

export function Donut({ paid, unpaid }: { paid: number; unpaid: number }) {
  const total = paid + unpaid;
  const angle = total ? (paid / total) * 360 : 0;
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{ background: `conic-gradient(#31A24C 0deg ${angle}deg, #E7F3FF ${angle}deg 360deg)` }}
        aria-hidden
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center">
          <span className="text-sm font-bold">{total ? Math.round((paid / total) * 100) : 0}%</span>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-bold text-fb-green">Encaissé · {paid} DH</p>
        <p className="font-bold text-fb">Reste · {unpaid} DH</p>
      </div>
    </div>
  );
}
