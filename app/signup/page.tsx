import SignupForm from '../components/auth/SignupForm';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import { redirect } from 'next/navigation';

const Signup = async () => {
  // Check if user is already logged in
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  // Redirect to dashboard if already authenticated
  if (session.isLoggedIn) {
    redirect('/dashboard');
  }

  return (
    <div className='mt-[-32px] flex items-start justify-center p-4 md:p-8'>
      <SignupForm />
    </div>
  );
};

export default Signup;
