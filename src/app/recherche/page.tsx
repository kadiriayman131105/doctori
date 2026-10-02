import { redirect } from 'next/navigation';

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value) {
      query.set(key === 'q' ? 'specialite' : key, value);
    }
  }
  const suffix = query.toString();
  redirect(suffix ? `/?${suffix}#annuaire` : '/#annuaire');
}
