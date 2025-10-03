import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import connectDB from '@/app/lib/mongodb';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { StoreModel } from '@/app/lib/models/Store';
import { Types } from 'mongoose';

/**
 * DELETE /api/stores/[id]/users/[userId]
 * Remove a user from a store (unassign)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only Admin and CompanyAdmin can unassign users from stores
    if (
      session.role !== UserRole.Admin &&
      session.role !== UserRole.CompanyAdmin
    ) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    const { id: storeId, userId } = await params;

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(storeId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify store exists and belongs to user's company (for CompanyAdmin)
    const storeQuery: any = { _id: new Types.ObjectId(storeId) };
    if (session.role === UserRole.CompanyAdmin) {
      storeQuery.companyId = new Types.ObjectId(session.companyId!);
    }

    const store = await StoreModel.findOne(storeQuery);
    if (!store) {
      return NextResponse.json(
        { error: 'Magasin non trouvé' },
        { status: 404 }
      );
    }

    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Verify user is assigned to this store
    if (!user.storeId || user.storeId.toString() !== storeId) {
      return NextResponse.json(
        { error: "Cet utilisateur n'est pas assigné à ce magasin" },
        { status: 400 }
      );
    }

    // CompanyAdmin can only unassign users from their company
    if (session.role === UserRole.CompanyAdmin) {
      if (user.companyId?.toString() !== session.companyId) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }

    // Remove store assignment
    user.storeId = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Utilisateur retiré du magasin avec succès',
      user: {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error removing user from store:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
