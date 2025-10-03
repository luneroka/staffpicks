import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
import { UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';

/**
 * DELETE /api/lists/[id]
 * Delete a list by ID (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId || !session.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Check authorization - CompanyAdmin cannot delete lists
    if (session.role === UserRole.CompanyAdmin) {
      return NextResponse.json(
        { error: 'CompanyAdmin cannot delete lists' },
        { status: 403 }
      );
    }

    // 3. Get ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid list ID format' },
        { status: 400 }
      );
    }

    // 4. Connect to database
    await connectDB();

    // 5. Build role-based query
    let query: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
      deletedAt: { $exists: false }, // Only delete if not already deleted
    };

    if (session.role === UserRole.StoreAdmin) {
      // StoreAdmin can only delete lists from their store
      query.storeId = new Types.ObjectId(session.storeId!);
    } else if (session.role === UserRole.Librarian) {
      // Librarian can only delete lists they created
      query.createdBy = new Types.ObjectId(session.userId);
    }

    // 6. Soft delete the list (set deletedAt timestamp)
    const deletedList = await ListModel.findOneAndUpdate(
      query,
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: new Types.ObjectId(session.userId),
        },
      },
      { new: true }
    );

    // 5. Check if list was found and deleted
    if (!deletedList) {
      return NextResponse.json(
        { error: 'List not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // 6. Return success response
    return NextResponse.json(
      {
        message: 'List deleted successfully',
        list: {
          id: deletedList._id.toString(),
          title: deletedList.title,
          deletedAt: deletedList.deletedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lists/[id]
 * Get a single list by ID with role-based visibility
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Get ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid list ID format' },
        { status: 400 }
      );
    }

    // 3. Connect to database
    await connectDB();

    // 4. Build role-based query
    let query: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
      deletedAt: { $exists: false },
    };

    if (session.role === UserRole.StoreAdmin) {
      // StoreAdmin can only see lists from their store
      query.storeId = new Types.ObjectId(session.storeId!);
    } else if (session.role === UserRole.Librarian) {
      // Librarian can only see lists they created or are assigned to
      query.$or = [
        { createdBy: new Types.ObjectId(session.userId!) },
        { assignedTo: new Types.ObjectId(session.userId!) },
      ];
    }

    // 5. Find the list
    const list = await ListModel.findOne(query)
      .populate({
        path: 'items.bookId',
        select: 'isbn bookData genre tone ageGroup',
      })
      .populate('ownerUserId', 'name email')
      .populate('createdBy', 'name email')
      .populate('storeId', 'name code')
      .lean();

    // 5. Check if list exists
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // 6. Return list
    return NextResponse.json({
      list: {
        id: list._id.toString(),
        title: list.title,
        slug: list.slug,
        description: list.description,
        coverImage: list.coverImage,
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
        owner: list.ownerUserId,
        createdBy: list.createdBy,
        storeId: list.storeId,
        assignedTo: list.assignedTo || [],
        sections: list.sections || [],
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lists/[id]
 * Update a list by ID with role-based authorization
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId || !session.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // 2. Check authorization - CompanyAdmin cannot update lists
    if (session.role === UserRole.CompanyAdmin) {
      return NextResponse.json(
        { error: 'CompanyAdmin cannot update lists' },
        { status: 403 }
      );
    }

    // 3. Get ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid list ID format' },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const {
      title,
      description,
      coverImage,
      visibility,
      publishAt,
      unpublishAt,
      items,
      assignedTo,
      sections,
    } = body;

    // 4. Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Build role-based query and update fields
    let query: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
      deletedAt: { $exists: false },
    };

    if (session.role === UserRole.StoreAdmin) {
      // StoreAdmin can only update lists from their store
      query.storeId = new Types.ObjectId(session.storeId!);
    } else if (session.role === UserRole.Librarian) {
      // Librarian can only update lists they created
      query.createdBy = new Types.ObjectId(session.userId);
    }

    // Build update object
    const updateFields: any = {
      title: title.trim(),
      description: description?.trim(),
      coverImage,
      visibility,
      publishAt: publishAt ? new Date(publishAt) : undefined,
      unpublishAt: unpublishAt ? new Date(unpublishAt) : undefined,
      items: items || [],
      updatedBy: new Types.ObjectId(session.userId),
    };

    // Only StoreAdmin can update assignedTo and sections
    if (session.role === UserRole.StoreAdmin) {
      if (assignedTo !== undefined) {
        updateFields.assignedTo = assignedTo.map(
          (id: string) => new Types.ObjectId(id)
        );
      }
      if (sections !== undefined) {
        updateFields.sections = sections;
      }
    }

    // 7. Find and update the list
    const updatedList = await ListModel.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'items.bookId',
        select: 'isbn bookData genre tone ageGroup',
      })
      .populate('ownerUserId', 'name email')
      .populate('storeId', 'name code')
      .lean();

    // 7. Check if list was found and updated
    if (!updatedList) {
      return NextResponse.json(
        { error: 'List not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // 8. Return updated list
    return NextResponse.json(
      {
        message: 'List updated successfully',
        list: {
          id: updatedList._id.toString(),
          title: updatedList.title,
          slug: updatedList.slug,
          description: updatedList.description,
          coverImage: updatedList.coverImage,
          visibility: updatedList.visibility,
          publishAt: updatedList.publishAt,
          unpublishAt: updatedList.unpublishAt,
          items: updatedList.items.map((item: any) => ({
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
          owner: updatedList.ownerUserId,
          storeId: updatedList.storeId,
          assignedTo: updatedList.assignedTo || [],
          sections: updatedList.sections || [],
          updatedAt: updatedList.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating list:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
