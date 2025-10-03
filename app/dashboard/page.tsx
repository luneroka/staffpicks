import { IoIosArrowForward } from 'react-icons/io';
import List from '../components/lists/List';
import Book from '../components/books/Book';
import Link from 'next/link';
import { requireAuth } from '../lib/auth/helpers';
import connectDB from '../lib/mongodb';
import { BookModel } from '../lib/models/Book';
import { ListModel, ListVisibility } from '../lib/models/List';
import { StoreModel } from '../lib/models/Store';
import { UserModel, UserRole } from '../lib/models/User';
import { Types } from 'mongoose';
import { FaBook, FaList, FaStore, FaUsers } from 'react-icons/fa';

const Dashboard = async () => {
  // Ensure user is authenticated (will redirect if not)
  const session = await requireAuth();

  // Connect to database
  await connectDB();

  // CompanyAdmin sees statistics only
  if (session.role === UserRole.CompanyAdmin) {
    // Fetch statistics for the company
    const companyId = new Types.ObjectId(session.companyId!);

    const [totalBooks, totalLists, totalStores, totalUsers] = await Promise.all(
      [
        BookModel.countDocuments({ companyId }),
        ListModel.countDocuments({ companyId, deletedAt: { $exists: false } }),
        StoreModel.countDocuments({ companyId }),
        UserModel.countDocuments({ companyId }),
      ]
    );

    const publicLists = await ListModel.countDocuments({
      companyId,
      visibility: ListVisibility.Public,
      deletedAt: { $exists: false },
    });

    const draftLists = await ListModel.countDocuments({
      companyId,
      visibility: ListVisibility.Draft,
      deletedAt: { $exists: false },
    });

    return (
      <div className='space-y-8'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>Tableau de bord</h1>
          <p className='text-base-content/60'>
            Vue d&apos;ensemble des statistiques de votre entreprise
          </p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Total Stores */}
          <Link href='/dashboard/settings/stores'>
            <div className='card bg-primary/10 border border-primary/20'>
              <div className='card-body'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-base-content/60 text-sm'>
                      Total Magasins
                    </p>
                    <p className='text-3xl font-bold text-primary'>
                      {totalStores}
                    </p>
                  </div>
                  <FaStore className='text-4xl text-primary/40' />
                </div>
              </div>
            </div>
          </Link>

          {/* Total Users */}
          <Link href='/dashboard/settings/users'>
            <div className='card bg-secondary/10 border border-secondary/20'>
              <div className='card-body'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-base-content/60 text-sm'>
                      Total Utilisateurs
                    </p>
                    <p className='text-3xl font-bold text-secondary'>
                      {totalUsers}
                    </p>
                  </div>
                  <FaUsers className='text-4xl text-secondary/40' />
                </div>
              </div>
            </div>
          </Link>

          {/* Total Books */}
          <Link href='/dashboard/books'>
            <div className='card bg-accent/10 border border-accent/20'>
              <div className='card-body'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-base-content/60 text-sm'>Total Livres</p>
                    <p className='text-3xl font-bold text-accent'>
                      {totalBooks}
                    </p>
                  </div>
                  <FaBook className='text-4xl text-accent/40' />
                </div>
              </div>
            </div>
          </Link>

          {/* Total Lists */}
          <Link href='/dashboard/lists'>
            <div className='card bg-info/10 border border-info/20'>
              <div className='card-body'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-base-content/60 text-sm'>Total Listes</p>
                    <p className='text-3xl font-bold text-info'>{totalLists}</p>
                  </div>
                  <FaList className='text-4xl text-info/40' />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* List Status Breakdown */}
        <div className='card bg-base-200'>
          <div className='card-body'>
            <h2 className='card-title'>Statut des listes</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
              <div className='stat place-items-center'>
                <div className='stat-title'>Listes publiques</div>
                <div className='stat-value text-success'>{publicLists}</div>
              </div>
              <div className='stat place-items-center'>
                <div className='stat-title'>Brouillons</div>
                <div className='stat-value text-warning'>{draftLists}</div>
              </div>
              <div className='stat place-items-center'>
                <div className='stat-title'>Total</div>
                <div className='stat-value'>{totalLists}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info message */}
        <div className='alert alert-soft alert-info'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            className='stroke-current shrink-0 w-6 h-6'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            ></path>
          </svg>
          <div>
            <h3 className='font-bold'>Mode consultation</h3>
            <div className='text-sm'>
              En tant qu&apos;Admin Entreprise, vous avez accès aux statistiques
              et aux réglages. Pour créer ou modifier des livres et listes,
              utilisez un compte Admin Magasin ou Libraire.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For StoreAdmin and Librarian: show books and lists
  // Build query based on user role for books
  let booksQuery: any = {
    companyId: new Types.ObjectId(session.companyId!),
  };

  if (session.role === UserRole.StoreAdmin) {
    // StoreAdmin sees only books from their store
    booksQuery.storeId = new Types.ObjectId(session.storeId!);
  } else if (session.role === UserRole.Librarian) {
    // Librarian sees only books they created or are assigned to
    booksQuery.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  // Fetch books with role-based filtering
  const books = await BookModel.find(booksQuery)
    .sort({ createdAt: -1 })
    .limit(10) // Show only first 10 books on dashboard
    .lean();

  const booksData = books.map((book: any) => ({
    id: book._id.toString(),
    isbn: book.isbn,
    title: book.bookData.title,
    coverUrl: book.bookData.cover,
  }));

  // Build query based on user role for lists
  let listsQuery: any = {
    companyId: new Types.ObjectId(session.companyId!),
    visibility: 'public',
    deletedAt: { $exists: false },
  };

  if (session.role === UserRole.StoreAdmin) {
    // StoreAdmin sees only lists from their store
    listsQuery.storeId = new Types.ObjectId(session.storeId!);
  } else if (session.role === UserRole.Librarian) {
    // Librarian sees only lists they created or are assigned to
    listsQuery.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  // Fetch public lists with role-based filtering
  const lists = await ListModel.find(listsQuery)
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
