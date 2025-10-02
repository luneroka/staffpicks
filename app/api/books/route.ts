import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { BookModel } from '@/app/lib/models/Book';
import { Types } from 'mongoose';

/**
 * POST /api/books
 * Create a new book for the authenticated user's library
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

    // 2. Parse request body
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
    } = body;

    // 3. Validate required fields
    if (!isbn || !title || !authors || authors.length === 0) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: isbn, title, and authors are required',
        },
        { status: 400 }
      );
    }

    // 4. Connect to database
    await connectDB();

    // 5. Check if book with same ISBN already exists for this company
    const existingBook = await BookModel.findOne({
      companyId: new Types.ObjectId(session.companyId),
      isbn: isbn.trim(),
    });

    if (existingBook) {
      return NextResponse.json(
        { error: 'A book with this ISBN already exists in your library' },
        { status: 409 }
      );
    }

    // 6. Create new book
    const newBook = await BookModel.create({
      companyId: new Types.ObjectId(session.companyId),
      ownerUserId: new Types.ObjectId(session.userId),
      createdBy: new Types.ObjectId(session.userId),
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

    // 7. Return created book
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
 * Get all books for the authenticated user's company
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
    const ownerUserId = searchParams.get('ownerUserId');
    const genre = searchParams.get('genre');
    const tone = searchParams.get('tone');
    const ageGroup = searchParams.get('ageGroup');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // 3. Connect to database
    await connectDB();

    // 4. Build query
    const query: any = {
      companyId: new Types.ObjectId(session.companyId),
    };

    // Filter by owner if specified
    if (ownerUserId) {
      query.ownerUserId = new Types.ObjectId(ownerUserId);
    }

    // Filter by facets if specified
    if (genre) query.genre = genre;
    if (tone) query.tone = tone;
    if (ageGroup) query.ageGroup = ageGroup;

    // 5. Fetch books
    const books = await BookModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('ownerUserId', 'name email')
      .populate('createdBy', 'name email')
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
