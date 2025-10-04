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

/**
 * POST /api/books
 * Create a new book for the authenticated user's library
 * Authorization: StoreAdmin and Librarian only (CompanyAdmin cannot create)
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

    // 2. CompanyAdmin cannot create books
    if (isCompanyAdmin(session)) {
      return NextResponse.json(
        {
          error:
            'CompanyAdmin cannot create books. Use StoreAdmin or Librarian account.',
        },
        { status: 403 }
      );
    }

    // 3. StoreAdmin and Librarian must have a storeId
    if (!session.storeId) {
      return NextResponse.json(
        { error: 'User must be assigned to a store to create books' },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const {
      isbn,
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
    if (!isbn || !title || !authors || authors.length === 0) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: isbn, title, and authors are required',
        },
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

    // 7. Check if THIS USER already added this ISBN
    // Note: Each librarian can create their own version of a book (same ISBN) with
    // their own categorization, recommendations, and edited metadata. The ISBN is
    // just used to fetch initial data, but then each entry is personalized.
    // We only prevent the same user from adding the exact same ISBN twice.
    const existingBook = await BookModel.findOne({
      companyId: new Types.ObjectId(session.companyId),
      isbn: isbn.trim(),
      ownerUserId: new Types.ObjectId(session.userId),
    });

    if (existingBook) {
      return NextResponse.json(
        {
          error:
            'You have already added a book with this ISBN to your library.',
        },
        { status: 409 }
      );
    }

    // 8. Create new book with store and assignment data
    const newBook = await BookModel.create({
      companyId: new Types.ObjectId(session.companyId),
      storeId: new Types.ObjectId(session.storeId),
      ownerUserId: new Types.ObjectId(session.userId),
      createdBy: new Types.ObjectId(session.userId),
      assignedTo: assignedTo
        ? assignedTo.map((id: string) => new Types.ObjectId(id))
        : [],
      sections: sections || [],
      isbn: isbn.trim(),
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
    });

    // 9. Return created book
    return NextResponse.json(
      {
        message: 'Book created successfully',
        book: {
          id: newBook._id.toString(),
          isbn: newBook.isbn,
          title: newBook.bookData.title,
          authors: newBook.bookData.authors,
          cover: newBook.bookData.cover,
          description: newBook.bookData.description,
          publisher: newBook.bookData.publisher,
          pageCount: newBook.bookData.pageCount,
          publishDate: newBook.bookData.publishDate,
          genre: newBook.genre,
          tone: newBook.tone,
          ageGroup: newBook.ageGroup,
          purchaseLink: newBook.purchaseLink,
          recommendation: newBook.recommendation,
          assignedTo: newBook.assignedTo,
          sections: newBook.sections,
          createdAt: newBook.createdAt,
          updatedAt: newBook.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating book:', error);

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

/**
 * GET /api/books
 * Get books based on user role:
 * - CompanyAdmin: Read-only access to all books in company
 * - StoreAdmin: Only books from their store
 * - Librarian: Only books created by them or assigned to them
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

    // 2. Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const tone = searchParams.get('tone');
    const ageGroup = searchParams.get('ageGroup');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // 3. Connect to database
    await connectDB();

    // 4. Build query based on role
    const query: any = {
      companyId: new Types.ObjectId(session.companyId),
    };

    // Role-based filtering
    if (isCompanyAdmin(session)) {
      // CompanyAdmin sees all books in company (read-only)
      // No additional filter needed
    } else if (isStoreAdmin(session)) {
      // StoreAdmin sees only books from their store
      if (!session.storeId) {
        return NextResponse.json(
          { error: 'StoreAdmin must be assigned to a store' },
          { status: 403 }
        );
      }
      query.storeId = new Types.ObjectId(session.storeId);
    } else if (isLibrarian(session)) {
      // Librarian sees only books they created or are assigned to
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

    // Filter by facets if specified
    if (genre) query.genre = genre;
    if (tone) query.tone = tone;
    if (ageGroup) query.ageGroup = ageGroup;

    // Search filter (title, authors, or ISBN)
    if (search) {
      const searchQuery = {
        $or: [
          { 'bookData.title': { $regex: search, $options: 'i' } },
          { 'bookData.authors': { $regex: search, $options: 'i' } },
          { isbn: { $regex: search, $options: 'i' } },
        ],
      };

      // Combine with existing $or if it exists (for librarian filtering)
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchQuery];
        delete query.$or;
      } else {
        Object.assign(query, searchQuery);
      }
    }

    // 5. Fetch books
    const books = await BookModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('ownerUserId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('storeId', 'name code')
      .lean();

    // 6. Get total count for pagination
    const total = await BookModel.countDocuments(query);

    // 7. Return books
    return NextResponse.json({
      books: books.map((book: any) => ({
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
      })),
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + books.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
