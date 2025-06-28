import { HttpException, Injectable } from '@nestjs/common';
import { BillRepository } from 'src/repository/bill.repository';
import {
  AddParticpantToBillDto,
  CreateBillDto,
  UpdateBillDto,
} from './dto/bill.dto';
import { BillStatus } from 'src/entities/bill.entity';

@Injectable()
export class BillService {
  constructor(private readonly billRepository: BillRepository) {}

  async createBill(billData: CreateBillDto) {
    try {
      return await this.billRepository.create({
        ...billData,
        status: BillStatus.Pending,
        amountPerParticipant: billData.totalAmount / billData.participantCount,
        participants: [],
      });
    } catch (error) {
      throw new HttpException('Failed to create bill', error.status || 500);
    }
  }

  async getBillById(id: string) {
    const bill = await this.billRepository.findById(id);
    if (!bill) {
      throw new HttpException('Bill not found', 404);
    }
    return bill;
  }

  async getBillsByCreator(creatorAddress: string) {
    const bills = await this.billRepository.findByCreator(creatorAddress);
    if (bills.length === 0) {
      throw new HttpException('No bills found for this creator', 404);
    }
    return bills;
  }

  async getBillsByParticipant(participantAddress: string) {
    const bills =
      await this.billRepository.findByParticipant(participantAddress);
    if (bills.length === 0) {
      throw new HttpException('No bills found for this participant', 404);
    }
    return bills;
  }

  async updateBill(id: string, updateData: UpdateBillDto) {
    const bill = await this.billRepository.update(id, updateData);
    if (!bill) {
      throw new HttpException('Bill not found', 404);
    }
    return bill;
  }

  async addParticipantToBill(data: AddParticpantToBillDto) {
    const updatedBill = await this.billRepository.addParticipant(data.billId, {
      address: data.participantAddress,
      amountPaid: data.amountPaid,
      paymentTxHash: data.paymentTxHash,
      paidAt: new Date(),
    });
    if (!updatedBill) {
      throw new HttpException('Failed to add participant', 500);
    }
    return updatedBill;
  }
}
