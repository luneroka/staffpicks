import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await params;

  if (!isbn) {
    return NextResponse.json({ error: 'ISBN is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_ISBN_DB_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`https://api2.isbndb.com/book/${isbn}`, {
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ISBN API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book data' },
      { status: 500 }
    );
  }
}
