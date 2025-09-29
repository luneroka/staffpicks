import BookDetails from '@/app/components/BookDetails';

interface BookPageProps {
  params: Promise<{
    bookId: string;
  }>;
}

const BookPage = async ({ params }: BookPageProps) => {
  const { bookId } = await params;

  return (
    <div>
      <BookDetails bookIsbn={bookId} />
    </div>
  );
};

export default BookPage;
