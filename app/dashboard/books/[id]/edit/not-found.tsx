import Link from 'next/link';
import { HiExclamationCircle } from 'react-icons/hi';

export default function EditBookNotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-6'>
      <div className='alert alert-error w-fit shadow-lg'>
        <HiExclamationCircle className='h-6 w-6' />
        <div>
          <h3 className='font-bold'>Livre introuvable</h3>
          <div className='text-sm'>
            Ce livre n'existe pas ou ne peut pas être modifié.
          </div>
        </div>
      </div>

      <div className='flex gap-4'>
        <Link href='/dashboard/books' className='btn btn-soft btn-primary'>
          Retour aux livres
        </Link>
        <Link href='/dashboard' className='btn btn-soft btn-secondary'>
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
