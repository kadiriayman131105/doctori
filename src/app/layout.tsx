import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClinicProvider } from '@/doctori/clinic-store';
import { HoursProvider } from '@/doctori/hours-store';
import { ProfileProvider } from '@/doctori/profiles';
import { DoctoriProvider } from '@/doctori/store';
import { Footer, Header } from '@/components/doctori/Chrome';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Doctori — Rendez-vous médicaux à Casablanca',
  description:
    'Trouvez un médecin à Casablanca par nom ou spécialité. Tarif affiché, prochain créneau visible, confirmation WhatsApp.',
  applicationName: 'Doctori',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Doctori',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1877F2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        <DoctoriProvider>
          <ClinicProvider>
            <ProfileProvider>
              <HoursProvider>
                <div className="min-h-screen bg-fb-bg text-fb-ink">
                  <Header />
                  {children}
                  <Footer />
                </div>
              </HoursProvider>
            </ProfileProvider>
          </ClinicProvider>
        </DoctoriProvider>
      </body>
    </html>
  );
}
