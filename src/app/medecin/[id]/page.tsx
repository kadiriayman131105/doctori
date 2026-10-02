import { Suspense } from 'react';
import Fiche from './Fiche';

export default function MedecinPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-center text-fb-muted">Chargement de la fiche…</p>}>
      <Fiche />
    </Suspense>
  );
}
