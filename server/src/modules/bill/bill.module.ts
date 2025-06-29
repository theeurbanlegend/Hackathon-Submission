import { Module } from '@nestjs/common';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { CardanoService } from '../cardano/cardano.service';
import { ContractService } from '../cardano/contracts/contract.service';

@Module({
  controllers: [BillController],
  providers: [BillService, CardanoService, ContractService],
})
export class BillModule {}
