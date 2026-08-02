import './styles.css';
import './public-v2.css';
import AppServiceWorker from './components/app-service-worker';

export const viewport = {
  themeColor: '#961010',
  colorScheme: 'light',
};

export const metadata = {
  metadataBase: new URL('https://www.damecoffeeco.com'),
  title: {
    default: 'Dame Coffee | Crafted with Heart',
    template: '%s | Dame Coffee',
  },
  description:
    'Dame Coffee serves intentional cold brew, matcha, and food from a mobile cart rooted in Mexican culture and community.',
  openGraph: {
    title: 'Dame Coffee | Crafted with Heart',
    description: 'Coffee made with intention, culture, unity, and love.',
    url: 'https://www.damecoffeeco.com',
    siteName: 'Dame Coffee',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dame Coffee | Crafted with Heart',
    description: 'Coffee made with intention, culture, unity, and love.',
  },
  applicationName: 'Dame Coffee',
  appleWebApp: {
    capable: true,
    title: 'Dame Coffee',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/dame-icon',
    apple: '/dame-icon',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AppServiceWorker />
      </body>
    </html>
  );
}
