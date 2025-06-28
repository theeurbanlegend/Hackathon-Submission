import { Body, Controller, Get, HttpException, Post } from '@nestjs/common';
import { BillService } from './bill.service';
import { AddParticpantToBillDto, CreateBillDto } from './dto/bill.dto';

@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Get('bills/by-creator/:creatorAddress')
  async getBillsByCreator(@Body('creatorAddress') creatorAddress: string) {
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

  @Get('bills/by-participant/:participantAddress')
  async getBillsByParticipant(
    @Body('participantAddress') participantAddress: string,
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

  @Get('bill/:id')
  async getBillById(@Body('id') id: string) {
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
}
