import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';

/**
 * DELETE /api/books/[id]
 * Delete a book by ID
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

    // 4. Find and delete the book
    // Only allow deletion if book belongs to user's company
    const deletedBook = await BookModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    });

    // 5. Check if book was found and deleted
    if (!deletedBook) {
      return NextResponse.json(
        { error: 'Book not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // 6. Return success response
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

    // 4. Find the book
    const book = await BookModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    })
      .populate('ownerUserId', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    // 5. Check if book exists
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // 6. Return book
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

    // 3. Parse request body
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
    } = body;

    // 4. Validate required fields
    if (!title || !authors || authors.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title and authors are required' },
        { status: 400 }
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Find and update the book
    const updatedBook = await BookModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        companyId: new Types.ObjectId(session.companyId),
      },
      {
        $set: {
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
        },
      },
      { new: true, runValidators: true }
    );

    // 7. Check if book was found and updated
    if (!updatedBook) {
      return NextResponse.json(
        { error: 'Book not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // 8. Return updated book
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
