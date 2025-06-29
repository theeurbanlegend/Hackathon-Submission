"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePostCreateBill } from "@/hooks/useBillMutations";
import { useWallet } from "@/context/WalletContext";

export default function CreateBillPage() {
  const router = useRouter();
  const {
    userWallet: { address },
  } = useWallet();
  const { mutateAsync, isPending: isSubmitting } = usePostCreateBill();
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    participants: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.participants) {
      alert("Please fill in all required fields");
      return;
    }

    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    const data = await mutateAsync({
      creatorAddress: address,
      title: formData.title,
      totalAmount: parseFloat(formData.amount),
      participantCount: parseInt(formData.participants, 10),
      description: formData.description || undefined,
      receiptImagePath: "", // Assuming no receipt image for now
    });

    // Simulate bill creation and contract deployment
    setTimeout(() => {
      router.push("/bills-details/abc123");
    }, 2000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl card-shadow p-8">
        <div className="flex items-center mb-8">
          <button
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            type="button"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Create New Bill</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Dinner at Mario's Restaurant"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (ADA)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="100"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of People
              </label>
              <input
                type="number"
                name="participants"
                value={formData.participants}
                onChange={handleInputChange}
                placeholder="4"
                min="2"
                max="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Great Italian food with friends!"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Smart Contract Escrow</p>
                <p>
                  Funds will be held in a secure smart contract until all
                  participants pay. Participants can get refunds after 1 hour if
                  the bill isn't complete.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Link
              href="/"
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting
                ? "Deploying Contract..."
                : "Create Bill & Deploy Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
