import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill, BillDocument, Participant } from '../entities/bill.entity';

@Injectable()
export class BillRepository {
  constructor(
    @InjectModel(Bill.name)
    private readonly billModel: Model<BillDocument>,
  ) {}

  async create(billData: Partial<Bill>): Promise<BillDocument> {
    const bill = new this.billModel(billData);
    return bill.save();
  }

  async findById(id: string): Promise<BillDocument | null> {
    return this.billModel.findById(id).exec();
  }

  async findAll(): Promise<BillDocument[]> {
    return this.billModel.find().sort({ createdAt: -1 }).exec();
  }

  async update(
    id: string,
    updateData: Partial<Bill>,
  ): Promise<BillDocument | null> {
    return this.billModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<BillDocument | null> {
    return this.billModel.findByIdAndDelete(id).exec();
  }

  async findByCreator(creatorAddress: string): Promise<BillDocument[]> {
    return this.billModel
      .find({ creatorAddress })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByParticipant(participantAddress: string): Promise<BillDocument[]> {
    return this.billModel
      .find({ 'participants.address': participantAddress })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPendingBills(): Promise<BillDocument[]> {
    return this.billModel
      .find({ status: { $in: ['pending', 'partial'] } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async addParticipant(
    billId: string,
    participantData: Partial<Participant>,
  ): Promise<BillDocument> {
    const bill = await this.findById(billId);

    if (!bill) {
      throw new Error('Bill not found');
    }

    const existingParticipant = bill.participants.find(
      (p) => p.address === participantData.address,
    );

    if (existingParticipant) {
      throw new Error('Participant has already paid for this bill');
    }

    if (bill.participants.length >= bill.participantCount) {
      throw new Error('Bill is already complete');
    }

    bill.participants.push({
      address: participantData.address!,
      amountPaid: participantData.amountPaid!,
      paymentTxHash: participantData.paymentTxHash!,
      paidAt: participantData.paidAt || new Date(),
    });

    return bill.save();
  }

  async hasParticipantPaid(billId: string, address: string): Promise<boolean> {
    const bill = await this.findById(billId);
    if (!bill) return false;

    return bill.participants.some((p) => p.address === address);
  }

  async getParticipantByAddress(
    billId: string,
    address: string,
  ): Promise<Participant | undefined> {
    const bill = await this.findById(billId);
    if (!bill) return undefined;

    return bill.participants.find((p) => p.address === address);
  }

  async getBillProgress(billId: string): Promise<{
    paid: number;
    total: number;
    percentage: number;
    isComplete: boolean;
  } | null> {
    const bill = await this.findById(billId);
    if (!bill) return null;

    const paid = bill.participants.length;
    const total = bill.participantCount;
    const percentage = Math.round((paid / total) * 100);
    const isComplete = paid >= total;

    return { paid, total, percentage, isComplete };
  }

  async getTotalPaid(billId: string): Promise<number> {
    const bill = await this.findById(billId);
    if (!bill) return 0;

    return bill.participants.reduce((sum, p) => sum + p.amountPaid, 0);
  }

  async findBillsByStatus(status: string): Promise<BillDocument[]> {
    return this.billModel.find({ status }).sort({ createdAt: -1 }).exec();
  }

  async findRecentBills(limit: number = 10): Promise<BillDocument[]> {
    return this.billModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async findExpiredBills(): Promise<BillDocument[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.billModel
      .find({
        status: { $in: ['pending', 'partial'] },
        createdAt: { $lt: oneDayAgo },
      })
      .exec();
  }

  async getCreatorStats(creatorAddress: string): Promise<{
    totalBills: number;
    completedBills: number;
    totalAmount: number;
    averageAmount: number;
  }> {
    const bills = await this.findByCreator(creatorAddress);

    const totalBills = bills.length;
    const completedBills = bills.filter((b) => b.status === 'complete').length;
    const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const averageAmount = totalBills > 0 ? totalAmount / totalBills : 0;

    return { totalBills, completedBills, totalAmount, averageAmount };
  }

  async searchBills(query: string): Promise<BillDocument[]> {
    return this.billModel
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
