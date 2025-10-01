import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error: ', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
