import BookForm from '@/app/components/forms/BookForm';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';
import React from 'react';
import BackButton from '@/app/components/BackButton';

interface EditBookPageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditBookPage = async ({ params }: EditBookPageProps) => {
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
  }).lean();

  // If book not found, show 404
  if (!book) {
    notFound();
  }

  // Convert to plain object for BookForm
  const bookData = {
    id: book._id.toString(),
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
    // Include assignment fields
    assignedTo: book.assignedTo?.map((id: any) => id.toString()) || [],
    sections: book.sections || [],
  };

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <div className='flex items-start justify-center'>
        <BookForm
          bookId={id}
          initialData={bookData}
          userRole={session.role}
          storeId={session.storeId}
        />
      </div>
    </div>
  );
};

export default EditBookPage;
