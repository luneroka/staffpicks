import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  isCompanyAdmin,
  isLibrarian,
  isStoreAdmin,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';
import { getDeletedUserIds } from '@/app/lib/auth/queryBuilders';

/**
 * DELETE /api/books/[id]
 * Delete a book by ID
 * Authorization: CompanyAdmin cannot delete, StoreAdmin can delete from their store, Librarian can delete their own
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

    // 2. CompanyAdmin cannot delete books
    if (isCompanyAdmin(session)) {
      return NextResponse.json(
        { error: 'CompanyAdmin cannot delete books' },
        { status: 403 }
      );
    }

    // 3. Get ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      );
    }

    // 4. Connect to database
    await connectDB();

    // 5. Build delete query based on role
    const deleteQuery: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    };

    if (isStoreAdmin(session)) {
      // StoreAdmin can only delete books from their store
      if (!session.storeId) {
        return NextResponse.json(
          { error: 'StoreAdmin must be assigned to a store' },
          { status: 403 }
        );
      }
      deleteQuery.storeId = new Types.ObjectId(session.storeId);
    } else if (isLibrarian(session)) {
      // Librarian can only delete books they created or are assigned to
      deleteQuery.$or = [
        { ownerUserId: new Types.ObjectId(session.userId) },
        { createdBy: new Types.ObjectId(session.userId) },
        { assignedTo: new Types.ObjectId(session.userId) },
      ];
    }

    // 6. Find and delete the book
    const deletedBook = await BookModel.findOneAndDelete(deleteQuery);

    // 7. Check if book was found and deleted
    if (!deletedBook) {
      return NextResponse.json(
        { error: 'Book not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // 8. Return success response
    return NextResponse.json(
      {
        message: 'Book deleted successfully',
        book: {
          id: deletedBook._id.toString(),
          isbn: deletedBook.isbn,
          title: deletedBook.bookData.title,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/books/[id]
 * Get a single book by ID
 * Authorization: Role-based visibility (CompanyAdmin: all, StoreAdmin: their store, Librarian: assigned/owned)
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
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      );
    }

    // 3. Connect to database
    await connectDB();

    // 4. Build query based on role
    const query: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    };

    if (isStoreAdmin(session)) {
      // StoreAdmin can only see books from their store
      if (!session.storeId) {
        return NextResponse.json(
          { error: 'StoreAdmin must be assigned to a store' },
          { status: 403 }
        );
      }
      query.storeId = new Types.ObjectId(session.storeId);
    } else if (isLibrarian(session)) {
      // Librarian can only see books they created or are assigned to
      if (!session.userId) {
        return NextResponse.json(
          { error: 'User ID not found in session' },
          { status: 403 }
        );
      }
      query.$or = [
        { ownerUserId: new Types.ObjectId(session.userId) },
        { createdBy: new Types.ObjectId(session.userId) },
        { assignedTo: new Types.ObjectId(session.userId) },
      ];
    }

    // Exclude content from deleted users (keep content from inactive/suspended users visible)
    const deletedUserIds = await getDeletedUserIds(session.companyId);
    if (deletedUserIds.length > 0) {
      query.createdBy = { $nin: deletedUserIds };
    }

    // 5. Find the book
    const book = await BookModel.findOne(query)
      .populate('ownerUserId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('storeId', 'name code')
      .lean();

    // 6. Check if book exists
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // 7. Return book
    return NextResponse.json({
      book: {
        id: book._id.toString(),
        isbn: book.isbn,
        title: book.bookData.title,
        authors: book.bookData.authors,
        cover: book.bookData.cover,
        description: book.bookData.description,
        publisher: book.bookData.publisher,
        pageCount: book.bookData.pageCount,
        publishDate: book.bookData.publishDate,
        genre: book.genre,
        tone: book.tone,
        ageGroup: book.ageGroup,
        purchaseLink: book.purchaseLink,
        recommendation: book.recommendation,
        owner: book.ownerUserId,
        createdBy: book.createdBy,
        store: book.storeId,
        assignedTo: book.assignedTo,
        sections: book.sections,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/books/[id]
 * Update a book by ID
 * Authorization: CompanyAdmin cannot edit, StoreAdmin can edit their store's books, Librarian can edit their own
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

    // 2. CompanyAdmin cannot edit books
    if (isCompanyAdmin(session)) {
      return NextResponse.json(
        { error: 'CompanyAdmin cannot edit books' },
        { status: 403 }
      );
    }

    // 3. Get ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid book ID format' },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const {
      title,
      authors,
      cover,
      description,
      publisher,
      pageCount,
      publishDate,
      genre,
      tone,
      ageGroup,
      purchaseLink,
      recommendation,
      assignedTo,
      sections,
    } = body;

    // 5. Validate required fields
    if (!title || !authors || authors.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title and authors are required' },
        { status: 400 }
      );
    }

    if (!publisher || !description) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: publisher and description are required',
        },
        { status: 400 }
      );
    }

    if (!genre || !tone) {
      return NextResponse.json(
        {
          error: 'Missing required fields: genre and tone are required',
        },
        { status: 400 }
      );
    }

    // StoreAdmin must assign the book to at least one librarian
    if (isStoreAdmin(session)) {
      if (!assignedTo || assignedTo.length === 0) {
        return NextResponse.json(
          {
            error: 'StoreAdmin must assign the book to at least one librarian',
          },
          { status: 400 }
        );
      }
    }

    // 6. Connect to database
    await connectDB();

    // 7. Build query based on role
    const updateQuery: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    };

    if (isStoreAdmin(session)) {
      // StoreAdmin can only edit books from their store
      if (!session.storeId) {
        return NextResponse.json(
          { error: 'StoreAdmin must be assigned to a store' },
          { status: 403 }
        );
      }
      updateQuery.storeId = new Types.ObjectId(session.storeId);
    } else if (isLibrarian(session)) {
      // Librarian can only edit books they created or are assigned to
      updateQuery.$or = [
        { ownerUserId: new Types.ObjectId(session.userId) },
        { createdBy: new Types.ObjectId(session.userId) },
        { assignedTo: new Types.ObjectId(session.userId) },
      ];
    }

    // 8. Find and update the book
    const updateData: any = {
      bookData: {
        title: title.trim(),
        authors: authors.map((author: string) => author.trim()),
        cover,
        description,
        publisher,
        pageCount,
        publishDate: publishDate ? new Date(publishDate) : undefined,
      },
      genre,
      tone,
      ageGroup,
      purchaseLink,
      recommendation,
      updatedBy: new Types.ObjectId(session.userId),
    };

    // Only StoreAdmin can update assignedTo and sections
    if (isStoreAdmin(session)) {
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo.map(
          (id: string) => new Types.ObjectId(id)
        );
      }
      if (sections !== undefined) {
        updateData.sections = sections;
      }
    }

    const updatedBook = await BookModel.findOneAndUpdate(
      updateQuery,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // 9. Check if book was found and updated
    if (!updatedBook) {
      return NextResponse.json(
        { error: 'Book not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // 10. Return updated book
    return NextResponse.json(
      {
        message: 'Book updated successfully',
        book: {
          id: updatedBook._id.toString(),
          isbn: updatedBook.isbn,
          title: updatedBook.bookData.title,
          authors: updatedBook.bookData.authors,
          cover: updatedBook.bookData.cover,
          description: updatedBook.bookData.description,
          publisher: updatedBook.bookData.publisher,
          pageCount: updatedBook.bookData.pageCount,
          publishDate: updatedBook.bookData.publishDate,
          genre: updatedBook.genre,
          tone: updatedBook.tone,
          ageGroup: updatedBook.ageGroup,
          purchaseLink: updatedBook.purchaseLink,
          recommendation: updatedBook.recommendation,
          assignedTo: updatedBook.assignedTo,
          sections: updatedBook.sections,
          updatedAt: updatedBook.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating book:', error);

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
