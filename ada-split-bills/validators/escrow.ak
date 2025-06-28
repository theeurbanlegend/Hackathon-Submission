use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey as VerificationKeyType}
use aiken/interval.{
  Finite, Interval, IntervalBound, NegativeInfinity, PositiveInfinity,
}
use cardano/address.{Address, VerificationKey}
use cardano/assets.{lovelace_of}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}

pub type EscrowDatum {
  bill_id: ByteArray,
  creator_address: Hash<Blake2b_224, VerificationKeyType>,
  total_required: Int,
  participant_count: Int,
  amount_per_participant: Int,
  created_at: Int,
  // POSIXTime when bill was created
  settlement_deadline: Int,
  refund_deadline: Int,
}

// i set it to 24 hours

pub type EscrowRedeemer {
  Settle { bill_id: ByteArray }
  // 1 hour from creation (for individual refunds)
  RefundParticipant { bill_id: ByteArray }
  RefundAll { bill_id: ByteArray }
}

validator escrow_validator {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    expect Some(escrow_datum) = datum
    let current_time = get_current_time(self.validity_range)
    when redeemer is {
      Settle { bill_id } -> {
        expect escrow_datum.bill_id == bill_id
        let inputs_to_script = get_script_inputs_for_bill(self, bill_id)
        let total_received = sum_ada_inputs(inputs_to_script)
        let participant_addresses = get_unique_senders(inputs_to_script)
        let funds_sufficient = total_received >= escrow_datum.total_required
        let participants_sufficient =
          list.length(participant_addresses) >= escrow_datum.participant_count
        let within_deadline = current_time <= escrow_datum.settlement_deadline
        let creator_paid =
          pays_to_creator(self, escrow_datum.creator_address, total_received)
        funds_sufficient && participants_sufficient && within_deadline && creator_paid
      }
      RefundParticipant { bill_id } -> {
        expect escrow_datum.bill_id == bill_id
        let after_refund_deadline = current_time >= escrow_datum.refund_deadline
        let before_settlement_deadline =
          current_time <= escrow_datum.settlement_deadline
        let participant_refunded =
          participant_gets_refund_for_bill(self, utxo, bill_id)
        after_refund_deadline && before_settlement_deadline && participant_refunded
      }
      RefundAll { bill_id } -> {
        expect escrow_datum.bill_id == bill_id
        let creator_signed =
          signed_by_creator(self, escrow_datum.creator_address)
        let all_refunded = all_funds_refunded_for_bill(self, bill_id)
        creator_signed && all_refunded
      }
    }
  }

  else(_) {
    fail
  }
}

fn get_current_time(validity_range: Interval<Int>) -> Int {
  when validity_range.lower_bound.bound_type is {
    Finite(time) -> time
    NegativeInfinity -> 0
    PositiveInfinity -> fail @"Invalid transaction validity range"
  }
}

fn get_script_inputs_for_bill(
  transaction: Transaction,
  bill_id: ByteArray,
) -> List<Input> {
  let Transaction { inputs, .. } = transaction
  list.filter(inputs, fn(input) { input_belongs_to_bill(input, bill_id) })
}

fn input_belongs_to_bill(input: Input, bill_id: ByteArray) -> Bool {
  when input.output.datum is {
    InlineDatum(data) -> {
      expect escrow_datum: EscrowDatum = data
      escrow_datum.bill_id == bill_id
    }
    _ -> False
  }
}

fn sum_ada_inputs(inputs: List<Input>) -> Int {
  list.foldl(
    inputs,
    0,
    fn(input, acc) { acc + get_ada_amount_from_input(input) },
  )
}

fn get_ada_amount_from_input(input: Input) -> Int {
  let Input { output, .. } = input
  let Output { value, .. } = output
  lovelace_of(value)
}

fn get_unique_senders(inputs: List<Input>) -> List<Address> {
  let addresses = list.map(inputs, fn(input) { input.output.address })
  list.unique(addresses)
}

fn pays_to_creator(
  transaction: Transaction,
  creator_address: Hash<Blake2b_224, VerificationKeyType>,
  amount: Int,
) -> Bool {
  let Transaction { outputs, .. } = transaction
  list.any(
    outputs,
    fn(output) {
      output_pays_to_creator_hash(output, creator_address) && get_ada_amount_from_output(
        output,
      ) >= amount
    },
  )
}

fn output_pays_to_creator_hash(
  output: Output,
  creator_hash: Hash<Blake2b_224, VerificationKeyType>,
) -> Bool {
  let Output { address, .. } = output
  let Address { payment_credential, .. } = address
  when payment_credential is {
    VerificationKey(hash) -> hash == creator_hash
    _ -> False
  }
}

fn get_ada_amount_from_output(output: Output) -> Int {
  let Output { value, .. } = output
  lovelace_of(value)
}

fn participant_gets_refund_for_bill(
  transaction: Transaction,
  spending_utxo: OutputReference,
  _bill_id: ByteArray,
) -> Bool {
  let Transaction { inputs, outputs, .. } = transaction
  expect Some(spending_input) =
    list.find(inputs, fn(input) { input.output_reference == spending_utxo })
  let participant_addr = spending_input.output.address
  let contribution_amount = get_ada_amount_from_input(spending_input)
  list.any(
    outputs,
    fn(output) {
      output.address == participant_addr && get_ada_amount_from_output(output) >= contribution_amount
    },
  )
}

fn signed_by_creator(
  transaction: Transaction,
  creator_address: Hash<Blake2b_224, VerificationKeyType>,
) -> Bool {
  let Transaction { extra_signatories, .. } = transaction
  list.has(extra_signatories, creator_address)
}

fn all_funds_refunded_for_bill(
  transaction: Transaction,
  bill_id: ByteArray,
) -> Bool {
  let bill_inputs = get_script_inputs_for_bill(transaction, bill_id)
  let participant_addresses = get_unique_senders(bill_inputs)
  let total_input_amount = sum_ada_inputs(bill_inputs)
  list.all(
    participant_addresses,
    fn(participant_addr) {
      participant_gets_refund_amount(
        transaction,
        participant_addr,
        total_input_amount,
        list.length(participant_addresses),
      )
    },
  )
}

fn participant_gets_refund_amount(
  transaction: Transaction,
  participant_addr: Address,
  total_amount: Int,
  participant_count: Int,
) -> Bool {
  let expected_refund = total_amount / participant_count
  let Transaction { outputs, .. } = transaction
  list.any(
    outputs,
    fn(output) {
      output.address == participant_addr && get_ada_amount_from_output(output) >= expected_refund
    },
  )
}
