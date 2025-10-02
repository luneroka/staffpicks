import BookDetails from '@/app/components/books/BookDetails';
import { requireAuth } from '@/app/lib/auth/helpers';
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

  // Fetch the book by ID and company
  const book = await BookModel.findOne({
    _id: new Types.ObjectId(id),
    companyId: new Types.ObjectId(session.companyId!),
  })
    .populate('ownerUserId', 'name email')
    .populate('createdBy', 'name email')
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
          name: (book.ownerUserId as any).name,
          email: (book.ownerUserId as any).email,
        }
      : undefined,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };

  return (
    <div>
      <BookDetails book={bookData} />
    </div>
  );
};

export default BookPage;
