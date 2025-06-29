"use client";

import Link from "next/link";
import {
  FilePlus,
  CheckCircle,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useGetBillsByCreator } from "@/hooks/useBillQueries";
import { Bill, BillStatus, ParticipantPaymentStatus } from "@/types/api.types";

export default function DashboardPage() {
  const {
    userWallet: { address },
  } = useWallet();

  const { data: bills = [], isLoading, error } = useGetBillsByCreator(address);

  const stats = {
    billsCreated: bills.length,
    adaSettled: bills
      .filter((bill) => bill.status === BillStatus.Complete)
      .reduce((total, bill) => total + bill.totalAmount, 0),
    activeBills: bills.filter(
      (bill) =>
        bill.status === BillStatus.Pending || bill.status === BillStatus.Partial
    ).length,
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getBillStatusColor = (status: BillStatus) => {
    switch (status) {
      case BillStatus.Complete:
        return "bg-green-100 text-green-800";
      case BillStatus.Partial:
        return "bg-yellow-100 text-yellow-800";
      case BillStatus.Pending:
        return "bg-blue-100 text-blue-800";
      case BillStatus.Expired:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBillStatusText = (status: BillStatus) => {
    switch (status) {
      case BillStatus.Complete:
        return "Complete";
      case BillStatus.Partial:
        return "Partial";
      case BillStatus.Pending:
        return "Pending";
      case BillStatus.Expired:
        return "Expired";
      default:
        return "Unknown";
    }
  };

  const getPaidParticipantsCount = (bill: Bill) => {
    return bill.participants.filter(
      (p) => p.paymentStatus === ParticipantPaymentStatus.Paid
    ).length;
  };

  if (!address) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-8">
            Please connect your wallet to view your bills and dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl card-shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl card-shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Bills
          </h2>
          <p className="text-gray-600 mb-8">
            {error.message || "Failed to load your bills. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bills</h1>
        <p className="text-gray-600">
          Track your created bills and payment history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FilePlus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats.billsCreated}
              </p>
              <p className="text-gray-600">Bills Created</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats.adaSettled.toFixed(2)}
              </p>
              <p className="text-gray-600">ADA Settled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeBills}
              </p>
              <p className="text-gray-600">Active Bills</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-xl card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Bills
            </h2>
            <Link
              href="/create-bills"
              className="btn-primary text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <FilePlus className="w-4 h-4" />
              Create New Bill
            </Link>
          </div>
        </div>

        {bills.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FilePlus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bills yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first bill to start splitting expenses with friends.
            </p>
            <Link
              href="/create-bills"
              className="btn-primary text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              Create Your First Bill
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bills
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((bill) => (
                <Link
                  key={bill._id}
                  href={`/bills-details/${bill._id}`}
                  className="block p-6 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {bill.title}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {getPaidParticipantsCount(bill)} of{" "}
                          {bill.participantCount} paid
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(bill.createdAt)}
                        </span>
                      </div>
                      {bill.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                          {bill.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-6">
                      <p className="font-semibold text-gray-900 mb-2">
                        {bill.totalAmount} ADA
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getBillStatusColor(
                          bill.status
                        )}`}
                      >
                        {getBillStatusText(bill.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {bills.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/create-bills"
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FilePlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create New Bill</p>
                <p className="text-sm text-gray-600">Split a new expense</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {stats.adaSettled.toFixed(2)} ADA
                </p>
                <p className="text-sm text-gray-600">Total settled</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
