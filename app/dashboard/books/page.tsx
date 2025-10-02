import Link from 'next/link';
import Book from '@/app/components/books/Book';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';

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

  // Fetch books for the user's company
  const books = await BookModel.find({
    companyId: new Types.ObjectId(session.companyId!),
  })
    .sort({ createdAt: -1 })
    .populate('ownerUserId', 'name email')
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
    <div className='flex flex-col gap-16'>
      <Link href={'/dashboard/books/new'}>
        <div className='btn btn-soft btn-primary w-fit'>Ajouter un livre</div>
      </Link>

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
  );
};

export default Books;
