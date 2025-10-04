import BookDetails from '@/app/components/books/BookDetails';
import BackButton from '@/app/components/BackButton';
import { requireAuth } from '@/app/lib/auth/helpers';
import { buildRoleBasedQuery } from '@/app/lib/auth/queryBuilders';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';
import { transformBookForClient } from '@/app/lib/utils/bookUtils';

interface BookPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BookPage = async ({ params }: BookPageProps) => {
  const { id } = await params;

  // Ensure user is authenticated
  const session = await requireAuth();

  // Validate ObjectId format
  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  // Connect to database
  await connectDB();

  // Build query based on user role
  const query = buildRoleBasedQuery(session, {
    _id: new Types.ObjectId(id),
  });

  // Fetch the book with role-based filtering
  const book = await BookModel.findOne(query)
    .populate('ownerUserId', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('storeId', 'name code')
    .lean();

  // If book not found, show 404
  if (!book) {
    notFound();
  }

  // Transform book using utility function
  const bookData = transformBookForClient(book);

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <BookDetails book={bookData} userRole={session.role} />
    </div>
  );
};

export default BookPage;
