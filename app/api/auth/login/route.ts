import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { UserModel } from '@/app/lib/models/User';
import { CompanyModel } from '@/app/lib/models/Company';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with password hash
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.isLocked()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          error: `Account locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`,
        },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      // Record failed attempt and lock if threshold exceeded
      await user.recordFailedLogin();

      if (user.isLocked()) {
        return NextResponse.json(
          {
            error: `Too many failed attempts. Account locked for ${
              process.env.LOCKOUT_DURATION_MINUTES || 15
            } minutes.`,
          },
          { status: 423 }
        );
      }

      const attemptsLeft =
        parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5') -
        user.failedLoginAttempts;
      return NextResponse.json(
        {
          error: `Invalid email or password. ${attemptsLeft} attempts remaining.`,
        },
        { status: 401 }
      );
    }

    // Valid login: record success and reset failed attempts
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    await user.recordSuccessfulLogin(clientIP);

    // Fetch company name if user has a company
    let companyName: string | undefined;
    if (user.companyId) {
      const company = await CompanyModel.findById(user.companyId);
      companyName = company?.name;
    }

    // Create session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.userId = user._id.toString();
    session.email = user.email;
    session.firstName = user.firstName;
    session.lastName = user.lastName;
    session.isLoggedIn = true;
    session.role = user.role;
    session.companyId = user.companyId?.toString();
    session.companyName = companyName;
    session.storeId = user.storeId?.toString();

    await session.save();

    return NextResponse.json({
      success: true,
      redirectUrl: '/dashboard',
      user: {
        id: session.userId,
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        role: session.role,
        companyId: session.companyId,
        companyName: session.companyName,
        storeId: session.storeId,
      },
    });
  } catch (error) {
    console.error('login error: ', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
