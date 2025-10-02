import Link from 'next/link';
import { FaLock } from 'react-icons/fa';

export default function UnauthorizedPage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] px-4'>
      <div className='text-center'>
        <FaLock className='text-6xl text-error mx-auto mb-6' />
        <h1 className='text-4xl font-bold mb-4'>Accès non autorisé</h1>
        <p className='text-lg text-base-content/70 mb-8 max-w-md'>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className='flex gap-4 justify-center'>
          <Link href='/dashboard' className='btn btn-primary'>
            Retour au tableau de bord
          </Link>
          <Link href='/login' className='btn btn-ghost'>
            Se reconnecter
          </Link>
        </div>
      </div>
    </div>
  );
}
