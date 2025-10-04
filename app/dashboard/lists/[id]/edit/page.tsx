import ListForm from '@/app/components/forms/ListForm';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';
import BackButton from '@/app/components/BackButton';

interface EditListPageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditListPage = async ({ params }: EditListPageProps) => {
  const { id } = await params;

  // Ensure user is authenticated
  const session = await requireAuth();

  // Validate ObjectId format
  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  // Connect to database
  await connectDB();

  // Fetch the list by ID and company
  const list = await ListModel.findOne({
    _id: new Types.ObjectId(id),
    companyId: new Types.ObjectId(session.companyId!),
    deletedAt: { $exists: false },
  })
    .populate({
      path: 'items.bookId',
      select: 'isbn bookData genre tone ageGroup',
    })
    .lean();

  // If list not found, show 404
  if (!list) {
    notFound();
  }

  // Convert to plain object for ListForm
  const listData = {
    id: list._id.toString(),
    title: list.title,
    slug: list.slug,
    description: list.description || '',
    coverImage: list.coverImage || '',
    visibility: list.visibility as 'draft' | 'unlisted' | 'public',
    publishAt: list.publishAt
      ? new Date(list.publishAt).toISOString().split('T')[0]
      : '',
    items: list.items.map((item: any) => ({
      bookId: item.bookId._id.toString(),
      isbn: item.bookId.isbn,
      title: item.bookId.bookData.title,
      authors: item.bookId.bookData.authors,
      cover: item.bookId.bookData.cover,
      genre: item.bookId.genre,
      tone: item.bookId.tone,
      ageGroup: item.bookId.ageGroup,
      position: item.position,
    })),
    // Include assignment fields
    assignedTo: list.assignedTo?.map((id: any) => id.toString()) || [],
    sections: list.sections || [],
  };

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <div className='flex items-start justify-center'>
        <ListForm
          id={id}
          initialData={listData}
          userRole={session.role}
          storeId={session.storeId}
        />
      </div>{' '}
    </div>
  );
};

export default EditListPage;
