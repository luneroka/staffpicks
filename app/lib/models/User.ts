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
  SuperAdmin = 'superAdmin', // Platform admin (manages all companies)
  CompanyAdmin = 'companyAdmin', // Company admin (manages librarians within company)
  Librarian = 'librarian',
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
  /** Company association - null only for SuperAdmin */
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

  /** Store assignment - only for Librarians **/
  @prop({ ref: () => Store })
  public storeId?: Ref<Store>;

  /** Optional avatar for UI */
  @prop()
  public avatarUrl?: string;

  /** Timestamps (auto via schemaOptions.timestamps) */
  public createdAt?: Date;
  public updatedAt?: Date;

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

  /** Get all librarians for a store */
  static forStore(
    this: ReturnModelType<typeof User>,
    storeId: Types.ObjectId | string
  ) {
    return this.find({ storeId, role: UserRole.Librarian });
  }

  /** Get company admins for a company */
  static companyAdminsFor(
    this: ReturnModelType<typeof User>,
    companyId: Types.ObjectId | string
  ) {
    return this.find({ companyId, role: UserRole.CompanyAdmin });
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
