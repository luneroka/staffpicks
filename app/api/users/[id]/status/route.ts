import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  isCompanyAdmin,
  isStoreAdmin,
} from '@/app/lib/auth/helpers';
import connectDB from '@/app/lib/mongodb';
import { UserModel, UserStatus } from '@/app/lib/models/User';
import { Types } from 'mongoose';

/**
 * PATCH /api/users/[id]/status
 * Update user status (activate, deactivate, suspend)
 * Authorization: CompanyAdmin can change any user in their company, StoreAdmin can change users in their store
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const session = await getSession();

    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json(
        { error: 'Non autorisé - Veuillez vous connecter' },
        { status: 401 }
      );
    }

    // 2. Only CompanyAdmin and StoreAdmin can change user status
    if (!isCompanyAdmin(session) && !isStoreAdmin(session)) {
      return NextResponse.json(
        {
          error:
            'Non autorisé - Seuls les administrateurs peuvent modifier le statut des utilisateurs',
        },
        { status: 403 }
      );
    }

    // 3. Get ID from params and parse request body
    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Validate action
    if (!action || !['activate', 'deactivate', 'suspend'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Action invalide. Utilisez: activate, deactivate, ou suspend',
        },
        { status: 400 }
      );
    }

    // 4. Connect to database
    await connectDB();

    // 5. Build query based on role
    const query: any = {
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
      deletedAt: { $exists: false },
    };

    // StoreAdmin can only change status of users in their store
    if (isStoreAdmin(session)) {
      if (!session.storeId) {
        return NextResponse.json(
          { error: 'Admin Magasin doit être assigné à un magasin' },
          { status: 403 }
        );
      }
      query.storeId = new Types.ObjectId(session.storeId);
    }

    // 6. Find the user
    const user = await UserModel.findOne(query);

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Utilisateur non trouvé ou vous n'avez pas la permission de modifier son statut",
        },
        { status: 404 }
      );
    }

    // 7. Prevent users from changing their own status
    if (user._id.toString() === session.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre statut' },
        { status: 403 }
      );
    }

    // 8. Map action to status
    let newStatus: UserStatus;
    switch (action) {
      case 'activate':
        newStatus = UserStatus.Active;
        break;
      case 'deactivate':
        newStatus = UserStatus.Inactive;
        break;
      case 'suspend':
        newStatus = UserStatus.Suspended;
        break;
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // 9. Update user status
    user.status = newStatus;
    await user.save();

    // 10. Return success response
    return NextResponse.json(
      {
        message: 'Statut utilisateur mis à jour avec succès',
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la mise à jour du statut utilisateur',
      },
      { status: 500 }
    );
  }
}
