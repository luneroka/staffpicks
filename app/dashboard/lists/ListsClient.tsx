'use client';

import Link from 'next/link';
import ListCard from '@/app/components/lists/ListCard';
import BackButton from '@/app/components/BackButton';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ListCard as ListCardType } from '@/app/lib/types';

interface ListsProps {
  initialLists: ListCardType[];
  userRole: string;
}

const ListsClient = ({ initialLists, userRole }: ListsProps) => {
  const searchParams = useSearchParams();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    const addedListTitle = searchParams.get('added');

    if (addedListTitle && !hasShownToast) {
      toast.success(`Liste "${addedListTitle}" ajoutée avec succès`, {
        duration: 4000,
      });
      setHasShownToast(true);

      // Clean URL without reloading
      window.history.replaceState({}, '', '/dashboard/lists');
    }
  }, [searchParams, hasShownToast]);

  return (
    <>
      {userRole === 'companyAdmin' && <BackButton className='mb-8' />}
      <div className='flex flex-col gap-12'>
        {/* Hide "Add List" button for CompanyAdmin */}
        {userRole !== 'companyAdmin' && (
          <Link href={'/dashboard/lists/new'}>
            <div className='btn btn-primary btn-soft w-fit'>
              Ajouter une liste
            </div>
          </Link>
        )}

        <div id='list-display' className='flex flex-wrap gap-8'>
          {initialLists.length === 0 ? (
            <p className='text-base-content/60'>Aucune liste créée</p>
          ) : (
            initialLists.map((list: ListCardType) => (
              <ListCard key={list._id} listData={list} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ListsClient;
