import BookForm from '@/app/components/forms/BookForm';
import React from 'react';

interface EditBookPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

const EditBookPage = async ({ params }: EditBookPageProps) => {
  const { bookId } = await params;

  return (
    <div className='mt-[-32px] flex items-start justify-center p-4 md:p-8'>
      <BookForm bookIsbn={bookId} />
    </div>
  );
};

export default EditBookPage;
