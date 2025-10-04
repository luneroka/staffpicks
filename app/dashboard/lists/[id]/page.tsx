import ListDetails from '@/app/components/lists/ListDetails';
import { requireAuth } from '@/app/lib/auth/helpers';
import { buildRoleBasedQuery } from '@/app/lib/auth/queryBuilders';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { Types } from 'mongoose';
import { notFound } from 'next/navigation';
import BackButton from '@/app/components/BackButton';
import { transformListForClient } from '@/app/lib/utils/listUtils';

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
  const query = buildRoleBasedQuery(session, {
    _id: new Types.ObjectId(id),
    deletedAt: { $exists: false },
  });

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

  // Transform list using utility function
  const listData = transformListForClient(list);

  return (
    <div>
      <BackButton className='mt-[-16px]' />
      <ListDetails list={listData} userRole={session.role} />
    </div>
  );
};

export default ListPage;
