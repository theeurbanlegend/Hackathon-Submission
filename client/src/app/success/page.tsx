"use client";

import Link from "next/link";
import { CheckCircle, Info } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Sent!</h2>
        <p className="text-gray-600 mb-8">
          Your payment has been submitted to the blockchain
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-semibold">25 ADA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Fee</span>
              <span className="font-semibold">0.17 ADA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bill</span>
              <span className="font-semibold">Dinner at Mario's</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Hash</span>
                <span className="font-mono text-xs text-blue-600">
                  tx_def456...
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800 text-left">
              <p className="font-medium mb-1">What happens next?</p>
              <p>
                Your funds are held in escrow until all participants pay. You'll
                be notified when the bill is complete!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            View on Explorer
          </button>
          <Link
            href="/bills-details/abc123"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center block"
          >
            Back to Bill
          </Link>
        </div>
      </div>
    </div>
  );
}
