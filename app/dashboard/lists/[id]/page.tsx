import ListDetails from '@/app/components/lists/ListDetails';
import {
  isCompanyAdmin,
  isLibrarian,
  isStoreAdmin,
  requireAuth,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';
import BackButton from '@/app/components/BackButton';

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

  // Build query based on user role
  let query: any = {
    _id: new Types.ObjectId(id),
    companyId: new Types.ObjectId(session.companyId!),
    deletedAt: { $exists: false },
  };

  if (isCompanyAdmin(session)) {
    // CompanyAdmin can see all lists in the company
    // No additional filters needed
  } else if (isStoreAdmin(session)) {
    // StoreAdmin can only see lists from their store
    query.storeId = new Types.ObjectId(session.storeId!);
  } else if (isLibrarian(session)) {
    // Librarian can only see lists they created or are assigned to
    query.$or = [
      { createdBy: new Types.ObjectId(session.userId!) },
      { assignedTo: new Types.ObjectId(session.userId!) },
    ];
  }

  // Fetch the list with role-based filtering
  const list = await ListModel.findOne(query)
    .populate({
      path: 'items.bookId',
      select: 'isbn bookData genre tone ageGroup',
    })
    .populate('ownerUserId', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('storeId', 'name code')
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
    storeId: list.storeId?._id?.toString(),
    storeName: list.storeId?.name,
    assignedTo: (list.assignedTo || []).map((id: any) => id.toString()),
    sections: list.sections || [],
    createdAt: list.createdAt?.toISOString(),
    updatedAt: list.updatedAt?.toISOString(),
  };

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <ListDetails list={listData} userRole={session.role} />
    </div>
  );
};

export default ListPage;
