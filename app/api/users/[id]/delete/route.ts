import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import { getSession, isAdmin, isCompanyAdmin } from '@/app/lib/auth/helpers';

export const runtime = 'nodejs';

// POST - Permanently delete user (soft delete with deletedAt)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only Admin and CompanyAdmin can permanently delete users
    if (!isAdmin(session) && !isCompanyAdmin(session)) {
      return NextResponse.json(
        {
          error:
            'Seuls les administrateurs peuvent supprimer définitivement un utilisateur',
        },
        { status: 403 }
      );
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

    // Authorization checks for CompanyAdmin
    if (isCompanyAdmin(session)) {
      if (user.companyId?.toString() !== session.companyId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      // Company admins cannot delete admins or other company admins
      if (user.role === UserRole.Admin || user.role === UserRole.CompanyAdmin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    // Perform soft delete
    await user.softDelete();

    return NextResponse.json({
      message: 'Utilisateur supprimé définitivement avec succès',
    });
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression définitive de l'utilisateur" },
      { status: 500 }
    );
  }
}
