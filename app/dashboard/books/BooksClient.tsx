'use client';

import Link from 'next/link';
import Book from '@/app/components/books/Book';
import BackButton from '@/app/components/BackButton';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getGenreLabel } from '@/app/lib/utils/bookUtils';
import { BookDisplay } from '@/app/lib/types';

interface BooksProps {
  initialBooks: BookDisplay[];
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

  // Group books based on user role
  const groupedBooks = () => {
    if (userRole === 'companyAdmin') {
      // Group by store
      const groups = new Map<
        string,
        { storeName: string; books: BookDisplay[] }
      >();

      initialBooks.forEach((book) => {
        const storeKey = book.storeId || 'no-store';
        const storeName = book.storeName || 'Sans magasin';

        if (!groups.has(storeKey)) {
          groups.set(storeKey, { storeName, books: [] });
        }
        groups.get(storeKey)!.books.push(book);
      });

      return Array.from(groups.values()).map((group) => ({
        title: group.storeName,
        books: group.books,
      }));
    } else if (userRole === 'storeAdmin') {
      // Group by assigned librarian (assignedTo)
      const groups = new Map<
        string,
        { librarianName: string; books: BookDisplay[] }
      >();

      initialBooks.forEach((book) => {
        // A book can be assigned to multiple librarians
        if (book.assignedTo && book.assignedTo.length > 0) {
          book.assignedTo.forEach((librarian) => {
            const librarianKey = librarian._id;
            const librarianName = `${librarian.firstName} ${librarian.lastName}`;

            if (!groups.has(librarianKey)) {
              groups.set(librarianKey, { librarianName, books: [] });
            }
            groups.get(librarianKey)!.books.push(book);
          });
        } else {
          // Books not assigned to anyone
          const unassignedKey = 'unassigned';
          const unassignedName = 'Non assigné';

          if (!groups.has(unassignedKey)) {
            groups.set(unassignedKey, {
              librarianName: unassignedName,
              books: [],
            });
          }
          groups.get(unassignedKey)!.books.push(book);
        }
      });

      return Array.from(groups.values()).map((group) => ({
        title: group.librarianName,
        books: group.books,
      }));
    } else if (userRole === 'librarian') {
      // Group by genre
      const groups = new Map<string, BookDisplay[]>();

      initialBooks.forEach((book) => {
        const genre = book.genre || 'sans-genre';

        if (!groups.has(genre)) {
          groups.set(genre, []);
        }
        groups.get(genre)!.push(book);
      });

      return Array.from(groups.entries()).map(([genre, books]) => ({
        title: getGenreLabel(genre) || 'Sans genre',
        books: books,
      }));
    }

    // Default: no grouping
    return [{ title: '', books: initialBooks }];
  };

  const bookGroups = groupedBooks();

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
            <div className='flex flex-col gap-12'>
              {bookGroups.map((group, index) => (
                <div key={index} className='flex flex-col gap-6'>
                  {group.title && (
                    <h2 className='text-2xl font-bold text-base-content'>
                      {group.title}
                    </h2>
                  )}
                  <div id='book-display' className='flex flex-wrap gap-8'>
                    {group.books.map((book: BookDisplay) => (
                      <Book
                        key={book.id}
                        coverUrl={book.cover}
                        id={book.id}
                        title={book.title}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BooksClient;
