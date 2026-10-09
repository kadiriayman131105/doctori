import type { Consult, PrescriptionLine } from './types';

export type PatientDocKind = 'facture' | 'ordonnance' | 'certificat' | 'feuille';

export interface PatientDoc {
  id: string;
  consultId: string;
  start: string;
  kind: PatientDocKind;
  title: string;
  hint: string;
}

export function prescriptionText(consult: Consult) {
  const lines = (consult.prescriptionLines || []).filter((line) => line.medicine.trim());
  if (lines.length) return lines.map(lineHint).join(' · ');
  return consult.prescription?.trim() || '';
}

export function lineHint(line: PrescriptionLine) {
  return [line.medicine, line.dose, line.times, line.days].filter(Boolean).join(' · ');
}

export function patientDocsOf(consults: Consult[]): PatientDoc[] {
  const rows: PatientDoc[] = [];
  const ordered = [...consults]
    .filter((item) => item.flow !== 'annule')
    .sort((a, b) => +new Date(b.start) - +new Date(a.start));

  for (const consult of ordered) {
    const rx = prescriptionText(consult);
    if (rx) {
      rows.push({
        id: `${consult.id}-ordonnance`,
        consultId: consult.id,
        start: consult.start,
        kind: 'ordonnance',
        title: 'Ordonnance',
        hint: rx,
      });
    }
    if (consult.certificate?.trim()) {
      rows.push({
        id: `${consult.id}-certificat`,
        consultId: consult.id,
        start: consult.start,
        kind: 'certificat',
        title: 'Certificat médical',
        hint: consult.certificate.trim().slice(0, 90),
      });
    }
    if (consult.flow === 'termine' || consult.flow === 'en_cours') {
      rows.push({
        id: `${consult.id}-facture`,
        consultId: consult.id,
        start: consult.start,
        kind: 'facture',
        title: 'Facture',
        hint: `${Math.max(0, consult.listPrice - consult.discount)} DH · ${consult.reason}`,
      });
    }
  }
  return rows;
}
