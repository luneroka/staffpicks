import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import Link from 'next/link';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';

export default async function OnboardingPage() {
  // Check if user is authenticated
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <div className='container mx-auto max-w-2xl px-4'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold mb-2'>
          Bienvenue sur StaffPicks, {session.name} ! 🎉
        </h1>
        <p className='text-base-content/70'>
          Votre compte a été créé avec succès. Voici quelques étapes pour
          commencer.
        </p>
      </div>

      <div className='card bg-base-200 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title mb-4'>Commencer avec StaffPicks</h2>

          <ul className='space-y-4'>
            <li className='flex items-start gap-3'>
              <FaCircle className='mt-1 text-base-content/30 flex-shrink-0' />
              <div>
                <h3 className='font-semibold'>
                  Personnaliser votre entreprise
                </h3>
                <p className='text-sm text-base-content/70 mb-2'>
                  Ajoutez un logo et des informations supplémentaires sur votre
                  entreprise.
                </p>
                <Link
                  href='/dashboard/settings/company'
                  className='btn btn-sm btn-ghost'
                >
                  Accéder aux paramètres →
                </Link>
              </div>
            </li>

            <li className='flex items-start gap-3'>
              <FaCircle className='mt-1 text-base-content/30 flex-shrink-0' />
              <div>
                <h3 className='font-semibold'>Ajouter des livres</h3>
                <p className='text-sm text-base-content/70 mb-2'>
                  Commencez à construire votre catalogue de livres.
                </p>
                <Link
                  href='/dashboard/books/new'
                  className='btn btn-sm btn-ghost'
                >
                  Ajouter un livre →
                </Link>
              </div>
            </li>

            <li className='flex items-start gap-3'>
              <FaCircle className='mt-1 text-base-content/30 flex-shrink-0' />
              <div>
                <h3 className='font-semibold'>Créer votre première liste</h3>
                <p className='text-sm text-base-content/70 mb-2'>
                  Organisez vos livres en listes thématiques pour vos clients.
                </p>
                <Link
                  href='/dashboard/lists/new'
                  className='btn btn-sm btn-ghost'
                >
                  Créer une liste →
                </Link>
              </div>
            </li>

            <li className='flex items-start gap-3'>
              <FaCircle className='mt-1 text-base-content/30 flex-shrink-0' />
              <div>
                <h3 className='font-semibold'>Inviter des collaborateurs</h3>
                <p className='text-sm text-base-content/70 mb-2'>
                  Ajoutez des administrateurs de magasin et des libraires.
                </p>
                <Link
                  href='/dashboard/settings/users'
                  className='btn btn-sm btn-ghost'
                >
                  Gérer les utilisateurs →
                </Link>
              </div>
            </li>
          </ul>

          <div className='divider'></div>

          <div className='text-center'>
            <p className='text-sm text-base-content/70 mb-4'>
              Vous pouvez revenir à cette page à tout moment depuis vos
              réglages.
            </p>
            <Link href='/dashboard/settings' className='btn btn-primary'>
              Voir mes réglages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
