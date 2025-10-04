import BookDetails from '@/app/components/books/BookDetails';
import BackButton from '@/app/components/BackButton';
import {
  isCompanyAdmin,
  isLibrarian,
  isStoreAdmin,
  requireAuth,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';

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
  let query: any = {
    _id: new Types.ObjectId(id),
    companyId: new Types.ObjectId(session.companyId!),
  };

  if (isCompanyAdmin(session)) {
    // CompanyAdmin can see all books in the company
    // No additional filters needed
  } else if (isStoreAdmin(session)) {
    // StoreAdmin can only see books from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (isLibrarian(session)) {
    // Librarian can only see books they created or are assigned to
    query.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

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

  // Convert to plain object
  const bookData = {
    id: book._id.toString(),
    isbn: book.isbn,
    title: book.bookData.title,
    authors: book.bookData.authors,
    cover: book.bookData.cover,
    description: book.bookData.description,
    publisher: book.bookData.publisher,
    pageCount: book.bookData.pageCount,
    publishDate: book.bookData.publishDate,
    genre: book.genre,
    tone: book.tone,
    ageGroup: book.ageGroup,
    purchaseLink: book.purchaseLink,
    recommendation: book.recommendation,
    owner: book.ownerUserId
      ? {
          _id: book.ownerUserId._id.toString(),
          name: `${book.ownerUserId.firstName} ${book.ownerUserId.lastName}`,
          email: book.ownerUserId.email,
        }
      : undefined,
    createdBy: book.createdBy
      ? {
          _id: book.createdBy._id.toString(),
          name: `${book.createdBy.firstName} ${book.createdBy.lastName}`,
          email: book.createdBy.email,
        }
      : undefined,
    storeId: book.storeId?._id?.toString(),
    storeName: book.storeId?.name,
    assignedTo: (book.assignedTo || []).map((id: any) => id.toString()),
    sections: book.sections || [],
    createdAt: book.createdAt?.toISOString(),
    updatedAt: book.updatedAt?.toISOString(),
  };

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <BookDetails book={bookData} userRole={session.role} />
    </div>
  );
};

export default BookPage;
