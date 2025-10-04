import { requireAuth } from '../lib/auth/helpers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and ensure user has userId
  await requireAuth();

  return <>{children}</>;
}
