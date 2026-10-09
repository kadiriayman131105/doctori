'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ToastItem {
  id: number;
  text: string;
  undo?: () => void;
}

interface ToastApi {
  show: (text: string, undo?: () => void) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback(
    (text: string, undo?: () => void) => {
      clearTimer();
      const id = ++seq.current;
      setItem({ id, text, undo });
      timer.current = setTimeout(() => {
        setItem((current) => (current?.id === id ? null : current));
      }, 2000);
    },
    [clearTimer],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {item ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 print:hidden">
          <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-fb-green px-4 py-3 text-sm font-bold text-white shadow-xl">
            <span>{item.text}</span>
            {item.undo ? (
              <button
                type="button"
                className="rounded-lg bg-white/20 px-2 py-1 text-xs font-bold"
                onClick={() => {
                  item.undo?.();
                  clearTimer();
                  setItem(null);
                }}
              >
                Annuler
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('ToastProvider manquant');
  return context;
}
