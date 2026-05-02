import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import AppWrapper from '@/components/AppWrapper';

export const metadata = {
  title: 'مكتب فريم الهندسي',
  description: 'نظام إدارة المكتب الهندسي',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'مكتب فريم',
  },
};

export const viewport = {
  themeColor: '#f2f2f7',
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body>
        <AuthProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
