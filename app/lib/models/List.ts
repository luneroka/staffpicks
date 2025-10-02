import {
  getModelForClass,
  prop,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import type { Ref, ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import type { User } from './User';
import { Company } from './Company';

export enum ListVisibility {
  Draft = 'draft',
  Unlisted = 'unlisted',
  Public = 'public',
}

class ListItem {
  @prop({ ref: 'Book', required: true })
  public bookId!: Ref<any>;

  /** Manual order (lower first) **/
  @prop({ required: true })
  public position!: number;

  /** Timestamp for analytics / sorting if needed */
  @prop({ default: () => new Date() })
  public addedAt?: Date;
}

/**
 * Pretty URLs per company and owner; allow reusing slug after soft delete.
 * The first index enforces uniqueness only when `deletedAt` is not set.
 */
@index(
  { companyId: 1, ownerUserId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } }
)
// Dashboards (active lists by company)
@index({ companyId: 1, ownerUserId: 1, visibility: 1, updatedAt: -1 })
// Company-wide lists
@index({ companyId: 1, visibility: 1, updatedAt: -1 })
// Trash (fast lookup by company, owner & deletedAt)
@index({ companyId: 1, ownerUserId: 1, deletedAt: 1, updatedAt: -1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'lists',
    minimize: true,
  },
})
export class List {
  public readonly _id!: Types.ObjectId;

  /** Company boundary for multi-tenancy */
  @prop({ ref: () => Company, required: true, index: true })
  public companyId!: Ref<Company>;

  /** Tenant boundary: the librarian who owns the list */
  @prop({ ref: 'User', required: true })
  public ownerUserId!: Ref<any>;

  /** Who created / last updated (owner or admin) */
  @prop({ ref: 'User', required: true })
  public createdBy!: Ref<any>;

  @prop({ ref: 'User' })
  public updatedBy?: Ref<any>;

  /** Human title & optional URL slug (unique per owner when not deleted) */
  @prop({ required: true, trim: true })
  public title!: string;

  @prop({ required: true, trim: true, lowercase: true })
  public slug!: string;

  /** Optional description shown atop the list */
  @prop()
  public description?: string;

  /** Presentation */
  @prop()
  public coverImage?: string;

  /** Status / publishing window */
  @prop({ required: true, enum: ListVisibility, default: ListVisibility.Draft })
  public visibility!: ListVisibility;

  @prop()
  public publishAt?: Date;

  @prop()
  public unpublishAt?: Date;

  /** Items: embedded refs to Book with ordering */
  @prop({ type: () => [ListItem], _id: false, default: [] })
  public items!: ListItem[];

  /** Soft delete marker; if set, the list is in the Trash */
  @prop()
  public deletedAt?: Date;

  /** Timestamps via schemaOptions */
  public createdAt?: Date;
  public updatedAt?: Date;

  // ---------- Static helpers ----------
  /** Guard every query by company and owner (multi-tenant boundary) */
  static scopedFor(
    this: ReturnModelType<typeof List>,
    companyId: Types.ObjectId | string,
    ownerUserId?: Types.ObjectId | string
  ) {
    const query = { companyId, deletedAt: { $exists: false } };
    if (ownerUserId) {
      return this.find({ ...query, ownerUserId });
    }
    return this.find(query);
  }

  /** Get all lists for a company */
  static forCompany(
    this: ReturnModelType<typeof List>,
    companyId: Types.ObjectId | string,
    visibility?: ListVisibility
  ) {
    const query = { companyId, deletedAt: { $exists: false } };
    if (visibility) {
      return this.find({ ...query, visibility });
    }
    return this.find(query);
  }

  /** Get public lists for a company */
  static publicForCompany(
    this: ReturnModelType<typeof List>,
    companyId: Types.ObjectId | string
  ) {
    return this.find({
      companyId,
      visibility: ListVisibility.Public,
      deletedAt: { $exists: false },
    });
  }
}

export const ListModel = (global as any).ListModel || getModelForClass(List);

// Cache the model for hot reload in development
if (process.env.NODE_ENV === 'development') {
  (global as any).ListModel = ListModel;
}
