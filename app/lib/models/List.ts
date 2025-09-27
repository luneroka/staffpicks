import {
  getModelForClass,
  prop,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import type { User } from './User';
import type { Book } from './Book';

export enum ListVisibility {
  Draft = 'draft',
  Unlisted = 'unlisted',
  Public = 'public',
}

class ListItem {
  @prop({ ref: () => ({} as unknown as typeof Book), required: true })
  public bookId!: Ref<Book>;

  /** Manual order (lower first) **/
  @prop({ required: true })
  public position!: number;

  /** Timestamp for analytics / sorting if needed */
  @prop({ default: () => new Date() })
  public addedAt?: Date;
}

/**
 * Pretty URLs per owner; allow reusing slug after soft delete.
 * The first index enforces uniqueness only when `deletedAt` is not set.
 */
@index(
  { ownerUserId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } }
)
// Dashboards (active lists)
@index({ ownerUserId: 1, visibility: 1, updatedAt: -1 })
// Trash (fast lookup by owner & deletedAt)
@index({ ownerUserId: 1, deletedAt: 1, updatedAt: -1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'lists',
    minimize: true,
  },
})
export class List {
  public readonly _id!: Types.ObjectId;

  /** Tenant boundary: the librarian who owns the list */
  @prop({ ref: () => ({} as unknown as typeof User), required: true })
  public ownerUserId!: Ref<User>;

  /** Who created / last updated (owner or admin) */
  @prop({ ref: () => ({} as unknown as typeof User), required: true })
  public createdBy!: Ref<User>;

  @prop({ ref: () => ({} as unknown as typeof User) })
  public updatedBy?: Ref<User>;

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
}

export const ListModel = getModelForClass(List);
