use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey as VerificationKeyType}
use cardano/transaction.{OutputReference, Transaction}

pub type EscrowDatum {
  bill_id: ByteArray,
  creator_address: Hash<Blake2b_224, VerificationKeyType>,
}

pub type EscrowRedeemer {
  Settle { bill_id: ByteArray }
}

validator escrow_validator {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _utxo: OutputReference,
    self: Transaction,
  ) {
    expect Some(escrow_datum) = datum
    when redeemer is {
      Settle { bill_id } -> {
        expect escrow_datum.bill_id == bill_id
        let creator_signed =
          list.has(self.extra_signatories, escrow_datum.creator_address)
        creator_signed
      }
    }
  }

  else(_) {
    fail
  }
}
