import {
  getModelForClass,
  prop,
  index,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import type { ReturnModelType } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export enum CompanyStatus {
  Active = 'active',
  Suspended = 'suspended',
  Trial = 'trial',
}

export enum CompanyPlan {
  Starter = 'starter',
  Professional = 'professional',
  Enterprise = 'enterprise',
}

@index({ slug: 1 }, { unique: true })
@index({ createdAt: -1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'companies',
    minimize: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Company {
  public readonly _id!: Types.ObjectId;

  /** Company name for display */
  @prop({ required: true, trim: true })
  public name!: string;

  /** Unique URL-friendly identifier */
  @prop({ required: true, trim: true, lowercase: true })
  public slug!: string;

  /** Company description/bio */
  @prop()
  public description?: string;

  /** Company logo URL */
  @prop()
  public logoUrl?: string;

  /** Account status */
  @prop({ required: true, enum: CompanyStatus, default: CompanyStatus.Trial })
  public status!: CompanyStatus;

  /** Subscription plan */
  @prop({ required: true, enum: CompanyPlan, default: CompanyPlan.Starter })
  public plan!: CompanyPlan;

  /** Trial end date */
  @prop()
  public trialEndsAt?: Date;

  /** Subscription billing information */
  @prop()
  public subscriptionId?: string;

  @prop()
  public billingEmail?: string;

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

  /** Company settings */
  @prop({ default: {} })
  public settings?: {
    allowPublicLists?: boolean;
    requireBookApproval?: boolean;
    maxUsersPerCompany?: number;
    maxStoresPerCompany?: number;
    customBranding?: boolean;
  };

  /** Timestamps */
  public createdAt?: Date;
  public updatedAt?: Date;

  // ---------- Static helpers ----------
  /** Find company by slug */
  static findBySlug(this: ReturnModelType<typeof Company>, slug: string) {
    return this.findOne({ slug: slug.toLowerCase() });
  }

  /** Get active companies */
  static getActive(this: ReturnModelType<typeof Company>) {
    return this.find({ status: CompanyStatus.Active });
  }

  /** Get companies by plan */
  static byPlan(this: ReturnModelType<typeof Company>, plan: CompanyPlan) {
    return this.find({ plan });
  }
}

export const CompanyModel =
  (global as any).CompanyModel || getModelForClass(Company);

// Cache the model for hot reload in development
if (process.env.NODE_ENV === 'development') {
  (global as any).CompanyModel = CompanyModel;
}
