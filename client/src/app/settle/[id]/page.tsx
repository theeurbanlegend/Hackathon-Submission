"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Users,
  Clock,
  Wallet,
  ArrowLeft,
  ExternalLink,
  Copy,
  DollarSign,
  Shield,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useGetBillById } from "@/hooks/useBillQueries";
import { useWallet } from "@/context/WalletContext";
import { usePostInitiateBillSettlement } from "@/hooks/useBillMutations";
import { BillStatus, ParticipantPaymentStatus } from "@/types/api.types";

type SettlementState =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export default function SettlePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [settlementStats, setSettlementStats] = useState({
    totalToReceive: 0,
    paidParticipants: 0,
    totalParticipants: 0,
    estimatedFee: 0,
    netAmount: 0,
  });
  const [canSettle, setCanSettle] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [settlementState, setSettlementState] =
    useState<SettlementState>("idle");
  const [submittedTxHash, setSubmittedTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    data: bill,
    isLoading,
    error,
    refetch,
  } = useGetBillById(id as string);
  const {
    userWallet,
    signAndSubmitTxFromHex,
    walletConnectionState: { isConnected },
  } = useWallet();
  const { mutateAsync: initiateSettlement } = usePostInitiateBillSettlement();

  // Calculate settlement details
  useEffect(() => {
    if (!bill || !userWallet.address) return;

    const paidParticipants = bill.participants.filter(
      (p) => p.paymentStatus === ParticipantPaymentStatus.Paid
    ).length;

    const totalToReceive = bill.participants
      .filter((p) => p.paymentStatus === ParticipantPaymentStatus.Paid)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const estimatedFee = 0.2; // Settlement transaction fee
    const netAmount = totalToReceive - estimatedFee;

    setSettlementStats((prev) => {
      return {
        ...prev,
        totalToReceive,
        paidParticipants,
        totalParticipants: bill.participantCount,
        estimatedFee,
        netAmount,
      };
    });
    setCanSettle(
      bill &&
        bill.status === BillStatus.Complete &&
        settlementStats.paidParticipants ===
          settlementStats.totalParticipants &&
        settlementStats.totalToReceive > 0
    );
    setIsCreator(
      !!(
        bill &&
        userWallet.address &&
        bill.creatorAddress === userWallet.address
      )
    );
  }, [bill, userWallet]);

  const getSettlementStateInfo = (state: SettlementState) => {
    switch (state) {
      case "building":
        return {
          text: "Building settlement transaction...",
          subtext: "Preparing to collect funds",
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
          text: "Confirming settlement...",
          subtext: "Waiting for confirmation",
        };
      case "success":
        return {
          text: "Settlement successful!",
          subtext: "Funds have been distributed",
        };
      case "error":
        return { text: "Settlement failed", subtext: errorMessage };
      default:
        return { text: "Settle Bill", subtext: "" };
    }
  };

  const handleSettlement = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!bill || !isCreator || !canSettle) {
      toast.error("Settlement conditions not met");
      return;
    }

    setErrorMessage("");

    try {
      // Step 1: Build settlement transaction
      setSettlementState("building");
      const response = await initiateSettlement({
        billId: bill._id as string,
      });

      if (!response?.unsignedTx) {
        throw new Error("Failed to build settlement transaction");
      }

      // Step 2: Sign and submit transaction
      setSettlementState("signing");
      const txHash = await signAndSubmitTxFromHex(response.unsignedTx);

      if (!txHash) {
        throw new Error("Transaction was not submitted");
      }

      setSubmittedTxHash(txHash);
      setSettlementState("submitting");

      console.log("Settlement transaction submitted:", txHash);
      toast(`Settlement transaction submitted! Hash: ${txHash.slice(0, 8)}...`);

      // Step 3: Wait for confirmation
      setSettlementState("confirming");

      // Simulate confirmation delay
      setTimeout(() => {
        setSettlementState("success");
        toast.info("Bill settled successfully! Funds have been distributed.");

        setTimeout(() => {
          refetch();
          router.push(`/bills-details/${id}`);
        }, 3000);
      }, 4000);
    } catch (error: any) {
      console.error("Settlement failed:", error);
      setSettlementState("error");
      setErrorMessage(error.message || "Settlement failed. Please try again.");
      toast.error(error.message || "Settlement failed");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
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
  ].includes(settlementState);
  const stateInfo = getSettlementStateInfo(settlementState);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to settle this bill.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 animate-pulse">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-40 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bill Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            {error?.message ||
              "The bill you're trying to settle doesn't exist."}
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

  if (!isCreator) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unauthorized Action
          </h2>
          <p className="text-gray-600 mb-8">
            Only the bill creator can settle this bill.
          </p>
          <Link
            href={`/bills-details/${id}`}
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Back to Bill Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              settlementState === "success"
                ? "bg-green-100"
                : settlementState === "error"
                ? "bg-red-100"
                : "bg-blue-100"
            }`}
          >
            {settlementState === "success" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : settlementState === "error" ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : (
              <DollarSign className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {settlementState === "success"
              ? "Settlement Complete!"
              : "Settle Bill"}
          </h2>
          <p className="text-gray-600">{bill.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Created {formatTimeAgo(bill.createdAt)}
          </p>
        </div>

        {/* Settlement Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {settlementStats.netAmount.toFixed(2)} ADA
            </p>
            <p className="text-gray-600 mb-4">Net amount you'll receive</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {settlementStats.paidParticipants}/
                {settlementStats.totalParticipants} paid
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Escrow secured
              </span>
            </div>
          </div>
        </div>

        {/* Settlement Breakdown */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Total Collected</span>
            <span className="font-semibold">
              {settlementStats.totalToReceive} ADA
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Settlement Fee (est.)</span>
            <span className="font-semibold">
              -{settlementStats.estimatedFee} ADA
            </span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between py-2">
              <span className="font-semibold">You Receive</span>
              <span className="font-bold text-lg text-green-600">
                {settlementStats.netAmount.toFixed(2)} ADA
              </span>
            </div>
          </div>
        </div>

        {/* Settlement Conditions */}
        {!canSettle && bill.status !== BillStatus.Complete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Settlement Not Available</p>
                <p>
                  {settlementStats.paidParticipants} of{" "}
                  {settlementStats.totalParticipants} participants have paid.
                  Settlement will be available once all participants complete
                  their payments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {settlementState === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Settlement Failed</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Hash Display */}
        {submittedTxHash && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Settlement Transaction</p>
                  <p className="font-mono text-xs break-all">
                    {submittedTxHash}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(submittedTxHash, "Transaction hash")
                }
                className="text-blue-600 hover:text-blue-800 transition-colors ml-2"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Participant Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h4 className="font-semibold text-gray-900 mb-3">Participants</h4>
          <div className="space-y-2">
            {bill.participants
              .filter((p) => p.paymentStatus === ParticipantPaymentStatus.Paid)
              .map((participant, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600">
                    {formatAddress(participant.address)}
                  </span>
                  <span className="font-medium text-green-600">
                    +{participant.amountPaid} ADA
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {settlementState === "success" ? (
            <Link
              href={`/bills-details/${id}`}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg text-center block hover:bg-green-700 transition-colors"
            >
              View Bill Details
            </Link>
          ) : (
            <button
              onClick={handleSettlement}
              disabled={isProcessing || !canSettle}
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
                  Connect Wallet to Settle
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Settle & Collect {settlementStats.netAmount.toFixed(2)} ADA
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

        {/* Contract Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">
            <strong>Escrow Contract:</strong>
          </p>
          <p className="text-xs font-mono text-gray-600 break-all mb-2">
            {bill.escrowAddress}
          </p>
          <p className="text-xs text-gray-500">
            Settlement will release all escrowed funds to your wallet address.
            This action is irreversible once confirmed on the blockchain.
          </p>
        </div>

        {/* Settlement Instructions */}
        {!canSettle && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Settlement Process:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>All participants must complete their payments</li>
              <li>Connect your wallet and sign the settlement transaction</li>
              <li>Smart contract validates all payments received</li>
              <li>Funds are released from escrow to your wallet</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
