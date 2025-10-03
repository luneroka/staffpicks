import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel, ListVisibility } from '@/app/lib/models/List';
import { BookModel } from '@/app/lib/models/Book';
import { UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';

/**
 * Helper function to generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Helper function to ensure slug uniqueness
 */
async function ensureUniqueSlug(
  baseSlug: string,
  companyId: Types.ObjectId,
  ownerUserId: Types.ObjectId
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ListModel.findOne({
      companyId,
      ownerUserId,
      slug,
      deletedAt: { $exists: false },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * POST /api/lists
 * Create a new list
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId || !session.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Check authorization - CompanyAdmin cannot create lists
    if (session.role === UserRole.CompanyAdmin) {
      return NextResponse.json(
        { error: 'CompanyAdmin cannot create lists' },
        { status: 403 }
      );
    }

    // 3. Check storeId is present for StoreAdmin and Librarian
    if (!session.storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const {
      title,
      description,
      coverImage,
      visibility = ListVisibility.Draft,
      publishAt,
      unpublishAt,
      items = [],
      assignedTo = [],
      sections = [],
    } = body;

    // 3. Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    // 4. Validate visibility enum
    if (!Object.values(ListVisibility).includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Generate unique slug
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(
      baseSlug,
      new Types.ObjectId(session.companyId),
      new Types.ObjectId(session.userId)
    );

    // 7. Validate and process items (if any)
    const processedItems = [];
    if (items && items.length > 0) {
      // Validate that all books exist and belong to the company
      const bookIds = items.map((item: any) => item.bookId);
      const books = await BookModel.find({
        _id: { $in: bookIds.map((id: string) => new Types.ObjectId(id)) },
        companyId: new Types.ObjectId(session.companyId),
      });

      if (books.length !== bookIds.length) {
        return NextResponse.json(
          {
            error:
              'One or more books not found or do not belong to your company',
          },
          { status: 400 }
        );
      }

      // Process items with position
      for (let i = 0; i < items.length; i++) {
        processedItems.push({
          bookId: new Types.ObjectId(items[i].bookId),
          position: items[i].position !== undefined ? items[i].position : i,
          addedAt: new Date(),
        });
      }

      // Sort by position
      processedItems.sort((a, b) => a.position - b.position);
    }

    // 8. Use the cover image URL directly (already uploaded to Cloudinary by the form)
    const cloudinaryCoverUrl = coverImage?.trim() || undefined;

    // 9. Create the list
    const newList = await ListModel.create({
      companyId: new Types.ObjectId(session.companyId),
      storeId: new Types.ObjectId(session.storeId!),
      ownerUserId: new Types.ObjectId(session.userId),
      createdBy: new Types.ObjectId(session.userId),
      title: title.trim(),
      slug,
      description: description?.trim(),
      coverImage: cloudinaryCoverUrl,
      visibility,
      publishAt: publishAt ? new Date(publishAt) : undefined,
      unpublishAt: unpublishAt ? new Date(unpublishAt) : undefined,
      items: processedItems,
      assignedTo: assignedTo.map((id: string) => new Types.ObjectId(id)),
      sections: sections || [],
    });

    // 10. Populate the created list with book details
    const populatedList = await ListModel.findById(newList._id)
      .populate({
        path: 'items.bookId',
        select: 'isbn bookData genre tone ageGroup',
      })
      .populate('ownerUserId', 'name email')
      .populate('createdBy', 'name email')
      .populate('storeId', 'name code')
      .lean();

    // 11. Return success response
    return NextResponse.json(
      {
        message: 'List created successfully',
        list: {
          id: populatedList!._id.toString(),
          title: populatedList!.title,
          slug: populatedList!.slug,
          description: populatedList!.description,
          coverImage: populatedList!.coverImage,
          visibility: populatedList!.visibility,
          publishAt: populatedList!.publishAt,
          unpublishAt: populatedList!.unpublishAt,
          items: populatedList!.items.map((item: any) => ({
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
          owner: populatedList!.ownerUserId,
          createdBy: populatedList!.createdBy,
          storeId: populatedList!.storeId,
          assignedTo: populatedList!.assignedTo,
          sections: populatedList!.sections,
          createdAt: populatedList!.createdAt,
          updatedAt: populatedList!.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating list:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    // Handle duplicate slug error (shouldn't happen with our unique generation)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as any).code === 11000
    ) {
      return NextResponse.json(
        { error: 'A list with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lists
 * Get all lists for the authenticated user's company with role-based filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get('visibility') as ListVisibility | null;
    const ownerUserId = searchParams.get('ownerUserId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 3. Connect to database
    await connectDB();

    // 4. Build query based on user role
    let query: any = {
      companyId: new Types.ObjectId(session.companyId),
      deletedAt: { $exists: false },
    };

    // Role-based filtering
    if (session.role === UserRole.CompanyAdmin) {
      // CompanyAdmin sees all lists in the company
      // No additional filters needed
    } else if (session.role === UserRole.StoreAdmin) {
      // StoreAdmin sees only lists from their store
      query.storeId = new Types.ObjectId(session.storeId!);
    } else if (session.role === UserRole.Librarian) {
      // Librarian sees only lists they created or are assigned to
      query.$or = [
        { createdBy: new Types.ObjectId(session.userId!) },
        { assignedTo: new Types.ObjectId(session.userId!) },
      ];
    }

    if (visibility) {
      query.visibility = visibility;
    }

    if (ownerUserId) {
      query.ownerUserId = new Types.ObjectId(ownerUserId);
    }

    // 5. Fetch lists with pagination
    const [lists, total] = await Promise.all([
      ListModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'items.bookId',
          select: 'isbn bookData genre tone ageGroup',
        })
        .populate('ownerUserId', 'name email')
        .populate('storeId', 'name code')
        .lean(),
      ListModel.countDocuments(query),
    ]);

    // 6. Format response
    const formattedLists = lists.map((list: any) => ({
      id: list._id.toString(),
      title: list.title,
      slug: list.slug,
      description: list.description,
      coverImage: list.coverImage,
      visibility: list.visibility,
      publishAt: list.publishAt,
      unpublishAt: list.unpublishAt,
      itemCount: list.items.length,
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
      owner: list.ownerUserId,
      storeId: list.storeId,
      assignedTo: list.assignedTo || [],
      sections: list.sections || [],
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));

    // 7. Return response with pagination info
    return NextResponse.json({
      lists: formattedLists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
