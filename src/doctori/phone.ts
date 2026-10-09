export function whatsAppLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('212') ? digits : digits.startsWith('0') ? `212${digits.slice(1)}` : `212${digits}`;
  return `https://wa.me/${local}?text=${encodeURIComponent(text)}`;
}

export function isMoroccanMobile(phone: string) {
  return /^(06|07)\d{8}$/.test(phone.replace(/\s/g, ''));
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function phoneKey(value: string) {
  const digits = phoneDigits(value);
  if (digits.startsWith('212')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function findByPhone<T extends { id: string; phone: string }>(patients: T[], phone: string, ignoreId?: string) {
  const key = phoneKey(phone);
  if (key.length < 8) return undefined;
  return patients.find((patient) => patient.id !== ignoreId && phoneKey(patient.phone) === key);
}

export function matchesPatient(
  patient: { name: string; phone: string; conditions?: string; notes?: string },
  needle: string,
) {
  const raw = needle.trim().toLowerCase();
  if (!raw) return true;
  const digits = phoneDigits(raw);
  const phone = phoneDigits(patient.phone);
  if (digits.length >= 2 && phone.includes(digits)) return true;
  return `${patient.name} ${patient.phone} ${patient.conditions ?? ''} ${patient.notes ?? ''}`.toLowerCase().includes(raw);
}
