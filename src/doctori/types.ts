export type VisitType = 'cabinet' | 'video' | 'domicile';

export type Insurance = 'CNSS' | 'CNOPS' | 'Mutuelle';

export type BookingStatus = 'confirme' | 'annule' | 'arrive' | 'absent';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  neighborhood: string;
  address: string;
  fee: number;
  rating: number;
  reviewCount: number;
  languages: string[];
  insurance: Insurance[];
  visitTypes: VisitType[];
  experience: number;
  bio: string;
  brings: string[];
  diploma?: string;
  photo?: string;
}

export interface Slot {
  id: string;
  doctorId: string;
  start: string;
  visitType: VisitType;
}

export interface Booking {
  id: string;
  doctorId: string;
  slotId: string;
  start: string;
  visitType: VisitType;
  patientName: string;
  phone: string;
  reason: string;
  status: BookingStatus;
  createdAt: string;
}

export type Sex = 'F' | 'M';

export type VisitFlow = 'a_venir' | 'arrive' | 'en_cours' | 'termine' | 'absent' | 'annule';

export type PayState = 'paye' | 'impaye' | 'partiel';

export type PayMethod = 'especes' | 'carte';

export interface PrescriptionLine {
  medicine: string;
  dose: string;
  times: string;
  days: string;
}

export interface ClinicPatient {
  id: string;
  doctorId: string;
  name: string;
  phone: string;
  age: number;
  sex: Sex;
  insurance: string;
  conditions: string;
  allergies: string;
  notes: string;
}

export interface Consult {
  id: string;
  doctorId: string;
  patientId: string;
  start: string;
  visitType: VisitType;
  reason: string;
  flow: VisitFlow;
  listPrice: number;
  discount: number;
  paid: number;
  note: string;
  bookingId?: string;
  remindedEve?: boolean;
  remindedSoon?: boolean;
  prescription?: string;
  prescriptionLines?: PrescriptionLine[];
  certificate?: string;
  tension?: string;
  weight?: string;
  temperature?: string;
  payMethod?: PayMethod;
}
