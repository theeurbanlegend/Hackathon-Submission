import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import { BillService } from './bill.service';
import { AddParticpantToBillDto, CreateBillDto } from './dto/bill.dto';

@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Get('by-creator/:creatorAddress')
  async getBillsByCreator(@Param('creatorAddress') creatorAddress: string) {
    try {
      const bills = await this.billService.getBillsByCreator(creatorAddress);
      return { message: 'Bills retrieved successfully', bills };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to retrieve bills by creator',
        error.status || 500,
      );
    }
  }

  @Get('by-participant/:participantAddress')
  async getBillsByParticipant(
    @Param('participantAddress') participantAddress: string,
  ) {
    try {
      const bills =
        await this.billService.getBillsByParticipant(participantAddress);
      return { message: 'Bills retrieved successfully', bills };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to retrieve bills by participant',
        error.status || 500,
      );
    }
  }

  @Get('bill/by-participant/:billId/:participantAddress')
  async getBillByParticipantAddress(
    @Param('billId') billId: string,
    @Param('participantAddress') participantAddress: string,
  ) {
    try {
      const bill = await this.billService.getBillByParticipantAddress(
        billId,
        participantAddress,
      );
      return { message: 'Bill retrieved successfully', bill };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to retrieve bill by participant address',
        error.status || 500,
      );
    }
  }

  @Get('payment-status/:billId/:participantAddress')
  async getParticipantPaymentStatus(
    @Param('billId') billId: string,
    @Param('participantAddress') participantAddress: string,
  ) {
    try {
      const status = await this.billService.hasParticipantPaid(
        billId,
        participantAddress,
      );
      return { message: 'Payment status retrieved successfully', status };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to retrieve payment status',
        error.status || 500,
      );
    }
  }

  @Get(':id')
  async getBillById(@Param('id') id: string) {
    try {
      const bill = await this.billService.getBillById(id);
      return { message: 'Bill retrieved successfully', bill };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to retrieve bill by ID',
        error.status || 500,
      );
    }
  }

  @Post('create')
  async createBill(@Body() createBillDto: CreateBillDto) {
    try {
      const bill = await this.billService.createBill(createBillDto);
      return { message: 'Bill created successfully', bill };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to create bill',
        error.status || 500,
      );
    }
  }

  @Post('add-participant')
  async addParticipantToBill(
    @Body() addParticipantDto: AddParticpantToBillDto,
  ) {
    try {
      const result =
        await this.billService.addParticipantToBill(addParticipantDto);
      return { message: 'Participant added to bill successfully', result };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Failed to add participant to bill',
        error.status || 500,
      );
    }
  }

  @Post(':billId/payment')
  async buildPaymentTransaction(
    @Param('billId') billId: string,
    @Body() { participantAddress }: { participantAddress: string },
  ) {
    return this.billService.buildPaymentTransaction(billId, participantAddress);
  }

  @Post(':billId/settle')
  async buildSettleTransaction(@Param('billId') billId: string) {
    return this.billService.buildSettleTransaction(billId);
  }
}
