import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/app/lib/auth/session';
import connectDB from '@/app/lib/mongodb';
import { UserModel, UserRole } from '@/app/lib/models/User';
import { StoreModel } from '@/app/lib/models/Store';
import { Types } from 'mongoose';

export const runtime = 'nodejs';

// GET - List users for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only Admin, CompanyAdmin, and StoreAdmin can list users
    if (
      session.role !== UserRole.Admin &&
      session.role !== UserRole.CompanyAdmin &&
      session.role !== UserRole.StoreAdmin
    ) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await connectDB();

    // Build query based on role
    let query: any = {};

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');
    const roleParam = searchParams.get('role');

    if (session.role === UserRole.Admin) {
      // Platform Admin can see all users
      // Optionally filter by companyId from query params
      const companyId = searchParams.get('companyId');
      if (companyId) {
        query.companyId = new Types.ObjectId(companyId);
      }
    } else if (session.role === UserRole.CompanyAdmin) {
      // Company Admin sees users in their company
      query.companyId = new Types.ObjectId(session.companyId!);
    } else if (session.role === UserRole.StoreAdmin) {
      // Store Admin sees users in their store
      query.storeId = new Types.ObjectId(session.storeId!);
      // Allow filtering by role (default to showing only librarians)
      if (roleParam) {
        query.role = roleParam;
      } else {
        query.role = UserRole.Librarian;
      }
    }

    // Apply additional filters from query params (for StoreAdmin fetching librarians)
    if (storeIdParam && session.role === UserRole.StoreAdmin) {
      // StoreAdmin should only see their own store
      query.storeId = new Types.ObjectId(session.storeId!);
    }

    // Exclude deleted users (deletedAt is null or undefined)
    query.deletedAt = { $exists: false };

    // Fetch users with store information
    const users = await UserModel.find(query)
      .populate('storeId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Transform users for client
    const usersData = users.map((user: any) => ({
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      storeId: user.storeId?._id?.toString(),
      storeName: user.storeId?.name,
      storeCode: user.storeId?.code,
      sections: user.sections || [],
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));

    return NextResponse.json({ users: usersData });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only Admin, CompanyAdmin, and StoreAdmin can create users
    if (
      session.role !== UserRole.Admin &&
      session.role !== UserRole.CompanyAdmin &&
      session.role !== UserRole.StoreAdmin
    ) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      storeId,
      sections,
      avatarUrl,
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (session.role === UserRole.StoreAdmin && role !== UserRole.Librarian) {
      return NextResponse.json(
        { error: 'Les admins de magasin ne peuvent créer que des libraires' },
        { status: 403 }
      );
    }

    if (
      session.role === UserRole.CompanyAdmin &&
      (role === UserRole.Admin || role === UserRole.CompanyAdmin)
    ) {
      return NextResponse.json(
        {
          error:
            "Les admins d'entreprise ne peuvent pas créer d'admins de plateforme ou d'entreprise",
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // Validate store assignment for roles that require it
    if (
      (role === UserRole.StoreAdmin || role === UserRole.Librarian) &&
      !storeId
    ) {
      return NextResponse.json(
        { error: 'Un magasin doit être assigné pour ce rôle' },
        { status: 400 }
      );
    }

    // Verify store exists and belongs to the company
    if (storeId) {
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
    }

    // Create user
    const newUser = new UserModel({
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      companyId:
        role !== UserRole.Admin
          ? new Types.ObjectId(session.companyId!)
          : undefined,
      storeId: storeId ? new Types.ObjectId(storeId) : undefined,
      sections: sections || [],
      avatarUrl,
    });

    // Set password
    await newUser.setPassword(password);
    await newUser.save();

    // Populate store for response
    await newUser.populate('storeId', 'name code');

    const userData = {
      _id: newUser._id.toString(),
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      storeId: newUser.storeId?._id?.toString(),
      storeName: (newUser.storeId as any)?.name,
      storeCode: (newUser.storeId as any)?.code,
      sections: newUser.sections || [],
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json({ user: userData }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
