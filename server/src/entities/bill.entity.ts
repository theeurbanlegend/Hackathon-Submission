import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BillStatus {
  Pending = 'pending',
  Partial = 'partial',
  Complete = 'complete',
  Expired = 'expired',
}
export enum TransactionStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
}
export enum ParticipantPaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
}

export enum BillCurrency {
  ADA = 'ADA',
  USD = 'USD',
}

@Schema({ _id: false })
export class Participant {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  amountPaid: number;

  @Prop({ required: true })
  paymentTxHash: string;

  @Prop({
    enum: [
      ParticipantPaymentStatus.Pending,
      ParticipantPaymentStatus.Paid,
      ParticipantPaymentStatus.Failed,
    ],
    default: ParticipantPaymentStatus.Pending,
  })
  paymentStatus: string;

  @Prop({ required: true, default: Date.now })
  paidAt: Date;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({ timestamps: true })
export class Bill extends Document {
  @Prop({ required: true, index: true })
  creatorAddress: string;

  @Prop({ required: true, index: true })
  escrowAddress: string;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, min: 0.1, type: Number })
  totalAmount: number;

  @Prop({ required: true, min: 2, max: 50 })
  participantCount: number;

  @Prop({ required: true, min: 0.01, type: Number })
  amountPerParticipant: number;

  @Prop({ default: BillCurrency.ADA })
  currency: string;

  @Prop({
    enum: [
      BillStatus.Pending,
      BillStatus.Partial,
      BillStatus.Complete,
      BillStatus.Expired,
    ],
    default: BillStatus.Pending,
  })
  status: string;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop()
  receiptImagePath?: string;

  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  get paidCount(): number {
    return this.participants.length;
  }

  get totalPaid(): number {
    return this.participants.reduce((sum, p) => sum + p.amountPaid, 0);
  }

  get isComplete(): boolean {
    return this.participants.length >= this.participantCount;
  }

  get progressPercentage(): number {
    return Math.round((this.participants.length / this.participantCount) * 100);
  }
}

export const BillSchema = SchemaFactory.createForClass(Bill);

BillSchema.index({ creatorAddress: 1, createdAt: -1 });
BillSchema.index({ 'participants.address': 1 });
BillSchema.index({ status: 1, createdAt: -1 });
BillSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

BillSchema.pre('save', function (next) {
  this.amountPerParticipant = Math.floor(
    this.totalAmount / this.participantCount,
  );

  if (this.participants.length === 0) {
    this.status = BillStatus.Pending;
  } else if (this.participants.length < this.participantCount) {
    this.status = BillStatus.Partial;
  } else {
    this.status = BillStatus.Complete;
  }

  this.updatedAt = new Date();

  next();
});

export type BillDocument = Bill & Document;
