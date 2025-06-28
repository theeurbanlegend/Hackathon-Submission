"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QrCode, Users } from "lucide-react";
import Notification from "@/components/Notification";

interface Participant {
  name: string;
  amount: number;
  status: "paid" | "pending";
  timeAgo?: string;
}

export default function BillDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [participants, setParticipants] = useState<Participant[]>([
    {
      name: "Alex (Bill Creator)",
      amount: 25,
      status: "paid",
      timeAgo: "initially",
    },
    { name: "Beth", amount: 25, status: "paid", timeAgo: "5 min ago" },
    { name: "Chris", amount: 25, status: "pending" },
    { name: "Dana", amount: 25, status: "pending" },
  ]);

  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as const,
  });

  const totalAmount = 100;
  const paidCount = participants.filter((p) => p.status === "paid").length;
  const totalParticipants = participants.length;
  const progressPercentage = (paidCount / totalParticipants) * 100;

  // Simulate real-time updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.name === "Chris"
            ? { ...p, status: "paid" as const, timeAgo: "just now" }
            : p
        )
      );

      // Show notification
      setNotification({
        isVisible: true,
        message: "Chris just paid! 3 of 4 participants complete.",
        type: "success",
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <>
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {/* Header */}
          <div className="gradient-bg text-white p-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">
                Dinner at Mario's Restaurant
              </h1>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                Bill #{params.id}
              </span>
            </div>
            <p className="text-blue-100 mb-6">
              Great Italian food with friends!
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Payment Progress</span>
                <span>
                  {paidCount} of {totalParticipants} paid
                </span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                <div
                  className="progress-bar h-3 rounded-full"
                  style={
                    {
                      "--progress": `${progressPercentage}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{totalAmount} ADA Total</p>
                <p className="text-blue-200">
                  {totalAmount / totalParticipants} ADA per person
                </p>
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
            <div className="space-y-4">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    participant.status === "paid"
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`status-indicator status-${participant.status}`}
                    />
                    <span className="font-medium">{participant.name}</span>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        participant.status === "paid"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {participant.amount} ADA
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.status === "paid"
                        ? `Paid ${participant.timeAgo}`
                        : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-8">
              <Link
                href="/payment"
                className="flex-1 btn-primary text-white py-3 rounded-lg font-semibold text-center"
              >
                Pay My Share ({totalAmount / totalParticipants} ADA)
              </Link>
              <button className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Share Bill
              </button>
            </div>

            {/* Contract Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Escrow Contract:</strong> addr1_script_abc123...
              </p>
              <p className="text-xs text-gray-500">
                Funds are held securely until all participants pay. Refunds
                available after 1 hour if incomplete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
