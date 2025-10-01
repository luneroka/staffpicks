import {
  getModelForClass,
  prop,
  index,
  modelOptions,
  DocumentType,
} from '@typegoose/typegoose';
import type { Ref, ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { Company } from './Company';
import { Store } from './Store';

export enum UserRole {
  Admin = 'admin', // Platform admin (manages all companies and users)
  CompanyAdmin = 'companyAdmin', // Company admin (sets up company + can add store admins and librarians)
  StoreAdmin = 'storeAdmin', // Store admin (can manage their librarians within their store)
  Librarian = 'librarian', // Librarian (manages books and lists for their store)
}

@index({ email: 1 }, { unique: true })
@index({ companyId: 1, role: 1, createdAt: -1 }) // Fast company user lookup
@index({ companyId: 1, storeId: 1 }) // Users by company and store
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.passwordHash; // never leak hash
        delete ret.__v;
        return ret;
      },
    },
  },
})
export class User {
  /** Company association - null only for Platform Admin */
  @prop({ ref: () => Company, required: false, index: true })
  public companyId?: Ref<Company>;

  /** Display name */
  @prop({ required: true, trim: true })
  public name!: string;

  /** Unique login identifier */
  @prop({ required: true, lowercase: true, trim: true })
  public email!: string;

  /** Bcrypt hash; stored, never exposed */
  @prop({ required: true, select: false })
  public passwordHash!: string;

  /** Access control for dashboards */
  @prop({ required: true, enum: UserRole, default: UserRole.Librarian })
  public role!: UserRole;

  /** Store assignment - required for StoreAdmin and Librarian roles **/
  @prop({ ref: () => Store })
  public storeId?: Ref<Store>;

  /** Optional avatar for UI */
  @prop()
  public avatarUrl?: string;

  /** Timestamps (auto via schemaOptions.timestamps) */
  public createdAt?: Date;
  public updatedAt?: Date;

  /** Failed login tracking for rate limiting */
  @prop({ default: 0 })
  public failedLoginAttempts!: number;

  @prop()
  public lockedUntil?: Date;

  @prop()
  public lastLoginAt?: Date;

  @prop()
  public lastLoginIP?: string;

  // ---------- Instance helpers ----------
  public async setPassword(this: DocumentType<User>, plain: string) {
    const rounds = 12;
    this.passwordHash = await bcrypt.hash(plain, rounds);
  }

  public async comparePassword(
    this: DocumentType<User>,
    plain: string
  ): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash);
  }

  /** Check if user can manage another user based on role hierarchy */
  public canManage(
    this: DocumentType<User>,
    targetUser: DocumentType<User>
  ): boolean {
    // Platform Admin can manage everyone
    if (this.role === UserRole.Admin) return true;

    // Company Admin can manage StoreAdmins and Librarians in their company
    if (this.role === UserRole.CompanyAdmin) {
      return (
        this.companyId?.toString() === targetUser.companyId?.toString() &&
        (targetUser.role === UserRole.StoreAdmin ||
          targetUser.role === UserRole.Librarian)
      );
    }

    // Store Admin can manage Librarians in their store
    if (this.role === UserRole.StoreAdmin) {
      return (
        this.storeId?.toString() === targetUser.storeId?.toString() &&
        targetUser.role === UserRole.Librarian
      );
    }

    // Librarians cannot manage other users
    return false;
  }

  /** Get role display name */
  public getRoleDisplayName(this: DocumentType<User>): string {
    switch (this.role) {
      case UserRole.Admin:
        return 'Administrateur Plateforme';
      case UserRole.CompanyAdmin:
        return 'Administrateur Entreprise';
      case UserRole.StoreAdmin:
        return 'Administrateur Magasin';
      case UserRole.Librarian:
        return 'Libraire';
      default:
        return 'Utilisateur';
    }
  }

  /** Check if account is currently locked */
  public isLocked(this: DocumentType<User>): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  /** Record failed login attempt */
  public async recordFailedLogin(this: DocumentType<User>): Promise<void> {
    this.failedLoginAttempts += 1;

    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    const lockoutMinutes = parseInt(
      process.env.LOCKOUT_DURATION_MINUTES || '15'
    );

    if (this.failedLoginAttempts >= maxAttempts) {
      this.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    }

    await this.save();
  }

  /** Record successful login */
  public async recordSuccessfulLogin(
    this: DocumentType<User>,
    ip?: string
  ): Promise<void> {
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLoginAt = new Date();
    if (ip) this.lastLoginIP = ip;
    await this.save();
  }

  // ---------- Static helpers ----------
  /** Get all users for a company */
  static forCompany(
    this: ReturnModelType<typeof User>,
    companyId: Types.ObjectId | string,
    role?: UserRole
  ) {
    const query = { companyId };
    if (role) {
      return this.find({ ...query, role });
    }
    return this.find(query);
  }

  /** Get all users for a store (librarians and store admins) */
  static forStore(
    this: ReturnModelType<typeof User>,
    storeId: Types.ObjectId | string,
    role?: UserRole.StoreAdmin | UserRole.Librarian
  ) {
    const query = { storeId };
    if (role) {
      return this.find({ ...query, role });
    }
    // Return both store admins and librarians for the store
    return this.find({
      ...query,
      role: { $in: [UserRole.StoreAdmin, UserRole.Librarian] },
    });
  }

  /** Get librarians for a store */
  static librariansForStore(
    this: ReturnModelType<typeof User>,
    storeId: Types.ObjectId | string
  ) {
    return this.find({ storeId, role: UserRole.Librarian });
  }

  /** Get store admins for a store */
  static storeAdminsForStore(
    this: ReturnModelType<typeof User>,
    storeId: Types.ObjectId | string
  ) {
    return this.find({ storeId, role: UserRole.StoreAdmin });
  }

  /** Get company admins for a company */
  static companyAdminsFor(
    this: ReturnModelType<typeof User>,
    companyId: Types.ObjectId | string
  ) {
    return this.find({ companyId, role: UserRole.CompanyAdmin });
  }

  /** Get store admins for a company */
  static storeAdminsFor(
    this: ReturnModelType<typeof User>,
    companyId: Types.ObjectId | string
  ) {
    return this.find({ companyId, role: UserRole.StoreAdmin });
  }
}

export const UserModel = getModelForClass(User);

// ---------- Types to use with iron-session ----------
export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  companyId?: string;
  storeId?: string;
};
