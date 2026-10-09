export const BACKUP_KEYS = [
  'doctori-pro-data-v1',
  'doctori-hours-v1',
  'doctori-waitlist-v1',
  'doctori-profiles-v1',
  'doctori-cash-close-v1',
] as const;

export const BACKUP_KIND = 'doctori-cabinet';

export interface CabinetBackupFile {
  kind: typeof BACKUP_KIND;
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

function parseStored(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export function collectBackup(): CabinetBackupFile {
  const data: Record<string, unknown> = {};
  for (const key of BACKUP_KEYS) {
    data[key] = parseStored(localStorage.getItem(key));
  }
  return {
    kind: BACKUP_KIND,
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  const payload = collectBackup();
  const day = payload.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `doctori-cabinet-${day}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function readBackup(text: string): CabinetBackupFile | null {
  try {
    const parsed = JSON.parse(text) as CabinetBackupFile;
    if (parsed?.kind !== BACKUP_KIND || parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function restoreBackup(file: CabinetBackupFile) {
  for (const key of BACKUP_KEYS) {
    const value = file.data[key];
    if (value == null) {
      localStorage.removeItem(key);
      continue;
    }
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
}
