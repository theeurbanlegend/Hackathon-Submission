import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillRepository } from 'src/repository/bill.repository';
import {
  AddParticpantToBillDto,
  CreateBillDto,
  UpdateBillDto,
} from './dto/bill.dto';
import {
  BillStatus,
  ParticipantPaymentStatus,
  TransactionStatus,
} from 'src/entities/bill.entity';
import { CardanoService } from '../cardano/cardano.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BillService {
  constructor(
    private readonly billRepository: BillRepository,
    private cardanoService: CardanoService,
  ) {}

  async createBill(billData: CreateBillDto) {
    try {
      return await this.billRepository.create({
        ...billData,
        status: BillStatus.Pending,
        amountPerParticipant: billData.totalAmount / billData.participantCount,
        escrowAddress: this.cardanoService.getScriptAddress(),
        participants: [],
      });
    } catch (error) {
      console.error('Error creating bill:', error);
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

  async getBillByParticipantAddress(
    billId: string,
    participantAddress: string,
  ): Promise<any> {
    const bill = await this.billRepository.findByIdAndParticipant(
      billId,
      participantAddress,
    );
    if (!bill) {
      throw new HttpException('Bill not found for this participant', 404);
    }
    return bill;
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

  async hasParticipantPaid(
    billId: string,
    participantAddress: string,
  ): Promise<boolean> {
    const bill = await this.billRepository.findById(billId);
    if (!bill) {
      throw new HttpException('Bill not found', 404);
    }
    return bill.participants.some(
      (p) => p.address === participantAddress && p.amountPaid > 0,
    );
  }

  async buildPaymentTransaction(billId: string, participantAddress: string) {
    if (!billId || !participantAddress) {
      throw new BadRequestException(
        'Bill ID and participant address are required',
      );
    }

    const bill = await this.billRepository.findById(billId);

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (await this.hasParticipantPaid(billId, participantAddress)) {
      throw new BadRequestException('Participant has already paid');
    }

    const { unsignedTx } = await this.cardanoService.buildPaymentTransaction(
      bill,
      participantAddress,
    );

    return {
      unsignedTx,
      amount: bill.amountPerParticipant,
      escrowAddress: this.cardanoService.getScriptAddress(),
    };
  }

  async buildSettleTransaction(billId: string) {
    if (!billId) {
      throw new BadRequestException('Bill ID is required');
    }

    const bill = await this.billRepository.findById(billId);

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.status !== BillStatus.Complete) {
      throw new BadRequestException('Bill is not in a settleable state');
    }

    const { unsignedTx } = await this.cardanoService.buildSettleTransaction(
      billId,
      bill.creatorAddress,
    );

    return { unsignedTx };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingBills() {
    try {
      console.log('Checking pending bills...');
      const pendingBills = await this.billRepository.findPendingBills();
      const completedUnconfirmedBills =
        await this.billRepository.findCompletedUnconfirmedBills();
      for (const bill of [...pendingBills, ...completedUnconfirmedBills]) {
        const unconfirmedParticipants = bill.participants.filter(
          (p) => p.paymentStatus !== ParticipantPaymentStatus.Paid,
        );
        if (unconfirmedParticipants.length === 0) {
          continue;
        }
        for (const participant of unconfirmedParticipants) {
          const txStatus = await this.cardanoService.getTransactionStatus(
            participant.paymentTxHash,
          );
          if (txStatus === TransactionStatus.Confirmed) {
            participant.paymentStatus = ParticipantPaymentStatus.Paid;
          }
        }
        await this.billRepository.update(bill._id as string, {
          participants: bill.participants,
        });
      }
      console.log('Pending bills check completed.');
    } catch (error) {
      console.error('Error checking pending bills:', error);
    }
  }
}
