import ListDetails from '@/app/components/lists/ListDetails';
import { requireAuth } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';

interface ListPageProps {
  params: Promise<{
    id: string;
  }>;
}

const ListPage = async ({ params }: ListPageProps) => {
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
    .populate('ownerUserId', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .lean();

  // If list not found, show 404
  if (!list) {
    notFound();
  }

  // Convert to plain object for ListDetails
  const listData = {
    id: list._id.toString(),
    title: list.title,
    slug: list.slug,
    description: list.description,
    coverImage:
      list.coverImage ||
      'https://res.cloudinary.com/dhxckc6ld/image/upload/v1759075480/rentr%C3%A9e_litt%C3%A9raire_ac1clu.png',
    visibility: list.visibility,
    publishAt: list.publishAt,
    unpublishAt: list.unpublishAt,
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
      addedAt: item.addedAt,
    })),
    owner: list.ownerUserId
      ? {
          _id: list.ownerUserId._id.toString(),
          name: `${list.ownerUserId.firstName} ${list.ownerUserId.lastName}`,
          email: list.ownerUserId.email,
        }
      : undefined,
    createdBy: list.createdBy
      ? {
          _id: list.createdBy._id.toString(),
          name: `${list.createdBy.firstName} ${list.createdBy.lastName}`,
          email: list.createdBy.email,
        }
      : undefined,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };

  return (
    <div>
      <ListDetails list={listData} />
    </div>
  );
};

export default ListPage;
