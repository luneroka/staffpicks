import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  isCompanyAdmin,
  isLibrarian,
  isStoreAdmin,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { ListModel } from '@/app/lib/models/List';
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
    if (isCompanyAdmin(session)) {
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

    if (isStoreAdmin(session)) {
      // StoreAdmin can only delete lists from their store AND that they created
      query.storeId = new Types.ObjectId(session.storeId!);
      query.createdBy = new Types.ObjectId(session.userId); // StoreAdmin can only delete lists they created
    } else if (isLibrarian(session)) {
      // Librarian can only delete lists they are currently assigned to
      query.assignedTo = new Types.ObjectId(session.userId);
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
      // Provide more specific error message based on user role
      let errorMessage =
        'List not found or you do not have permission to delete it';

      if (isStoreAdmin(session)) {
        errorMessage =
          'List not found or you can only delete lists you created yourself';
      } else if (isLibrarian(session)) {
        errorMessage =
          'List not found or you can only delete lists currently assigned to you';
      }

      return NextResponse.json({ error: errorMessage }, { status: 404 });
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

    if (isStoreAdmin(session)) {
      // StoreAdmin can only see lists from their store
      query.storeId = new Types.ObjectId(session.storeId!);
    } else if (isLibrarian(session)) {
      // Librarian can only see lists they are currently assigned to
      query.assignedTo = new Types.ObjectId(session.userId!);
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
    if (isCompanyAdmin(session)) {
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

    // 6. Build query to find the list (StoreAdmin can edit any list in their store)
    let findQuery: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
      deletedAt: { $exists: false },
    };

    if (isStoreAdmin(session)) {
      // StoreAdmin can edit any list from their store
      findQuery.storeId = new Types.ObjectId(session.storeId!);
    } else if (isLibrarian(session)) {
      // Librarian can only update lists they are currently assigned to
      findQuery.assignedTo = new Types.ObjectId(session.userId);
    }

    // 6.1 First, find the list to check ownership
    const existingList = await ListModel.findOne(findQuery);

    if (!existingList) {
      // Provide more specific error message based on user role
      let errorMessage =
        'List not found or you do not have permission to update it';

      if (isStoreAdmin(session)) {
        errorMessage = 'List not found in your store';
      } else if (isLibrarian(session)) {
        errorMessage =
          'List not found or you can only edit lists currently assigned to you';
      }

      return NextResponse.json({ error: errorMessage }, { status: 404 });
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

    // Handle assignedTo and sections based on role and ownership
    if (isStoreAdmin(session)) {
      // Check if StoreAdmin created this list
      const isCreator = existingList.createdBy.toString() === session.userId;

      if (isCreator) {
        // Creator can update assignedTo and sections
        if (assignedTo !== undefined) {
          updateFields.assignedTo = assignedTo.map(
            (id: string) => new Types.ObjectId(id)
          );
        }
        if (sections !== undefined) {
          updateFields.sections = sections;
        }
      } else {
        // Non-creator cannot update assignedTo
        // Check if they're actually trying to CHANGE the assignedTo field
        if (assignedTo !== undefined) {
          // Compare the new assignedTo with the existing one
          const existingAssignedTo = existingList.assignedTo
            .map((id: any) => id.toString())
            .sort();
          const newAssignedTo = assignedTo.slice().sort();

          // Check if the arrays are different
          const isChanged =
            existingAssignedTo.length !== newAssignedTo.length ||
            existingAssignedTo.some(
              (id: string, index: number) => id !== newAssignedTo[index]
            );

          if (isChanged) {
            return NextResponse.json(
              {
                error:
                  'Vous ne pouvez réassigner que les listes que vous avez créées vous-même. Les autres détails de la liste peuvent être modifiés.',
              },
              { status: 403 }
            );
          }
          // If not changed, don't include it in the update (keep existing value)
        }
        // Sections can be updated by any StoreAdmin
        if (sections !== undefined) {
          updateFields.sections = sections;
        }
      }
    } else if (isLibrarian(session)) {
      // Librarian: ensure they remain in assignedTo when editing
      if (assignedTo !== undefined) {
        const assignedToIds = assignedTo || [];
        const userIdString = session.userId!;

        // Add the librarian if not already in the array
        if (!assignedToIds.includes(userIdString)) {
          assignedToIds.push(userIdString);
        }

        updateFields.assignedTo = assignedToIds.map(
          (id: string) => new Types.ObjectId(id)
        );
      }
      if (sections !== undefined) {
        updateFields.sections = sections;
      }
    }

    // 7. Find and update the list
    const updatedList = await ListModel.findOneAndUpdate(
      findQuery,
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
