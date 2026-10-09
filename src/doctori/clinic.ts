import type { ClinicPatient, Consult, PayState, VisitType } from './types';
import { DOCTORS } from './data';

function doctorMail(id: string) {
  if (id === 'amal-bennani') return 'amal@doctori.ma';
  if (id === 'youssef-el-idrissi') return 'youssef@doctori.ma';
  return `${id}@doctori.ma`;
}

function secretaryMail(id: string) {
  if (id === 'amal-bennani') return 'secretaire@doctori.ma';
  return `sec.${id}@doctori.ma`;
}

export const ACCOUNTS = [
  ...DOCTORS.map((doctor) => ({
    email: doctorMail(doctor.id),
    password: 'doctori',
    role: 'medecin' as const,
    doctorId: doctor.id,
    label: doctor.name,
  })),
  ...DOCTORS.map((doctor) => ({
    email: secretaryMail(doctor.id),
    password: 'doctori',
    role: 'secretaire' as const,
    doctorId: doctor.id,
    label: `Secrétariat · ${doctor.name}`,
  })),
];

export const FLOW_LABEL = {
  a_venir: 'À venir',
  arrive: 'Arrivé',
  en_cours: 'En consultation',
  termine: 'Terminé',
  absent: 'Absent',
  annule: 'Annulé',
} as const;

export const PAY_LABEL: Record<PayState, string> = {
  paye: 'Payé',
  impaye: 'Impayé',
  partiel: 'Partiel',
};

export function dueAmount(consult: Pick<Consult, 'listPrice' | 'discount'>) {
  return Math.max(0, consult.listPrice - Math.max(0, consult.discount));
}

export function payState(consult: Pick<Consult, 'listPrice' | 'discount' | 'paid'>): PayState {
  const due = dueAmount(consult);
  if (consult.paid <= 0) return 'impaye';
  if (consult.paid >= due) return 'paye';
  return 'partiel';
}

export function billed(consult: Consult) {
  return consult.flow === 'termine' || consult.flow === 'en_cours';
}

