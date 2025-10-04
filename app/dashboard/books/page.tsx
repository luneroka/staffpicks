import {
  isCompanyAdmin,
  isLibrarian,
  isStoreAdmin,
  requireAuth,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';
import BooksClient from './BooksClient';
import { Suspense } from 'react';
import { transformBookForDisplay } from '@/app/lib/utils/bookUtils';

const Books = async () => {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database
  await connectDB();

  // Build query based on user role
  let query: any = {
    companyId: new Types.ObjectId(session.companyId!),
  };

  if (isCompanyAdmin(session)) {
    // CompanyAdmin sees all books in the company
    // No additional filters needed
  } else if (isStoreAdmin(session)) {
    // StoreAdmin sees only books from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (isLibrarian(session)) {
    // Librarian sees only books they created or are assigned to
    query.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  // Fetch books with role-based filtering
  const books = await BookModel.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('storeId', 'name code')
    .lean();

  // Transform books using utility function
  const booksData = books.map(transformBookForDisplay);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BooksClient initialBooks={booksData} userRole={session.role} />
    </Suspense>
  );
};

export default Books;
