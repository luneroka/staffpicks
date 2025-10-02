import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/app/lib/auth/session';
import connectDB from '@/app/lib/mongodb';
import { CompanyModel } from '@/app/lib/models/Company';
import { UserRole } from '@/app/lib/models/User';

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

/**
 * GET /api/company
 * Fetch company information for the authenticated user
 */
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!session.companyId) {
      return NextResponse.json(
        { error: 'Aucune entreprise associée' },
        { status: 400 }
      );
    }

    await connectDB();
    const company = await CompanyModel.findById(session.companyId).lean();

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Return company data
    return NextResponse.json({
      _id: company._id.toString(),
      name: company.name,
      slug: company.slug,
      description: company.description,
      logoUrl: company.logoUrl,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      address: company.address,
      settings: company.settings,
      status: company.status,
      plan: company.plan,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/company
 * Update company information (Company Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only Company Admins and Platform Admins can update company info
    if (
      session.role !== UserRole.CompanyAdmin &&
      session.role !== UserRole.Admin
    ) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    if (!session.companyId) {
      return NextResponse.json(
        { error: 'Aucune entreprise associée' },
        { status: 400 }
      );
    }

    const body = await request.json();

    await connectDB();

    // Find the company
    const company = await CompanyModel.findById(session.companyId);

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.name !== undefined) {
      company.name = body.name;
      // Regenerate slug when name changes
      const newSlug = generateSlug(body.name);

      // Check if slug is unique (excluding current company)
      const existingCompany = await CompanyModel.findOne({
        slug: newSlug,
        _id: { $ne: company._id },
      });

      if (existingCompany) {
        // If slug exists, append a number
        let counter = 1;
        let uniqueSlug = `${newSlug}-${counter}`;
        while (
          await CompanyModel.findOne({
            slug: uniqueSlug,
            _id: { $ne: company._id },
          })
        ) {
          counter++;
          uniqueSlug = `${newSlug}-${counter}`;
        }
        company.slug = uniqueSlug;
      } else {
        company.slug = newSlug;
      }
    }
    if (body.description !== undefined) company.description = body.description;
    if (body.logoUrl !== undefined) company.logoUrl = body.logoUrl;
    if (body.contactEmail !== undefined)
      company.contactEmail = body.contactEmail;
    if (body.contactPhone !== undefined)
      company.contactPhone = body.contactPhone;

    // Update address
    if (body.address !== undefined) {
      company.address = {
        ...company.address,
        ...body.address,
      };
    }

    // Update settings
    if (body.settings !== undefined) {
      company.settings = {
        ...company.settings,
        ...body.settings,
      };
    }

    // Save the updated company
    await company.save();

    // Return updated company
    return NextResponse.json({
      success: true,
      company: {
        _id: company._id.toString(),
        name: company.name,
        slug: company.slug,
        description: company.description,
        logoUrl: company.logoUrl,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        address: company.address,
        settings: company.settings,
      },
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
