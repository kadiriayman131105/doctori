'use client';

import { useEffect, useState } from 'react';
import { useToast } from './Toast';

export function GuardedNumber({
  label,
  value,
  min = 0,
  max,
  className,
  ariaLabel,
  onCommit,
}: {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  className: string;
  ariaLabel?: string;
  onCommit: (next: number) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    let parsed = Math.max(min, Number(draft) || 0);
    if (max != null) parsed = Math.min(max, parsed);
    if (parsed === value) {
      setDraft(String(value));
      return;
    }
    const previous = value;
    onCommit(parsed);
    toast.show('Enregistré', () => onCommit(previous));
  }

  const field = (
    <input
      type="number"
      min={min}
      max={max}
      aria-label={ariaLabel ?? label}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      className={className}
    />
  );

  if (!label) return field;
  return (
    <label className="text-xs font-bold text-fb-muted">
      {label}
      {field}
    </label>
  );
}
