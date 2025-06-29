import { Injectable } from '@nestjs/common';
import { ContractService } from './contracts/contract.service';
import { BillDocument, TransactionStatus } from 'src/entities/bill.entity';
import { BlockfrostProvider, MeshTxBuilder, MeshWallet } from '@meshsdk/core';
import { ConfigService } from '@nestjs/config';
import { BlockfrostUtxo } from 'src/common/types/blockfrost';
import * as cbor from 'cbor';
import * as fs from 'fs';
import * as path from 'path';
import { adaToLovelace } from 'src/common/utils/cardano';

@Injectable()
export class CardanoService {
  async onModuleInit() {
    // Uncomment to generate wallets for testing
    await this.getAndSaveTwoWallets();
  }
  private wallet0: MeshWallet;
  private wallet1: MeshWallet;
  private blockfrostProvider: BlockfrostProvider;
  constructor(
    private readonly contractService: ContractService,
    private readonly configService: ConfigService,
  ) {
    this.blockfrostProvider = new BlockfrostProvider(
      configService.get<string>('BLOCKFROST_PROJECT_ID') || '',
    );
  }

  getScriptAddress() {
    try {
      return this.contractService.getScriptAddress();
    } catch (error) {
      throw new Error(`Failed to get script address: ${error.message}`);
    }
  }

  async buildPaymentTransaction(
    bill: BillDocument,
    participantAddress: string,
  ): Promise<{ unsignedTx: string }> {
    try {
      const datum = this.contractService.buildEscrowDatum(bill);

      const utxos = (await this.blockfrostProvider.get(
        `addresses/${participantAddress}/utxos`,
      )) as BlockfrostUtxo[];

      const txBuilder = new MeshTxBuilder();

      const tx = await txBuilder
        .txOut(this.contractService.getScriptAddress(), [
          {
            quantity: String(adaToLovelace(bill.amountPerParticipant)),
            unit: 'lovelace',
          },
        ])
        .txOutInlineDatumValue(datum, 'JSON')
        .changeAddress(participantAddress)
        .selectUtxosFrom(
          utxos.map((utxo) => ({
            input: {
              outputIndex: utxo.output_index,
              txHash: utxo.tx_hash,
            },
            output: { address: utxo.address, amount: utxo.amount },
          })),
        )
        .complete();

      return {
        unsignedTx: tx,
      };
    } catch (error) {
      console.error('Error building payment transaction:', error);
      throw new Error(`Failed to build payment transaction: ${error.message}`);
    }
  }

  async buildSettleTransaction(
    billId: string,
    creatorAddress: string,
  ): Promise<{ unsignedTx: string }> {
    try {
      const redeemer = this.contractService.buildSettleRedeemer(billId);

      const utxos = await this.blockfrostProvider.fetchAddressUTxOs(
        this.contractService.getScriptAddress(),
      );

      const creatorUtxos =
        await this.blockfrostProvider.fetchAddressUTxOs(creatorAddress);

      const billUtxos = utxos.filter(
        (utxo) =>
          this.extractBillIdFromDatum(utxo.output.plutusData as string) ===
          billId,
      );

      const collateralUtxos = creatorUtxos
        .filter((utxo) => {
          const hasOnlyLovelace = utxo.output.amount.every(
            (a) => a.unit === 'lovelace',
          );

          const lovelaceAmount = utxo.output.amount.find(
            (a) => a.unit === 'lovelace',
          );

          const hasEnoughValue =
            lovelaceAmount && parseInt(lovelaceAmount.quantity) >= 4000000; //at least 4 ADA

          return hasOnlyLovelace && hasEnoughValue;
        })
        .sort((a, b) => {
          const aLovelace = a.output.amount.find((a) => a.unit === 'lovelace');
          const bLovelace = b.output.amount.find((a) => a.unit === 'lovelace');
          return (
            parseInt(aLovelace?.quantity || '0') -
            parseInt(bLovelace?.quantity || '0')
          );
        });

      if (collateralUtxos.length === 0) {
        throw new Error('No collateral UTXOs found for the creator address');
      }

      if (billUtxos.length === 0) {
        throw new Error('No UTXOs found for this bill');
      }

      const totalAmount = billUtxos.reduce(
        (sum, utxo) =>
          sum +
          parseInt(
            utxo.output.amount.find((a) => a.unit === 'lovelace')?.quantity ||
              '0',
          ),
        0,
      );

      const txBuilder = new MeshTxBuilder({
        fetcher: this.blockfrostProvider,
        submitter: this.blockfrostProvider,
      });

      billUtxos.forEach((utxo) => {
        txBuilder
          .spendingPlutusScriptV3()
          .txIn(
            utxo.input.txHash,
            utxo.input.outputIndex,
            utxo.output.amount,
            utxo.output.address,
          )
          .txInScript(this.contractService.getContractCbor())
          .spendingReferenceTxInInlineDatumPresent()
          .spendingReferenceTxInRedeemerValue(redeemer, 'JSON');
      });

      txBuilder
        .requiredSignerHash(
          this.contractService.getPaymentVerificationKeyFromBech32(
            creatorAddress,
          ),
        )
        .txOut(creatorAddress, [
          {
            quantity: (totalAmount - 4000000).toString(),
            unit: 'lovelace',
          },
        ])
        .changeAddress(creatorAddress)
        .txInCollateral(
          collateralUtxos[0].input.txHash,
          collateralUtxos[0].input.outputIndex,
          collateralUtxos[0].output.amount,
          collateralUtxos[0].output.address,
        );

      const unsignedTx = await txBuilder.complete();

      return {
        unsignedTx,
      };
    } catch (error) {
      throw new Error(`Failed to build settle transaction: ${error.message}`);
    }
  }

