import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Destroy the session
    session.destroy();

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('Logout error: ', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

// Support GET method for direct navigation
export async function GET(request: NextRequest) {
  return POST(request);
}
