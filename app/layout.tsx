import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import NavBar from './components/NavBar';
import { MdDarkMode } from 'react-icons/md';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import connectDB from '@/app/lib/mongodb';
import { StoreModel } from '@/app/lib/models/Store';
import { Types } from 'mongoose';

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

  // Fetch store information for storeAdmin and librarians
  let storeInfo = null;
  if (session.isLoggedIn && session.storeId) {
    try {
      await connectDB();
      const store = await StoreModel.findById(
        new Types.ObjectId(session.storeId)
      )
        .select('name address')
        .lean();

      if (store) {
        storeInfo = {
          name: store.name,
          city: store.address?.city,
        };
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  }

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
            userName={session.firstName}
            userRole={session.role}
            storeName={storeInfo?.name}
            storeCity={storeInfo?.city}
          />
          <div className='px-16 pt-8 pb-16'>{children}</div>
        </div>
      </body>
    </html>
  );
}
