"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Users, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = 25;
  const fee = 0.2;
  const total = amount + fee;

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate wallet confirmation
    setTimeout(() => {
      // Simulate blockchain confirmation
      setTimeout(() => {
        setIsProcessing(false);
        router.push("/success");
      }, 2000);
    }, 1000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pay Your Share
          </h2>
          <p className="text-gray-600">Dinner at Mario's Restaurant</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {amount} ADA
            </p>
            <p className="text-gray-600 mb-4">Your portion of 100 ADA total</p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Users className="w-4 h-4 mr-2" />
              <span>Split between 4 people</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Amount</span>
            <span className="font-semibold">{amount} ADA</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Transaction Fee</span>
            <span className="font-semibold">~{fee} ADA</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between py-2">
              <span className="font-semibold">Total Deducted</span>
              <span className="font-bold text-lg">{total} ADA</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Refund Available</p>
              <p>
                If this bill isn't completed within 1 hour, you can reclaim your
                funds.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full btn-primary text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50"
          >
            {isProcessing ? "Processing Payment..." : "Connect Wallet & Pay"}
          </button>
          <Link
            href="/bills-details/abc123"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center block"
          >
            Back to Bill
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Funds sent to escrow contract: addr1_script_abc123...
          </p>
        </div>
      </div>
    </div>
  );
}
