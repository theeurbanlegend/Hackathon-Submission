import { Module } from '@nestjs/common';
import { CardanoService } from './cardano.service';
import { CardanoController } from './cardano.controller';
import { ContractService } from './contracts/contract.service';

@Module({
  controllers: [CardanoController],
  providers: [CardanoService, ContractService],
})
export class CardanoModule {}
