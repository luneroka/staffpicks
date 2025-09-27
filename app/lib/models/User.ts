import {
  getModelForClass,
  prop,
  index,
  modelOptions,
  DocumentType,
} from '@typegoose/typegoose';
import bcrypt from 'bcrypt';

export enum UserRole {
  Admin = 'admin',
  Librarian = 'librarian',
}

export enum StoreCode {
  GeneveBalexert = 'GENEVE_BALEXERT',
  GeneveRives = 'GENEVE_RIVES',
  Lausanne = 'LAUSANNE',
}

/** Human-friendly store labels for UI */
export const StoreLabels: Record<StoreCode, string> = {
  [StoreCode.GeneveBalexert]: 'Genève - Balexert',
  [StoreCode.GeneveRives]: 'Genève - Rives',
  [StoreCode.Lausanne]: 'Lausanne',
};

@index({ email: 1 }, { unique: true })
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

  /** Store membership **/
  @prop({ required: true, enum: StoreCode })
  public store!: StoreCode;

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
}

export const UserModel = getModelForClass(User);

// ---------- Types to use with iron-session ----------
export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  store: StoreCode;
};
