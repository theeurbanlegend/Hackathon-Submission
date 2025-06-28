"use client";

import Link from "next/link";
import { FilePlus, CheckCircle, Users } from "lucide-react";

interface Bill {
  id: string;
  title: string;
  amount: number;
  paidCount: number;
  totalParticipants: number;
  status: "pending" | "complete";
  timeAgo: string;
}

export default function DashboardPage() {
  const bills: Bill[] = [
    {
      id: "abc123",
      title: "Dinner at Mario's Restaurant",
      amount: 100,
      paidCount: 2,
      totalParticipants: 4,
      status: "pending",
      timeAgo: "1 hour ago",
    },
    {
      id: "def456",
      title: "Coffee & Pastries",
      amount: 24,
      paidCount: 3,
      totalParticipants: 3,
      status: "complete",
      timeAgo: "yesterday",
    },
    {
      id: "ghi789",
      title: "Team Lunch",
      amount: 150,
      paidCount: 5,
      totalParticipants: 5,
      status: "complete",
      timeAgo: "3 days ago",
    },
  ];

  const stats = {
    billsCreated: 12,
    adaSettled: 284,
    activeBills: 8,
  };

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
                {stats.adaSettled}
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
              className="btn-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create New Bill
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {bills.map((bill) => (
            <Link
              key={bill.id}
              href={`/bills-details/${bill.id}`}
              className="block p-6 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{bill.title}</h3>
                  <p className="text-gray-600 text-sm">
                    {bill.paidCount} of {bill.totalParticipants} participants
                    paid • Created {bill.timeAgo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {bill.amount} ADA
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      bill.status === "complete"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {bill.status === "complete" ? "Complete" : "Pending"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
