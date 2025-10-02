import { IoIosArrowForward } from 'react-icons/io';
import List from '../components/lists/List';
import Book from '../components/books/Book';
import booksData from '../lib/mock/books.json';
import listsData from '../lib/mock/lists.json';
import {
  extractBookProps,
  extractListProps,
  getPublishedLists,
} from '../lib/utils';
import Link from 'next/link';
import { requireAuth } from '../lib/auth/helpers';

const Dashboard = async () => {
  // Ensure user is authenticated (will redirect if not)
  const session = await requireAuth();

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
          {getPublishedLists(listsData).map((list) => (
            <div key={list._id} className='carousel-item'>
              <List {...extractListProps(list)} />
            </div>
          ))}
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
          {booksData.map((book) => (
            <Book key={book._id} {...extractBookProps(book)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
