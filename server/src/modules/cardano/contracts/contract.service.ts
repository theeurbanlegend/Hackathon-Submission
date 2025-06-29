import { Injectable } from '@nestjs/common';
import { byteString, conStr, deserializeAddress } from '@meshsdk/core';
import * as fs from 'fs';
import * as path from 'path';
import { applyParamsToScript, serializePlutusScript } from '@meshsdk/core';
import { CardanoNetwork } from 'src/common/constants';
import { BillDocument } from 'src/entities/bill.entity';

@Injectable()
export class ContractService {
  private scriptAddress: string;
  private scriptCbor: string;
  constructor() {
    this.init();
  }

  getScriptAddress(): string {
    return this.scriptAddress;
  }

  getContractCbor(): string {
    return this.scriptCbor;
  }

  private init() {
    if (!this.scriptAddress || !this.scriptCbor) {
      try {
        console.log('Initializing script address and cbor...');
        const blueprint = JSON.parse(
          fs.readFileSync(
            path.join(
              process.cwd(),
              'src/modules/cardano/contracts',
              'plutus.json',
            ),
            'utf-8',
          ),
        );

        this.scriptCbor = applyParamsToScript(
          blueprint.validators[0].compiledCode,
          [],
        );

        this.scriptAddress = serializePlutusScript(
          { code: this.scriptCbor, version: 'V3' },
          undefined,
          CardanoNetwork.Testnet,
        ).address;
      } catch (error) {
        console.error('Error initializing contract service:', error);
        throw new Error('Failed to initialize contract service');
      }
    }
  }

  getPaymentVerificationKeyFromBech32(bech32Address: string): string {
    try {
      const { pubKeyHash } = deserializeAddress(bech32Address);
      return pubKeyHash;
    } catch (error) {
      console.error('Error extracting payment verification key:', error);
      throw new Error('Invalid Bech32 address format');
    }
  }
  buildEscrowDatum(bill: BillDocument) {
    try {
      if (!bill) {
        throw new Error('Bill is required to build escrow datum');
      }
      return conStr(0, [
        byteString(
          Buffer.from((bill?._id || '').toString(), 'utf8').toString('hex'),
        ),
        byteString(
          this.getPaymentVerificationKeyFromBech32(bill.creatorAddress),
        ),
      ]);
    } catch (error) {
      console.error('Error building escrow datum:', error);
      throw new Error('Failed to build escrow datum');
    }
  }

  getEscrowDataFromDatum(datum: any) {
    try {
      if (!datum || !datum.fields || datum.fields.length < 6) {
        throw new Error('Invalid datum structure');
      }
      return {
        _id: Buffer.from(datum.fields[0], 'hex').toString('utf8'),
        creatorAddress: Buffer.from(datum.fields[1], 'hex').toString('utf8'),
      };
    } catch (error) {
      console.error('Error extracting escrow data from datum:', error);
      throw new Error('Failed to extract escrow data from datum');
    }
  }

  buildSettleRedeemer(billId: string) {
    return conStr(0, [byteString(Buffer.from(billId, 'utf8').toString('hex'))]);
  }

  buildRefundRedeemer(billId: string) {
    return {
      alternative: 1,
      fields: [billId],
    };
  }
}
