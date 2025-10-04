import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { StoreModel, StoreStatus } from '@/app/lib/models/Store';
import { UserModel } from '@/app/lib/models/User';
import { Types } from 'mongoose';
import { getSession, isCompanyAdmin } from '@/app/lib/auth/helpers';

/**
 * GET /api/stores
 * Fetch all stores for the company
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const stores = await StoreModel.find({
      companyId: new Types.ObjectId(session.companyId),
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get librarian counts for each store
    const storesWithCounts = await Promise.all(
      stores.map(async (store: any) => {
        const librarianCount = await UserModel.countDocuments({
          storeId: store._id,
          role: { $in: ['librarian', 'storeAdmin'] },
        });

        return {
          _id: store._id.toString(),
          code: store.code,
          name: store.name,
          description: store.description,
          status: store.status,
          city: store.address?.city,
          librarianCount,
          contactEmail: store.contactEmail,
          contactPhone: store.contactPhone,
          address: store.address,
          operatingHours: store.operatingHours,
          settings: store.settings,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        };
      })
    );

    return NextResponse.json(storesWithCounts);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des magasins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores
 * Create a new store
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.companyId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // User must be company admin to add a store
    if (!isCompanyAdmin(session)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Le nom et le code sont requis' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if code already exists for this company
    const existingStore = await StoreModel.findOne({
      companyId: new Types.ObjectId(session.companyId),
      code: body.code.toUpperCase(),
    });

    if (existingStore) {
      return NextResponse.json(
        { error: 'Un magasin avec ce code existe déjà' },
        { status: 409 }
      );
    }

    // Create store
    const store = await StoreModel.create({
      companyId: new Types.ObjectId(session.companyId),
      code: body.code.toUpperCase(),
      name: body.name,
      description: body.description,
      status: body.status || StoreStatus.Active,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      address: body.address,
      operatingHours: body.operatingHours,
      settings: body.settings,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du magasin' },
      { status: 500 }
    );
  }
}