  private extractBillIdFromDatum(datum: string): string {
    try {
      //decode from cbor
      const decodedDatum = cbor.decode(Buffer.from(datum, 'hex'));
      const billIdField = decodedDatum?.value?.[0];
      if (Buffer.isBuffer(billIdField)) {
        return billIdField.toString('utf8');
      }
      return '';
    } catch (error) {
      return '';
    }
  }
  async getTransactionStatus(txHash: string) {
    try {
      const txStatus = await this.blockfrostProvider.fetchTxInfo(txHash);
      return !!txStatus
        ? TransactionStatus.Confirmed
        : TransactionStatus.Pending;
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  //debuggine
  //debugging
  private getWalletMnemonic(index: number = 0): string[] {
    const walletData = fs.readFileSync(
      path.join(
        process.cwd(),
        'src/modules/cardano/contracts',
        `wallet${index}.json`,
      ),
      'utf8',
    );
    const wallet = JSON.parse(walletData);
    if (!wallet.mnemonic || !Array.isArray(wallet.mnemonic)) {
      throw new Error(`Invalid wallet mnemonic format in wallet${index}.json`);
    }
    return wallet.mnemonic;
  }
  //i need 2 wallets to test the contract
  private async getAndSaveTwoWallets() {
    for (let i = 0; i < 2; i++) {
      const walletMnemonic = this.getWalletMnemonic(i);
      const wallet = new MeshWallet({
        fetcher: this.blockfrostProvider,
        submitter: this.blockfrostProvider,
        networkId: 0, // 0: testnet, 1: mainnet
        key: {
          type: 'mnemonic',
          words: walletMnemonic as string[],
        },
      });
      this[`wallet${i}`] = wallet;
    }
    console.log('Wallets initialized');
  }

  //assuming this is the frontend side code
  async testSignAndSubmitTx(unsignedTx: string) {
    try {
      const wallet = this.wallet1; // Use wallet0 for signing, can be changed to wallet1 if needed
      if (!wallet) {
        throw new Error(
          'Wallet not initialized. Please ensure wallets are set up.',
        );
      }
      const signedTx = await wallet.signTx(unsignedTx);
      const txHash = await wallet.submitTx(signedTx);
      console.log('Transaction submitted with hash:', txHash);
      return { txHash };
    } catch (error) {
      console.error('Error signing and submitting transaction:', error);
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  async testSubmitSettleTx(
    billId: string,
    creatorAddress: string,
  ): Promise<{ txHash: string }> {
    try {
      const { unsignedTx } = await this.buildSettleTransaction(
        billId,
        creatorAddress,
      );

      return { txHash: unsignedTx };
    } catch (error) {
      console.error('Error submitting settle transaction:', error);
      throw new Error(`Failed to submit settle transaction: ${error.message}`);
    }
  }
}
