import { ListModel } from '@/app/lib/models/List';
import { Types } from 'mongoose';

/**
 * Helper function to generate URL-friendly slug from string
 */
export function generateSlug(string: string): string {
  return string
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Helper function to ensure slug uniqueness
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  companyId: Types.ObjectId,
  ownerUserId: Types.ObjectId
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ListModel.findOne({
      companyId,
      ownerUserId,
      slug,
      deletedAt: { $exists: false },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Helper function to check Rate limit
 */
export function checkRateLimit(ip: string): boolean {
  // Simple in-memory rate limiting for signups (per IP)
  const signupAttempts = new Map<string, { count: number; resetAt: number }>();
  const MAX_SIGNUP_ATTEMPTS = 3;
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

  const now = Date.now();
  const record = signupAttempts.get(ip);

  if (!record || now > record.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_SIGNUP_ATTEMPTS) {
    return false;
  }

  record.count += 1;
  return true;
}
