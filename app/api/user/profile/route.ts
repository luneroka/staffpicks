import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import connectDB from '@/app/lib/mongodb';
import { UserModel } from '@/app/lib/models/User';

/**
 * GET /api/user/profile
 * Fetch current user's profile information
 */
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findById(session.userId)
      .select('-passwordHash')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      companyId: user.companyId?.toString(),
      storeId: user.storeId?.toString(),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();

    await connectDB();

    // Find the user
    const user = await UserModel.findById(session.userId).select(
      '+passwordHash'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.name !== undefined && body.name.trim()) {
      user.name = body.name.trim();
    }

    if (body.email !== undefined && body.email.trim()) {
      const emailLower = body.email.toLowerCase().trim();

      // Check if email is already taken by another user
      const existingUser = await UserModel.findOne({
        email: emailLower,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }

      user.email = emailLower;
      // Update session email
      session.email = emailLower;
    }

    if (body.avatarUrl !== undefined) {
      user.avatarUrl = body.avatarUrl;
    }

    // Handle password change if provided
    if (body.currentPassword && body.newPassword && body.confirmPassword) {
      // Verify current password
      const isValidPassword = await user.comparePassword(body.currentPassword);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }

      // Validate new password
      if (body.newPassword !== body.confirmPassword) {
        return NextResponse.json(
          { error: 'Les mots de passe ne correspondent pas' },
          { status: 400 }
        );
      }

      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au moins 8 caractères' },
          { status: 400 }
        );
      }

      // Set new password
      await user.setPassword(body.newPassword);
    }

    // Save the updated user
    await user.save();

    // Update session name if changed
    if (body.name !== undefined) {
      session.name = user.name;
    }

    await session.save();

    // Return updated user (without password hash)
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
