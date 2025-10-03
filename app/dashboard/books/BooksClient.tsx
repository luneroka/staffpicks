'use client';

import Link from 'next/link';
import Book from '@/app/components/books/Book';
import BackButton from '@/app/components/BackButton';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface BookData {
  id: string;
  isbn: string;
  title: string;
  cover: string;
  authors: string[];
}

interface BooksProps {
  initialBooks: BookData[];
  userRole: string;
}

const BooksClient = ({ initialBooks, userRole }: BooksProps) => {
  const searchParams = useSearchParams();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    const addedBookTitle = searchParams.get('added');

    if (addedBookTitle && !hasShownToast) {
      toast.success(`Livre "${addedBookTitle}" ajouté avec succès`, {
        duration: 4000,
      });
      setHasShownToast(true);

      // Clean URL without reloading
      window.history.replaceState({}, '', '/dashboard/books');
    }
  }, [searchParams, hasShownToast]);

  return (
    <>
      {userRole === 'companyAdmin' && <BackButton className='mb-8' />}
      <div className='flex flex-col gap-12'>
        {/* Hide "Add Book" button for CompanyAdmin */}
        {userRole !== 'companyAdmin' && (
          <Link href={'/dashboard/books/new'}>
            <div className='btn btn-soft btn-primary w-fit'>
              Ajouter un livre
            </div>
          </Link>
        )}

        <div className='flex flex-col gap-8'>
          {initialBooks.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-lg text-base-content/60'>
                Aucun livre dans votre bibliothèque
              </p>
              <p className='text-sm text-base-content/40 mt-2'>
                Cliquez sur "Ajouter un livre" pour commencer
              </p>
            </div>
          ) : (
            <div id='book-display' className='flex flex-wrap gap-8'>
              {initialBooks.map((book: BookData) => (
                <Book
                  key={book.id}
                  coverUrl={book.cover}
                  id={book.id}
                  title={book.title}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BooksClient;
