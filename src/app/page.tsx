import { ServiceCarousel } from '@/components/doctori/ServiceCarousel';
import { Finder } from '@/components/doctori/Finder';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main>
      <ServiceCarousel />
      <Finder />
    </main>
  );
}
