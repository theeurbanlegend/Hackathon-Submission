import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateBillDto {
  @IsString()
  creatorAddress: string;

  @IsString()
  escrowAddress: string;

  @IsString()
  title: string;

  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNumber()
  @Min(1)
  participantCount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  receiptImagePath?: string;
}

export class UpdateBillDto extends CreateBillDto {}

export class AddParticpantToBillDto {
  @IsString()
  billId: string;

  @IsString()
  participantAddress: string;

  @IsNumber()
  @IsPositive()
  amountPaid: number;

  @IsString()
  paymentTxHash: string;
}
