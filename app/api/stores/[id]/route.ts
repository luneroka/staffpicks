import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { StoreModel } from '@/app/lib/models/Store';
import { UserModel } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import { getSession, isCompanyAdmin } from '@/app/lib/auth/helpers';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/stores/[id]
 * Fetch a single store by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await getSession();

    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de magasin invalide' },
        { status: 400 }
      );
    }

    await connectDB();

    const store = await StoreModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    }).lean();

    if (!store) {
      return NextResponse.json(
        { error: 'Magasin non trouvé' },
        { status: 404 }
      );
    }

    // Get assigned users
    const assignedUsers = await UserModel.find({
      storeId: new Types.ObjectId(id),
    })
      .select('firstName lastName email role')
      .lean();

    return NextResponse.json({
      _id: store._id.toString(),
      code: store.code,
      name: store.name,
      description: store.description,
      status: store.status,
      contactEmail: store.contactEmail,
      contactPhone: store.contactPhone,
      address: store.address,
      operatingHours: store.operatingHours,
      settings: store.settings,
      assignedUsers: assignedUsers.map((user: any) => ({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      })),
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du magasin' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/stores/[id]
 * Update a store
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await getSession();

    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // User must be company admin to update a store
    if (!isCompanyAdmin(session)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de magasin invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();

    await connectDB();

    const store = await StoreModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Magasin non trouvé' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it conflicts
    if (body.code && body.code !== store.code) {
      const existingStore = await StoreModel.findOne({
        companyId: new Types.ObjectId(session.companyId),
        code: body.code.toUpperCase(),
        _id: { $ne: store._id },
      });

      if (existingStore) {
        return NextResponse.json(
          { error: 'Un magasin avec ce code existe déjà' },
          { status: 409 }
        );
      }

      store.code = body.code.toUpperCase();
    }

    // Update fields
    if (body.name !== undefined) store.name = body.name;
    if (body.description !== undefined) store.description = body.description;
    if (body.status !== undefined) store.status = body.status;
    if (body.contactEmail !== undefined) store.contactEmail = body.contactEmail;
    if (body.contactPhone !== undefined) store.contactPhone = body.contactPhone;
    if (body.address !== undefined) store.address = body.address;
    if (body.operatingHours !== undefined)
      store.operatingHours = body.operatingHours;
    if (body.settings !== undefined) store.settings = body.settings;

    await store.save();

    return NextResponse.json({
      success: true,
      store: {
        _id: store._id.toString(),
        code: store.code,
        name: store.name,
        description: store.description,
        status: store.status,
        contactEmail: store.contactEmail,
        contactPhone: store.contactPhone,
        address: store.address,
        operatingHours: store.operatingHours,
        settings: store.settings,
      },
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du magasin' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[id]
 * Delete a store
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await getSession();

    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // User must be a company admin to delete a store
    if (!isCompanyAdmin(session)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID de magasin invalide' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if store has assigned users
    const assignedUsersCount = await UserModel.countDocuments({
      storeId: new Types.ObjectId(id),
    });

    if (assignedUsersCount > 0) {
      return NextResponse.json(
        {
          error:
            'Impossible de supprimer un magasin avec des utilisateurs assignés',
        },
        { status: 400 }
      );
    }

    const store = await StoreModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(session.companyId),
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Magasin non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magasin supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du magasin' },
      { status: 500 }
    );
  }
}
