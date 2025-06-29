import { Module } from '@nestjs/common';
import { CardanoService } from './cardano.service';
import { ContractService } from './contracts/contract.service';

@Module({
  providers: [CardanoService, ContractService],
})
export class CardanoModule {}
