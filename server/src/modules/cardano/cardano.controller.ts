import { Body, Controller, Post } from '@nestjs/common';
import { CardanoService } from './cardano.service';

@Controller('cardano')
export class CardanoController {
  constructor(private readonly cardanoService: CardanoService) {}
  @Post('test-sign-submit-tx')
  async testSignAndSubmitTx(
    @Body() body: { unsignedTx: string },
  ): Promise<{ txHash: string }> {
    return this.cardanoService.testSignAndSubmitTx(body.unsignedTx);
  }

  @Post('test-submit-settle-tx')
  async testSubmitSettleTx(
    @Body() body: { billId: string; creatorAddress: string },
  ): Promise<{ txHash: string }> {
    return this.cardanoService.testSubmitSettleTx(
      body.billId,
      body.creatorAddress,
    );
  }
}
