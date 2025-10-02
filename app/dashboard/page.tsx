import { IoIosArrowForward } from 'react-icons/io';
import List from '../components/lists/List';
import Book from '../components/books/Book';
import Link from 'next/link';
import { requireAuth } from '../lib/auth/helpers';
import connectDB from '../lib/mongodb';
import { BookModel } from '../lib/models/Book';
import { ListModel } from '../lib/models/List';
import { Types } from 'mongoose';

const Dashboard = async () => {
  // Ensure user is authenticated (will redirect if not)
  const session = await requireAuth();

  // Connect to database
  await connectDB();

  // Fetch books
  const books = await BookModel.find({
    companyId: new Types.ObjectId(session.companyId!),
  })
    .sort({ createdAt: -1 })
    .limit(10) // Show only first 10 books on dashboard
    .lean();

  const booksData = books.map((book: any) => ({
    id: book._id.toString(),
    isbn: book.isbn,
    title: book.bookData.title,
    coverUrl: book.bookData.cover,
  }));

  // Fetch public lists
  const lists = await ListModel.find({
    companyId: new Types.ObjectId(session.companyId!),
    visibility: 'public',
    deletedAt: { $exists: false },
  })
    .sort({ updatedAt: -1 })
    .limit(10) // Show only first 10 lists on dashboard
    .lean();

  const listsData = lists.map((list: any) => ({
    id: list._id.toString(),
    title: list.title,
    slug: list.slug,
    description: list.description,
    coverUrl:
      list.coverImage ||
      'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075480/rentr%C3%A9e_litt%C3%A9raire_ac1clu.png',
  }));

  return (
    <div className='flex flex-col gap-16'>
      {/* LISTS SECTION */}
      <div className='flex flex-col gap-8'>
        <div className='flex gap-2 items-center'>
          <Link href='/dashboard/lists' className='group'>
            <div className='flex gap-2 items-center'>
              <h2 className='h2-light group-hover:underline'>
                Mes listes publiques
              </h2>
              <IoIosArrowForward />
            </div>
          </Link>
        </div>

        {/* Lists filtered to show only public ones */}
        <div className='carousel rounded-box space-x-8'>
          {listsData.length === 0 ? (
            <p className='text-base-content/60'>Aucune liste publique</p>
          ) : (
            listsData.map((list: any) => (
              <div key={list.id} className='carousel-item'>
                <List
                  id={list.id}
                  coverUrl={list.coverUrl}
                  title={list.title}
                  description={list.description}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOOKS SECTION */}
      <div className='flex flex-col gap-8'>
        <div className='flex gap-2 items-center'>
          <Link href='/dashboard/books' className='group'>
            <div className='flex gap-2 items-center'>
              <h2 className='h2-light group-hover:underline'>
                Mes livres par genre
              </h2>
              <IoIosArrowForward />
            </div>
          </Link>
        </div>

        {/* Books mapped dynamically from JSON data */}
        <div id='book-display' className='flex flex-wrap gap-8'>
          {booksData.length === 0 ? (
            <p className='text-base-content/60'>
              Aucun livre dans votre bibliothèque
            </p>
          ) : (
            booksData.map((book: any) => (
              <Book
                key={book.id}
                coverUrl={book.coverUrl}
                id={book.id}
                title={book.title}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
