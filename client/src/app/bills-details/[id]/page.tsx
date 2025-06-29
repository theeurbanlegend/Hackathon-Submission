"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useGetBillById } from "@/hooks/useBillQueries";
import { useWallet } from "@/context/WalletContext";
import { BillStatus, ParticipantPaymentStatus } from "@/types/api.types";
import { usePostInitiateBillSettlement } from "@/hooks/useBillMutations";

export default function BillDetailsPage() {
  const { id } = useParams();
  const {
    data: bill,
    isLoading,
    error,
    refetch,
  } = useGetBillById(id as string);
  const { toast } = useToast();
  const { userWallet, signAndSubmitTxFromHex } = useWallet();
  const [lastPaymentCount, setLastPaymentCount] = useState(0);
  const { mutateAsync } = usePostInitiateBillSettlement();

  // Calculate payment progress
  const paymentStats = useMemo(() => {
    if (!bill)
      return {
        paidCount: 0,
        totalParticipants: 0,
        progressPercentage: 0,
        totalPaid: 0,
      };

    const paidCount = bill.participants.filter(
      (p) => p.paymentStatus === ParticipantPaymentStatus.Paid
    ).length;
    const totalPaid = bill.participants
      .filter((p) => p.paymentStatus === ParticipantPaymentStatus.Paid)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      paidCount,
      totalParticipants: bill.participantCount,
      progressPercentage: (paidCount / bill.participantCount) * 100,
      totalPaid,
    };
  }, [bill]);

  // Check if current user is the creator
  const isCreator = useMemo(() => {
    return (
      bill && userWallet.address && bill.creatorAddress === userWallet.address
    );
  }, [bill, userWallet.address]);

  // Check if current user has already paid
  const userParticipant = useMemo(() => {
    if (!bill || !userWallet.address) return null;
    return bill.participants.find((p) => p.address === userWallet.address);
  }, [bill, userWallet.address]);

  const hasUserPaid =
    userParticipant?.paymentStatus === ParticipantPaymentStatus.Paid;

  useEffect(() => {
    if (
      bill &&
      paymentStats.paidCount > lastPaymentCount &&
      lastPaymentCount > 0
    ) {
      toast(
        `Payment received! ${paymentStats.paidCount} of ${paymentStats.totalParticipants} participants paid.`
      );
    }
    setLastPaymentCount(paymentStats.paidCount);
  }, [
    paymentStats.paidCount,
    paymentStats.totalParticipants,
    lastPaymentCount,
    toast,
  ]);

  useEffect(() => {
    if (!bill) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [bill, refetch]);

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

  const handleBillSettlement = async () => {
    if (!bill || !isCreator) {
      toast.error("Only the bill creator can settle the bill.");
      return;
    }

    try {
      const { unsignedTx } = await mutateAsync({
        billId: bill._id as string,
      });
      if (!unsignedTx) {
        toast.error("Failed to initiate bill settlement.");
        return;
      }
      const txHash = await signAndSubmitTxFromHex(unsignedTx);
      if (!txHash) {
        toast.error("Transaction submission failed.");
        return;
      }
      toast.success("Bill settled successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to settle the bill.");
    }
  };

  const getBillStatusInfo = (status: BillStatus) => {
    switch (status) {
      case BillStatus.Complete:
        return {
          icon: CheckCircle,
          text: "Complete",
          color: "text-green-600 bg-green-100",
        };
      case BillStatus.Partial:
        return {
          icon: Clock,
          text: "Partial",
          color: "text-yellow-600 bg-yellow-100",
        };
      case BillStatus.Pending:
        return {
          icon: Clock,
          text: "Pending",
          color: "text-blue-600 bg-blue-100",
        };
      case BillStatus.Expired:
        return {
          icon: AlertCircle,
          text: "Expired",
          color: "text-red-600 bg-red-100",
        };
      default:
        return {
          icon: Clock,
          text: "Unknown",
          color: "text-gray-600 bg-gray-100",
        };
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const shareBill = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: bill?.title,
          text: `Pay your share for ${bill?.title}`,
          url: url,
        });
      } catch (err) {
        copyToClipboard(url, "Bill link");
      }
    } else {
      copyToClipboard(url, "Bill link");
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow overflow-hidden animate-pulse">
          <div className="gradient-bg p-8">
            <div className="h-8 bg-white/20 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-1/3 mb-6"></div>
            <div className="h-3 bg-white/20 rounded w-full mb-4"></div>
            <div className="flex justify-between items-end">
              <div>
                <div className="h-6 bg-white/20 rounded w-24 mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-32"></div>
              </div>
              <div className="w-24 h-24 bg-white/20 rounded-lg"></div>
            </div>
          </div>
          <div className="p-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bill Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            {error?.message ||
              "The bill you're looking for doesn't exist or has been removed."}
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

  const statusInfo = getBillStatusInfo(bill.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {/* Header */}
        <div className="gradient-bg text-white p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{bill.title}</h1>
              <div className="flex items-center gap-4 text-blue-100">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {bill.participantCount} participants
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created {formatTimeAgo(bill.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusInfo.color}`}
              >
                <StatusIcon className="w-4 h-4" />
                {statusInfo.text}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                #{bill._id?.slice(-6)}
              </span>
            </div>
          </div>

          {bill.description && (
            <p className="text-blue-100 mb-6">{bill.description}</p>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Progress</span>
              <span>
                {paymentStats.paidCount} of {paymentStats.totalParticipants}{" "}
                paid
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div
                className="progress-bar h-3 rounded-full transition-all duration-500"
                style={
                  {
                    "--progress": `${paymentStats.progressPercentage}%`,
                    width: `${paymentStats.progressPercentage}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>

          {/* Amount and QR Code */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                {bill.totalAmount} ADA Total
              </p>
              <p className="text-blue-200">
                {bill.amountPerParticipant} ADA per person
              </p>
              {paymentStats.totalPaid > 0 && (
                <p className="text-sm text-blue-200">
                  {paymentStats.totalPaid} ADA collected
                </p>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                Scan to pay
              </p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="p-8">
          <h3 className="text-lg font-semibold mb-6">Payment Status</h3>

          {/* Creator always shows first */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <span className="status-indicator status-creator" />
                <div>
                  <span className="font-medium">
                    {formatAddress(bill.creatorAddress)}
                    {isCreator && " (You)"}
                  </span>
                  <p className="text-xs text-blue-600">Bill Creator</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">Creator</p>
                <p className="text-xs text-gray-500">Receives payments</p>
              </div>
            </div>

            {/* Participants */}
            {bill.participants.map((participant, index) => {
              const isPaid =
                participant.paymentStatus === ParticipantPaymentStatus.Paid;
              const isCurrentUser = participant.address === userWallet.address;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isPaid
                      ? "bg-green-50 border-green-200"
                      : isCurrentUser
                      ? "bg-blue-50 border-blue-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`status-indicator ${
                        isPaid ? "status-paid" : "status-pending"
                      }`}
                    />
                    <div>
                      <span className="font-medium">
                        {formatAddress(participant.address)}
                        {isCurrentUser && " (You)"}
                      </span>
                      {participant.paymentTxHash && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              participant.paymentTxHash,
                              "Transaction hash"
                            )
                          }
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {participant.paymentTxHash.slice(0, 8)}...
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        isPaid ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {participant.amountPaid || bill.amountPerParticipant} ADA
                    </p>
                    <p className="text-xs text-gray-500">
                      {isPaid
                        ? `Paid ${formatTimeAgo(participant.paidAt)}`
                        : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {!hasUserPaid && !isCreator && (
              <Link
                href={`/payment/${bill._id}`}
                className="flex-1 btn-primary text-white py-3 px-6 rounded-lg font-semibold text-center flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Wallet className="w-5 h-5" />
                Pay My Share ({bill.amountPerParticipant} ADA)
              </Link>
            )}

            {hasUserPaid && (
              <div className="flex-1 bg-green-100 text-green-800 py-3 px-6 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Payment Complete
              </div>
            )}

            {isCreator && bill.status === BillStatus.Complete && (
              <button
                type="button"
                onClick={handleBillSettlement}
                className="flex-1 btn-primary text-white py-3 px-6 rounded-lg font-semibold text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                Settle Bill ({paymentStats.totalPaid} ADA)
              </button>
            )}

            <button
              onClick={shareBill}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Bill
            </button>

            <button
              onClick={() => copyToClipboard(window.location.href, "Bill link")}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Link
            </button>
          </div>

          {/* Contract Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">
                <strong>Escrow Contract:</strong>
              </p>
              <button
                onClick={() =>
                  copyToClipboard(bill.escrowAddress, "Escrow address")
                }
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
            <p className="text-sm font-mono text-gray-800 mb-3 break-all">
              {bill.escrowAddress}
            </p>
            <p className="text-xs text-gray-500">
              Funds are held securely in the smart contract until all
              participants pay.
              {isCreator &&
                " As the creator, you can settle once all payments are received."}
            </p>
          </div>

          {/* Bill Timeline */}
          {bill.participants.some(
            (p) => p.paymentStatus === ParticipantPaymentStatus.Paid
          ) && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4">
                Payment Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    Bill created {formatTimeAgo(bill.createdAt)}
                  </span>
                </div>
                {bill.participants
                  .filter(
                    (p) => p.paymentStatus === ParticipantPaymentStatus.Paid
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.paidAt).getTime() -
                      new Date(b.paidAt).getTime()
                  )
                  .map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">
                        {formatAddress(participant.address)} paid{" "}
                        {participant.amountPaid} ADA{" "}
                        {formatTimeAgo(participant.paidAt)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
