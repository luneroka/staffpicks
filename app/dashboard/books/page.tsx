import Link from 'next/link';
import Book from '@/app/components/books/Book';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import BackButton from '@/app/components/BackButton';

interface BookData {
  id: string;
  isbn: string;
  title: string;
  cover: string;
  authors: string[];
}

const Books = async () => {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database
  await connectDB();

  // Build query based on user role
  let query: any = {
    companyId: new Types.ObjectId(session.companyId!),
  };

  if (session.role === UserRole.CompanyAdmin) {
    // CompanyAdmin sees all books in the company
    // No additional filters needed
  } else if (session.role === UserRole.StoreAdmin) {
    // StoreAdmin sees only books from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (session.role === UserRole.Librarian) {
    // Librarian sees only books they created or are assigned to
    query.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  // Fetch books with role-based filtering
  const books = await BookModel.find(query)
    .sort({ createdAt: -1 })
    .populate('ownerUserId', 'name email')
    .populate('storeId', 'name code')
    .lean();

  // Convert MongoDB documents to plain objects
  const booksData = books.map((book: any) => ({
    id: book._id.toString(),
    isbn: book.isbn,
    title: book.bookData.title,
    cover: book.bookData.cover,
    authors: book.bookData.authors,
  }));

  return (
    <>
      {session.role === UserRole.CompanyAdmin && (
        <BackButton className='mb-8' />
      )}
      <div className='flex flex-col gap-12'>
        {/* Hide "Add Book" button for CompanyAdmin */}
        {session.role !== UserRole.CompanyAdmin && (
          <Link href={'/dashboard/books/new'}>
            <div className='btn btn-soft btn-primary w-fit'>
              Ajouter un livre
            </div>
          </Link>
        )}

        <div className='flex flex-col gap-8'>
          {booksData.length === 0 ? (
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
              {booksData.map((book: BookData) => (
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

export default Books;
