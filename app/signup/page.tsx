import SignupForm from '../components/auth/SignupForm';
import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth/helpers';

const Signup = async () => {
  // Check if user is already logged in
  const session = await getSession();

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
