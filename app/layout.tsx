import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import NavBar from './components/NavBar';
import { MdDarkMode } from 'react-icons/md';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';

const roboto = Roboto({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Staffpicks',
  description:
    'Mobile web app for Fnac customers to access seller book recommendations via QR code, with an admin dashboard for staff management.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get session data for NavBar
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  return (
    <html lang='en' data-theme='light'>
      <body className={roboto.className}>
        {/* Floating Dark Mode Button */}
        <button
          data-toggle-theme='dim,light'
          data-act-class='ACTIVECLASS'
          className='fixed bottom-5 right-5 z-50 bg-base-300 hover:bg-primary-content p-3 rounded-full shadow-lg transition-colors cursor-pointer'
        >
          <MdDarkMode className='size-6' />
        </button>

        {/* Laout Content */}
        <div className='flex flex-col h-screen max-h-screen'>
          <NavBar
            companyName={session.companyName}
            userName={session.name}
            userRole={session.role}
          />
          <div className='px-16 py-8'>{children}</div>
        </div>
      </body>
    </html>
  );
}
