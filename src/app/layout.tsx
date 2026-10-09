import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClinicProvider } from '@/doctori/clinic-store';
import { HoursProvider } from '@/doctori/hours-store';
import { WaitProvider } from '@/doctori/waitlist-store';
import { ProfileProvider } from '@/doctori/profiles';
import { Footer } from '@/components/doctori/Chrome';
import { ToastProvider } from '@/components/doctori/pro/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Doctori — Cabinet médical',
  description: 'Logiciel de cabinet : agenda, patients, factures et documents. Connexion du médecin ou du secrétariat.',
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
        <ClinicProvider>
          <ProfileProvider>
            <HoursProvider>
              <WaitProvider>
                <ToastProvider>
                  <div className="min-h-screen bg-fb-bg text-fb-ink">
                    {children}
                    <Footer />
                  </div>
                </ToastProvider>
              </WaitProvider>
            </HoursProvider>
          </ProfileProvider>
        </ClinicProvider>
      </body>
    </html>
  );
}
