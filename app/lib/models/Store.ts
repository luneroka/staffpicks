import {
  getModelForClass,
  prop,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import type { Ref, ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { Company } from './Company';

export enum StoreStatus {
  Active = 'active',
  Inactive = 'inactive',
  Maintenance = 'maintenance',
}

@index({ companyId: 1, code: 1 }, { unique: true }) // Unique store code per company
@index({ companyId: 1, status: 1, createdAt: -1 }) // Active stores per company
@index({ companyId: 1, name: 1 }) // Search stores by name within company
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'stores',
    minimize: true,
  },
})
export class Store {
  public readonly _id!: Types.ObjectId;

  /** Company boundary for multi-tenancy */
  @prop({ ref: () => Company, required: true, index: true })
  public companyId!: Ref<Company>;

  /** Unique identifier within company (e.g., 'GENEVE_BALEXERT') */
  @prop({ required: true, trim: true, uppercase: true })
  public code!: string;

  /** Human-friendly display name */
  @prop({ required: true, trim: true })
  public name!: string;

  /** Optional description */
  @prop()
  public description?: string;

  /** Store status */
  @prop({ required: true, enum: StoreStatus, default: StoreStatus.Active })
  public status!: StoreStatus;

  /** Contact information */
  @prop()
  public contactEmail?: string;

  @prop()
  public contactPhone?: string;

  /** Address information */
  @prop()
  public address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  /** Store-specific settings */
  @prop({ default: {} })
  public settings?: {
    maxLibrarians?: number;
    allowPublicRecommendations?: boolean;
    customBranding?: {
      primaryColor?: string;
      logo?: string;
    };
  };

  /** Operating hours */
  @prop()
  public operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  /** Timestamps */
  public createdAt?: Date;
  public updatedAt?: Date;

  // ---------- Static helpers ----------
  /** Get all stores for a company */
  static forCompany(
    this: ReturnModelType<typeof Store>,
    companyId: Types.ObjectId | string,
    status?: StoreStatus
  ) {
    const query = { companyId };
    if (status) {
      return this.find({ ...query, status });
    }
    return this.find(query);
  }

  /** Get active stores for a company */
  static activeForCompany(
    this: ReturnModelType<typeof Store>,
    companyId: Types.ObjectId | string
  ) {
    return this.find({ companyId, status: StoreStatus.Active });
  }

  /** Find store by code within company */
  static findByCode(
    this: ReturnModelType<typeof Store>,
    companyId: Types.ObjectId | string,
    code: string
  ) {
    return this.findOne({ companyId, code: code.toUpperCase() });
  }
}

export const StoreModel = getModelForClass(Store);
