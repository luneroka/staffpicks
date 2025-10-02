import BookForm from '@/app/components/forms/BookForm';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';
import React from 'react';

interface EditBookPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

const EditBookPage = async ({ params }: EditBookPageProps) => {
  const { bookId } = await params;

  // Ensure user is authenticated
  const session = await requireAuth();

  // Connect to database
  await connectDB();

  // Fetch the book by ISBN and company
  const book = await BookModel.findOne({
    isbn: bookId,
    companyId: new Types.ObjectId(session.companyId!),
  }).lean();

  // If book not found, show 404
  if (!book) {
    notFound();
  }

  // Convert to plain object for BookForm
  const bookData = {
    isbn: book.isbn,
    title: book.bookData.title,
    authors: book.bookData.authors.join(', '),
    publisher: book.bookData.publisher || '',
    publishedDate: book.bookData.publishDate
      ? new Date(book.bookData.publishDate).toISOString().split('T')[0]
      : '',
    description: book.bookData.description || '',
    coverImage: book.bookData.cover || '',
    pageCount: book.bookData.pageCount?.toString() || '',
    genre: book.genre || '',
    tone: book.tone || '',
    ageGroup: book.ageGroup || '',
    purchaseLink: book.purchaseLink || '',
    recommendation: book.recommendation || '',
  };

  return (
    <div className='mt-[-32px] flex items-start justify-center p-4 md:p-8'>
      <BookForm bookIsbn={bookId} initialData={bookData} />
    </div>
  );
};

export default EditBookPage;
