import {
  getModelForClass,
  prop,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import type { Ref, ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { User } from './User';

class BookData {
  @prop({ required: true, trim: true })
  public title!: string;

  @prop({ type: () => [String], required: true })
  public authors!: string[];

  @prop() public cover?: string; // URL
  @prop() public description?: string;
  @prop() public pageCount?: number;
  @prop() public publisher?: string;

  @prop({
    type: () => Date,
    set: (v?: string | Date) => (v ? new Date(v) : v),
  })
  public publishDate?: Date;
}

// INDEXES
/** Unique ISBN per owner; fast dashboard listing by owner */
@index({ ownerUserId: 1, isbn: 1 }, { unique: true })
@index({ ownerUserId: 1, createdAt: -1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'books',
    minimize: true,
  },
})
export class Book {
  public readonly _id!: Types.ObjectId;

  /** The library owner (the librarian’s user id) */
  @prop({ ref: () => User, required: true })
  public ownerUserId!: Ref<User>;

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
  @prop() public fnacLink?: string;
  @prop() public recommendation?: string;

  public createdAt?: Date; // timestamps
  public updatedAt?: Date; // timestamps

  // ---------- Static helpers ----------
  /** Guard every query by owner (tenant boundary) */
  static scopedFor(
    this: ReturnModelType<typeof Book>,
    ownerUserId: Types.ObjectId | string
  ) {
    return this.find({ ownerUserId });
  }
}

export const BookModel = getModelForClass(Book);
