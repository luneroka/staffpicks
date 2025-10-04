import Link from 'next/link';
import { HiExclamationCircle } from 'react-icons/hi';

export default function ListNotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-6'>
      <div className='alert alert-error w-fit shadow-lg'>
        <HiExclamationCircle className='h-6 w-6' />
        <div>
          <h3 className='font-bold'>Liste introuvable</h3>
          <div className='text-sm'>
            Cette liste n'existe pas ou n'est pas accessible.
          </div>
        </div>
      </div>

      <div className='flex gap-4'>
        <Link href='/dashboard/lists' className='btn btn-soft btn-primary'>
          Retour aux listes
        </Link>
        <Link href='/dashboard' className='btn btn-soft btn-secondary'>
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
