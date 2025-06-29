"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Info,
  ExternalLink,
  Copy,
  Share2,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useGetSingleBillByParticipant } from "@/hooks/useBillQueries";
import { useWallet } from "@/context/WalletContext";

interface PaymentDetails {
  billId: string;
  txHash: string;
  amount: number;
  billTitle: string;
  timestamp: string;
}

export default function SuccessPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const {
    userWallet: { address },
  } = useWallet();
  const { data: bill } = useGetSingleBillByParticipant(id as string, address);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (id && bill && address) {
      const partipantPaymentDetails = bill.participants.find(
        (p) => p.address === address
      );
      const details: PaymentDetails = {
        billId: id as string,
        txHash: partipantPaymentDetails?.paymentTxHash || "",
        amount: parseFloat(
          partipantPaymentDetails?.amountPaid?.toString() || "0"
        ),
        billTitle: bill?.title || "Bill Payment",
        timestamp: new Date(
          partipantPaymentDetails?.paidAt || Date.now()
        ).toISOString(),
      };
      setPaymentDetails(details);
    }
  }, [id, bill, address]);

  useEffect(() => {
    if (!paymentDetails) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - new Date(paymentDetails.timestamp).getTime()) / 1000
      );
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentDetails]);

  const formatTimeElapsed = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied to clipboard!`);
    } catch (err) {
      console.error("Failed to copy text:", err);
      toast.error(`Failed to copy ${label}. Please try again.`);
    }
  };

  const sharePayment = async () => {
    if (!paymentDetails || !bill) return;

    const shareText = `I just paid my share for "${bill.title}" using ADA Split Bills! 💰`;
    const shareUrl = `${window.location.origin}/bills-details/${paymentDetails.billId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Successful",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
        copyToClipboard(shareUrl, "Bill link");
      }
    } else {
      copyToClipboard(shareUrl, "Bill link");
    }
  };

  const openExplorer = () => {
    if (!paymentDetails?.txHash) return;

    const explorerUrl = `https://preview.cardanoscan.io/transaction/${paymentDetails.txHash}`;
    window.open(explorerUrl, "_blank");
  };

  const formatTxHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (!address) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Please Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-8">
            We could not find payment details because you are not connected to a
            wallet.
          </p>
        </div>
      </div>
    );
  }

  if (!paymentDetails && id) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-8"></div>
          <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Payment Found
          </h2>
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find payment details. Redirecting to dashboard...
          </p>
          <Link
            href="/dashboard"
            className="w-full btn-primary text-white py-3 rounded-lg font-semibold text-center block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalPaid = paymentDetails.amount;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-2">
          Your payment has been submitted to the blockchain
        </p>
        {timeElapsed > 0 && (
          <p className="text-sm text-gray-500 mb-8 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTimeElapsed(timeElapsed)}
          </p>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-semibold">{paymentDetails.amount} ADA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Deducted</span>
              <span className="font-bold">{totalPaid.toFixed(2)} ADA</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bill</span>
                <span className="font-semibold text-right">
                  {paymentDetails.billTitle}
                </span>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction Hash</span>
                <button
                  onClick={() =>
                    copyToClipboard(paymentDetails.txHash, "Transaction hash")
                  }
                  className="font-mono text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                >
                  {formatTxHash(paymentDetails.txHash)}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 text-left">
              <p className="font-medium mb-1">What happens next?</p>
              <p>
                Your funds are held securely in the escrow smart contract until
                all participants pay. You&apos;ll be notified when the bill is
                complete and funds are distributed!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={openExplorer}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            View on Explorer
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={sharePayment}
              className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <Link
              href={`/bills-details/${paymentDetails.billId}`}
              className="bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bill
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center block"
          >
            View All Bills
          </Link>
        </div>

        {bill && (
          <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Bill Progress</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {bill.participants.filter((p) => p.paymentStatus === "paid")
                  .length + 1}{" "}
                paid
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {bill.participantCount -
                  bill.participants.filter((p) => p.paymentStatus === "paid")
                    .length -
                  1}{" "}
                pending
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
