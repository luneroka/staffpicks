import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import connectDB from '@/app/lib/mongodb';
import { UserModel, UserRole, UserStatus } from '@/app/lib/models/User';
import { StoreModel } from '@/app/lib/models/Store';
import { Types } from 'mongoose';

export const runtime = 'nodejs';

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(new Types.ObjectId(id))
      .populate('storeId', 'name code')
      .lean();

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Authorization checks
    if (session.role === UserRole.CompanyAdmin) {
      if (user.companyId?.toString() !== session.companyId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (session.role === UserRole.StoreAdmin) {
      if (
        user.storeId?.toString() !== session.storeId ||
        user.role !== UserRole.Librarian
      ) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    const userData = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId?.toString(),
      storeId: user.storeId?._id?.toString(),
      storeName: (user.storeId as any)?.name,
      storeCode: (user.storeId as any)?.code,
      sections: user.sections || [],
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, role, storeId, sections, avatarUrl } =
      body;

    await connectDB();

    const user = await UserModel.findById(new Types.ObjectId(id));

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Authorization checks
    if (session.role === UserRole.CompanyAdmin) {
      if (user.companyId?.toString() !== session.companyId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      // Company admins cannot modify admins
      if (user.role === UserRole.Admin || user.role === UserRole.CompanyAdmin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (session.role === UserRole.StoreAdmin) {
      if (
        user.storeId?.toString() !== session.storeId ||
        user.role !== UserRole.Librarian
      ) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (session.role !== UserRole.Admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Check email uniqueness if changed
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await UserModel.findOne({
        email: email.toLowerCase(),
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }
      user.email = email.toLowerCase();
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role !== undefined) user.role = role;
    if (storeId !== undefined) {
      if (storeId) {
        // Verify store exists and belongs to company
        const store = await StoreModel.findOne({
          _id: new Types.ObjectId(storeId),
          companyId: new Types.ObjectId(session.companyId!),
        });
        if (!store) {
          return NextResponse.json(
            { error: 'Magasin non trouvé' },
            { status: 404 }
          );
        }
        user.storeId = new Types.ObjectId(storeId);
      } else {
        user.storeId = undefined;
      }
    }
    if (sections !== undefined) user.sections = sections;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();
    await user.populate('storeId', 'name code');

    const userData = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      storeId: user.storeId?._id?.toString(),
      storeName: (user.storeId as any)?.name,
      storeCode: (user.storeId as any)?.code,
      sections: user.sections || [],
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(new Types.ObjectId(id));

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Cannot delete yourself
    if (user._id.toString() === session.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // Authorization checks
    if (session.role === UserRole.CompanyAdmin) {
      if (user.companyId?.toString() !== session.companyId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      // Company admins cannot delete admins or other company admins
      if (user.role === UserRole.Admin || user.role === UserRole.CompanyAdmin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (session.role === UserRole.StoreAdmin) {
      if (
        user.storeId?.toString() !== session.storeId ||
        user.role !== UserRole.Librarian
      ) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (session.role !== UserRole.Admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Soft delete: Deactivate the user instead of removing from database
    await user.deactivate();

    return NextResponse.json({
      message: 'Utilisateur désactivé avec succès',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: "Erreur lors de la désactivation de l'utilisateur" },
      { status: 500 }
    );
  }
}
