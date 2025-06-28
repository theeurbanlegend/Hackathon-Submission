import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from 'src/entities/bill.entity';
import { BillRepository } from './bill.repository';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Bill.name,
        schema: BillSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [BillRepository],
  exports: [BillRepository],
})
export class RepositoryModule {}
