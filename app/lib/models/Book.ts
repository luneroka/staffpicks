import {
  getModelForClass,
  prop,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import type { Ref, ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { User } from './User';
import { Company } from './Company';
import { Store } from './Store';

class BookData {
  @prop({ required: true, trim: true })
  public title!: string;

  @prop({ type: () => [String], required: true })
  public authors!: string[];

  @prop() public cover?: string; // URL
  @prop() public description?: string;
  @prop() public publisher?: string;
  @prop() public pageCount?: number;

  @prop({
    type: () => Date,
    set: (v?: string | Date) => (v ? new Date(v) : v),
  })
  public publishDate?: Date;
}

// INDEXES
/** Unique ISBN per user - each librarian can have their own version with custom data */
@index({ companyId: 1, ownerUserId: 1, isbn: 1 }, { unique: true })
/** Fast dashboard listing by owner within company */
@index({ companyId: 1, ownerUserId: 1, createdAt: -1 })
/** Store-scoped queries for StoreAdmin */
@index({ companyId: 1, storeId: 1, createdAt: -1 })
/** Librarian-scoped queries (assigned to or created by) */
@index({ companyId: 1, assignedTo: 1, createdAt: -1 })
/** Company-wide book search */
@index({ companyId: 1, createdAt: -1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'books',
    minimize: true,
  },
})
export class Book {
  public readonly _id!: Types.ObjectId;

  /** Company boundary for multi-tenancy */
  @prop({ ref: () => Company, required: true, index: true })
  public companyId!: Ref<Company>;

  /** Store boundary - which store this book belongs to */
  @prop({ ref: () => Store, required: true, index: true })
  public storeId!: Ref<Store>;

  /** The library owner (the librarian's user id) */
  @prop({ ref: () => User, required: true })
  public ownerUserId!: Ref<User>;

  /** Users this book is assigned to (for visibility by librarians) */
  @prop({ ref: () => User, type: () => [Types.ObjectId], default: [] })
  public assignedTo!: Types.ObjectId[];

  /** Sections this book is assigned to */
  @prop({ type: () => [String], default: [] })
  public sections!: string[];

  /** Audit: who created/last updated this record (can be owner or admin) */
  @prop({ ref: () => User, required: true })
  public createdBy!: Ref<User>;

  @prop({ ref: () => User })
  public updatedBy?: Ref<User>;

  @prop({ required: true, trim: true })
  public isbn!: string;

  @prop({ _id: false, required: true })
  public bookData!: BookData;

  @prop() public genre?: string;
  @prop() public tone?: string;
  @prop() public ageGroup?: string;
  @prop() public purchaseLink?: string;
  @prop() public recommendation?: string;

  public createdAt?: Date; // timestamps
  public updatedAt?: Date; // timestamps

  // ---------- Static helpers ----------
  /** Guard every query by company and owner (multi-tenant boundary) */
  static scopedFor(
    this: ReturnModelType<typeof Book>,
    companyId: Types.ObjectId | string,
    ownerUserId?: Types.ObjectId | string
  ) {
    const query = { companyId };
    if (ownerUserId) {
      return this.find({ ...query, ownerUserId });
    }
    return this.find(query);
  }

  /** Get all books for a company */
  static forCompany(
    this: ReturnModelType<typeof Book>,
    companyId: Types.ObjectId | string
  ) {
    return this.find({ companyId });
  }

  /** Get books for a specific store */
  static forStore(
    this: ReturnModelType<typeof Book>,
    companyId: Types.ObjectId | string,
    storeId: Types.ObjectId | string
  ) {
    return this.find({ companyId, storeId });
  }

  /** Get books visible to a librarian (created by them or assigned to them) */
  static forLibrarian(
    this: ReturnModelType<typeof Book>,
    companyId: Types.ObjectId | string,
    userId: Types.ObjectId | string
  ) {
    return this.find({
      companyId,
      $or: [
        { ownerUserId: userId },
        { createdBy: userId },
        { assignedTo: userId },
      ],
    });
  }
}

export const BookModel = (global as any).BookModel || getModelForClass(Book);

// Cache the model for hot reload in development
if (process.env.NODE_ENV === 'development') {
  (global as any).BookModel = BookModel;
}