function at(offset: number, hours: number, minutes: number) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setDate(date.getDate() + offset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function patient(
  id: string,
  doctorId: string,
  name: string,
  phone: string,
  age: number,
  sex: ClinicPatient['sex'],
  insurance: string,
  conditions: string,
  allergies: string,
  notes: string,
): ClinicPatient {
  return { id, doctorId, name, phone, age, sex, insurance, conditions, allergies, notes };
}

function visit(
  id: string,
  doctorId: string,
  patientId: string,
  offset: number,
  hours: number,
  minutes: number,
  visitType: VisitType,
  reason: string,
  flow: Consult['flow'],
  listPrice: number,
  discount: number,
  paid: number,
  note: string,
): Consult {
  return {
    id,
    doctorId,
    patientId,
    start: at(offset, hours, minutes),
    visitType,
    reason,
    flow,
    listPrice,
    discount,
    paid,
    note,
  };
}

export function buildClinic() {
  const patients: ClinicPatient[] = [
    patient('p-fz', 'amal-bennani', 'Fatima Zahra Alaoui', '0661122334', 34, 'F', 'CNSS', 'Hypertension', 'Pénicilline', 'Contrôle tensionnel tous les 3 mois. Préfère les créneaux du matin.'),
    patient('p-ma', 'amal-bennani', 'Mohamed Alaoui', '0661987654', 58, 'M', 'CNOPS', 'Diabète type 2', 'Aucune', 'HbA1c à refaire. Marche 30 minutes par jour.'),
    patient('p-kn', 'amal-bennani', 'Khadija Naciri', '0677001122', 41, 'F', 'Mutuelle', 'Asthme', 'Aspirine', 'Crises au printemps. Ventoline à renouveler.'),
    patient('p-yb', 'amal-bennani', 'Yassine Bennis', '0661456789', 27, 'M', 'Aucune', 'Aucune', 'Aucune', 'Première visite. Certificat de sport demandé.'),
    patient('p-si', 'amal-bennani', 'Salma Idrissi', '0661333444', 8, 'F', 'CNSS', 'Otites à répétition', 'Aucune', 'Vient avec sa mère. Carnet de santé à jour.'),
    patient('p-hc', 'amal-bennani', 'Hassan Chraibi', '0661777888', 67, 'M', 'CNOPS', 'Diabète, hypertension', 'Iode', 'Vit à domicile la dernière fois. Fils joignable.'),
    patient('p-ns', 'amal-bennani', 'Nadia Squalli', '0677121212', 29, 'F', 'CNSS', 'Migraine', 'Aucune', 'Crises liées au sommeil. Éviter le jeûne prolongé.'),
    patient('p-ab', 'amal-bennani', 'Adam Berrada', '0661909090', 45, 'M', 'Mutuelle', 'Lombalgie', 'Aucune', 'Travail assis. Renforcer le suivi kiné.'),
    patient('p-lt', 'youssef-el-idrissi', 'Laila Tazi', '0661555666', 62, 'F', 'CNSS', 'Hypertension, angor stable', 'Aucune', 'ECG de contrôle prévu. Traitement inchangé.'),
    patient('p-kb', 'youssef-el-idrissi', 'Karim Bennani', '0661444555', 51, 'M', 'Mutuelle', 'Cholestérol', 'Aucune', 'Bilan lipidique en baisse. Continuer la marche.'),
    patient('p-sb', 'youssef-el-idrissi', 'Sara Bennis', '0677666777', 44, 'F', 'CNOPS', 'Palpitations', 'Aucune', 'Holter à lire. Café après 16h déconseillé.'),
    patient('p-oe', 'youssef-el-idrissi', 'Omar El Fassi', '0661222111', 70, 'M', 'CNSS', 'Insuffisance cardiaque légère', 'AINS', 'Poids stable. Surveillance des œdèmes.'),
  ];

  const consults: Consult[] = [
    visit('c1', 'amal-bennani', 'p-fz', 0, 9, 30, 'cabinet', 'Contrôle tension', 'termine', 200, 0, 200, 'TA 13/8. Traitement maintenu.'),
    visit('c2', 'amal-bennani', 'p-ma', 0, 10, 0, 'cabinet', 'Diabète', 'en_cours', 200, 0, 0, 'Glycémie à jeun en salle.'),
    visit('c3', 'amal-bennani', 'p-kn', 0, 11, 30, 'cabinet', 'Renouvellement', 'a_venir', 200, 0, 0, ''),
    visit('c4', 'amal-bennani', 'p-yb', 0, 16, 0, 'cabinet', 'Certificat', 'a_venir', 200, 50, 0, 'Remise jeune actif déjà posée.'),
    visit('c5', 'amal-bennani', 'p-si', -1, 15, 0, 'cabinet', 'Fièvre', 'termine', 200, 50, 150, 'Angine virale. Conseil parental.'),
    visit('c6', 'amal-bennani', 'p-hc', -2, 11, 0, 'domicile', 'Suivi à domicile', 'termine', 250, 0, 0, 'Passage fait. Règlement en attente.'),
    visit('c7', 'amal-bennani', 'p-ns', -3, 17, 0, 'video', 'Migraine', 'termine', 200, 0, 100, 'Acompte reçu, reste 100 DH.'),
    visit('c8', 'amal-bennani', 'p-ab', -5, 16, 30, 'cabinet', 'Dos', 'absent', 200, 0, 0, 'Non prévenu.'),
    visit('c9', 'amal-bennani', 'p-fz', -6, 9, 0, 'cabinet', 'Contrôle', 'termine', 200, 0, 200, 'Bonne tolérance.'),
    visit('c10', 'amal-bennani', 'p-ma', 1, 10, 30, 'cabinet', 'Résultats', 'a_venir', 200, 0, 0, ''),
    visit('c11', 'amal-bennani', 'p-hc', -1, 9, 0, 'cabinet', 'Ordonnance', 'annule', 200, 0, 0, 'Annulé par la famille.'),
    visit('c12', 'amal-bennani', 'p-kn', -4, 18, 0, 'video', 'Toux', 'termine', 200, 0, 200, 'Pas de surinfection.'),
    visit('y1', 'youssef-el-idrissi', 'p-lt', 0, 9, 0, 'cabinet', 'Contrôle HTA', 'termine', 400, 0, 400, 'TA équilibrée.'),
    visit('y2', 'youssef-el-idrissi', 'p-kb', 0, 10, 30, 'cabinet', 'Bilan lipidique', 'en_cours', 400, 0, 0, ''),
    visit('y3', 'youssef-el-idrissi', 'p-sb', 0, 15, 0, 'cabinet', 'Palpitations', 'a_venir', 400, 0, 0, ''),
    visit('y4', 'youssef-el-idrissi', 'p-oe', -1, 11, 0, 'cabinet', 'Suivi cardiaque', 'termine', 400, 50, 350, 'Remise patient suivi.'),
    visit('y5', 'youssef-el-idrissi', 'p-lt', -3, 9, 30, 'cabinet', 'ECG', 'termine', 400, 0, 0, 'ECG fait, règlement oublié.'),
    visit('y6', 'youssef-el-idrissi', 'p-kb', -6, 16, 0, 'cabinet', 'Contrôle', 'termine', 400, 0, 400, ''),
    visit('y7', 'youssef-el-idrissi', 'p-oe', 2, 11, 30, 'cabinet', 'Contrôle poids', 'a_venir', 400, 0, 0, ''),
    visit('y8', 'youssef-el-idrissi', 'p-sb', -2, 15, 30, 'video', 'Résultats holter', 'absent', 400, 0, 0, ''),
  ];

  return { patients, consults };
}
