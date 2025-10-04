import { requireAuth } from '@/app/lib/auth/helpers';
import { buildRoleBasedQuery } from '@/app/lib/auth/queryBuilders';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import BooksClient from './BooksClient';
import { Suspense } from 'react';
import { transformBookForDisplay } from '@/app/lib/utils/bookUtils';

const Books = async () => {
  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database
  await connectDB();

  // Build query based on user role
  const query = buildRoleBasedQuery(session);

  // Fetch books with role-based filtering
  const books = await BookModel.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('assignedTo', 'firstName lastName')
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
