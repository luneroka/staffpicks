import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  // Redirect to login if not authenticated
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  return <>{children}</>;
}
