export interface CreateBillDto {
  creatorAddress: string;
  title: string;
  totalAmount: number;
  participantCount: number;
  description?: string;
  receiptImagePath?: string;
}

export interface UpdateBillDto extends CreateBillDto {}

export interface AddParticipantToBillDto {
  billId: string;
  participantAddress: string;
  amountPaid: number;
  paymentTxHash: string;
}

export enum BillStatus {
  Pending = "pending",
  Partial = "partial",
  Complete = "complete",
  Expired = "expired",
}
export enum TransactionStatus {
  Pending = "pending",
  Confirmed = "confirmed",
}
export enum ParticipantPaymentStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
}

export enum BillCurrency {
  ADA = "ADA",
  USD = "USD",
}

export interface Participant {
  address: string;
  amountPaid: number;
  paymentTxHash: string;
  paymentStatus: ParticipantPaymentStatus;
  paidAt: Date;
}

export interface Bill {
  _id?: string;
  creatorAddress: string;
  escrowAddress: string;
  title: string;
  totalAmount: number;
  participantCount: number;
  amountPerParticipant: number;
  currency: BillCurrency;
  status: BillStatus;
  description?: string;
  receiptImagePath?: string;
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BillPaymentResponse {
  unsignedTx: string;
  amount: number;
  escrowAddress: string;
}

export interface BillSettlementResponse {
  unsignedTx: string;
}
export enum CardanoNetwork {
  Mainnet = 1,
  Testnet = 0,
}
