"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Wallet,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import {
  usePostAddParticipantToBill,
  usePostInitiateBillPayment,
} from "@/hooks/useBillMutations";
import { useGetBillById } from "@/hooks/useBillQueries";
import { BillStatus, ParticipantPaymentStatus } from "@/types/api.types";
import { ModalTypes, useModal } from "@/context/ModalContext";

type PaymentState =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { openModal } = useModal();

  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [submittedTxHash, setSubmittedTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    signAndSubmitTxFromHex,
    userWallet: { address },
    walletConnectionState: { isConnected },
  } = useWallet();

  const { data: bill, isLoading, error } = useGetBillById(id as string);
  const { mutateAsync: initiatePayment } = usePostInitiateBillPayment();
  const { mutateAsync: addParticipantToBill } = usePostAddParticipantToBill();

  const userParticipant = useMemo(() => {
    if (!bill || !address) return null;
    return bill.participants.find((p) => p.address === address);
  }, [bill, address]);

  const hasUserPaid =
    userParticipant?.paymentStatus === ParticipantPaymentStatus.Paid;
  const isCreator = bill && address && bill.creatorAddress === address;

  const estimatedFee = 0.2;
  const total = bill ? bill.amountPerParticipant + estimatedFee : 0;

  useEffect(() => {
    if (hasUserPaid) {
      toast.info("You have already paid for this bill.");
      router.push(`/bills-details/${id}`);
    }
  }, [hasUserPaid, id, router, toast]);

  useEffect(() => {
    if (isCreator) {
      toast.info("You are the creator of this bill.");
      router.push(`/bills-details/${id}`);
    }
  }, [isCreator, id, router, toast]);

  const getPaymentStateInfo = (state: PaymentState) => {
    switch (state) {
      case "building":
        return {
          text: "Building transaction...",
          subtext: "Preparing your payment",
        };
      case "signing":
        return {
          text: "Waiting for signature...",
          subtext: "Please sign in your wallet",
        };
      case "submitting":
        return {
          text: "Submitting to blockchain...",
          subtext: "Broadcasting transaction",
        };
      case "confirming":
        return {
          text: "Confirming payment...",
          subtext: "Waiting for confirmation",
        };
      case "success":
        return {
          text: "Payment successful!",
          subtext: "Transaction confirmed",
        };
      case "error":
        return { text: "Payment failed", subtext: errorMessage };
      default:
        return { text: "Connect Wallet & Pay", subtext: "" };
    }
  };

  const handlePayment = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      openModal(ModalTypes.WalletConnect, null);
      return;
    }

    if (!bill || !address) {
      toast.error("Bill or wallet address not found");
      return;
    }

    setErrorMessage("");

    try {
      setPaymentState("building");
      const paymentResponse = await initiatePayment({
        billId: id as string,
        participantAddress: address,
      });

      if (!paymentResponse?.unsignedTx) {
        throw new Error("Failed to build payment transaction");
      }

      setPaymentState("signing");
      const txHash = await signAndSubmitTxFromHex(paymentResponse.unsignedTx);

      if (!txHash) {
        throw new Error("Transaction was not submitted");
      }

      setSubmittedTxHash(txHash);
      setPaymentState("submitting");

      console.log("Transaction submitted:", txHash);
      toast("Transaction submitted! Hash: " + txHash.slice(0, 8) + "...");

      setPaymentState("confirming");
      await addParticipantToBill({
        billId: id as string,
        participantAddress: address,
        amountPaid: bill.amountPerParticipant,
        paymentTxHash: txHash,
      });
      setPaymentState("success");
      toast.success("Payment confirmed! Thank you for your contribution!");
      setTimeout(() => {
        router.push(`${id}/success`);
      }, 100);
    } catch (error) {
      console.error("Payment failed:", error);
      setPaymentState("error");
      setErrorMessage(
        error instanceof Error
          ? error?.message
          : "Payment failed. Please try again."
      );
      toast.error(
        error instanceof Error
          ? error?.message
          : "Payment failed. Please try again."
      );
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const isProcessing = [
    "building",
    "signing",
    "submitting",
    "confirming",
  ].includes(paymentState);
  const stateInfo = getPaymentStateInfo(paymentState);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 animate-pulse">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bill Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            {error?.message ||
              "The bill you're trying to pay for doesn't exist."}
          </p>
          <Link
            href="/dashboard"
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (hasUserPaid || isCreator) {
    return null;
  }

  const paymentProgress = bill.participants.filter(
    (p) => p.paymentStatus === ParticipantPaymentStatus.Paid
  ).length;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow p-8">
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              paymentState === "success"
                ? "bg-green-100"
                : paymentState === "error"
                ? "bg-red-100"
                : "bg-blue-100"
            }`}
          >
            {paymentState === "success" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : paymentState === "error" ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : (
              <CreditCard className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {paymentState === "success"
              ? "Payment Successful!"
              : "Pay Your Share"}
          </h2>
          <p className="text-gray-600">{bill.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Created {formatTimeAgo(bill.createdAt)}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {bill.amountPerParticipant} ADA
            </p>
            <p className="text-gray-600 mb-4">
              Your portion of {bill.totalAmount} ADA total
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500 mb-3">
              <Users className="w-4 h-4 mr-2" />
              <span>Split between {bill.participantCount} people</span>
            </div>
            <div className="text-sm text-gray-500">
              {paymentProgress} of {bill.participantCount} have paid
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Amount</span>
            <span className="font-semibold">
              {bill.amountPerParticipant} ADA
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Transaction Fee (est.)</span>
            <span className="font-semibold">~{estimatedFee} ADA</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between py-2">
              <span className="font-semibold">Total Deducted</span>
              <span className="font-bold text-lg">{total.toFixed(2)} ADA</span>
            </div>
          </div>
        </div>

        {bill.status !== BillStatus.Expired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Escrow Protection</p>
                <p>
                  Your payment is held safely in a smart contract until all
                  participants pay.
                  {bill.status === BillStatus.Pending &&
                    " If incomplete, refunds may be available."}
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentState === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Payment Failed</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {submittedTxHash && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Transaction Submitted</p>
                <p className="font-mono text-xs break-all">{submittedTxHash}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {paymentState === "success" ? (
            <Link
              href={`/bills-details/${id}`}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg text-center block hover:bg-green-700 transition-colors"
            >
              View Bill Details
            </Link>
          ) : (
            <button
              onClick={handlePayment}
              disabled={isProcessing || bill.status === BillStatus.Expired}
              className="w-full btn-primary text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {stateInfo.text}
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect Wallet to Pay
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay {bill.amountPerParticipant} ADA
                </>
              )}
            </button>
          )}

          {stateInfo.subtext && isProcessing && (
            <p className="text-center text-sm text-gray-600">
              {stateInfo.subtext}
            </p>
          )}

          <Link
            href={`/bills-details/${id}`}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bill
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Escrow Contract:</p>
          <p className="text-xs font-mono text-gray-600 break-all">
            {bill.escrowAddress}
          </p>
        </div>

        {/* Payment Instructions */}
        {!isConnected && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Connect your Cardano wallet</li>
              <li>Review payment details</li>
              <li>Sign the transaction in your wallet</li>
              <li>Funds are held in escrow until bill completion</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
