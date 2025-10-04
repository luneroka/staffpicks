import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import { UserModel, UserRole } from '@/app/lib/models/User';
import {
  CompanyModel,
  CompanyStatus,
  CompanyPlan,
} from '@/app/lib/models/Company';
import { StoreModel, StoreStatus } from '@/app/lib/models/Store';
import connectDB from '@/app/lib/mongodb';
import { checkRateLimit, generateSlug } from '../../utils/helpers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const {
      companyName,
      storeName,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    } = body;

    // Validation
    if (!companyName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Les mots de passe ne correspondent pas.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            'Le mot de passe doit contenir au moins 8 caractères, incluant un chiffre, une lettre minuscule et une lettre majuscule.',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà.' },
        { status: 409 }
      );
    }

    // Generate unique slug for company
    let slug = generateSlug(companyName);
    let slugExists = await CompanyModel.findBySlug(slug);
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(companyName)}-${counter}`;
      slugExists = await CompanyModel.findBySlug(slug);
      counter++;
    }

    // Create Company
    const company = await CompanyModel.create({
      name: companyName.trim(),
      slug,
      status: CompanyStatus.Trial,
      plan: CompanyPlan.Starter,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      contactEmail: email.toLowerCase(),
    });

    // Create Store (default name if not provided)
    const finalStoreName = storeName?.trim() || 'Magasin principal';
    const storeCode = generateSlug(finalStoreName)
      .toUpperCase()
      .replace(/-/g, '_');

    const store = await StoreModel.create({
      companyId: company._id,
      code: storeCode,
      name: finalStoreName,
      status: StoreStatus.Active,
      contactEmail: email.toLowerCase(),
    });

    // Create User (Company Admin)
    const user = new UserModel({
      companyId: company._id,
      storeId: store._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      role: UserRole.CompanyAdmin,
    });

    await user.setPassword(password);
    await user.save();

    // Create session
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );
    session.userId = user._id.toString();
    session.email = user.email;
    session.firstName = user.firstName;
    session.lastName = user.lastName;
    session.role = user.role;
    session.companyId = company._id.toString();
    session.companyName = company.name;
    session.storeId = store._id.toString();
    session.isLoggedIn = true;
    await session.save();

    // Return success with redirect URL
    return NextResponse.json(
      {
        success: true,
        redirectUrl: '/dashboard/settings/onboarding',
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte.' },
      { status: 500 }
    );
  }
}
