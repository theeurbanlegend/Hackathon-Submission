export interface BlockfrostUtxo {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: Array<{
    unit: string;
    quantity: string;
  }>;
  block: string;
  data_hash: string | null;
  inline_datum: string | null; //inline datum in cbor
  reference_script_hash: string | null;
}
