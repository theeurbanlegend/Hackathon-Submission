"use client";

import { Split } from "lucide-react";
import Link from "next/link";
import { ModalTypes, useModal } from "@/context/ModalContext";
import { useWallet } from "@/context/WalletContext";

export default function Navigation() {
  const {
    walletConnectionState: { isConnected },
    userWallet: { address },
    disconnect,
  } = useWallet();
  const { openModal } = useModal();

  const handleConnectWallet = () => {
    openModal(ModalTypes.WalletConnect, { isOpen: true });
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Split className="w-5 h-5 text-white" />
            </div>
            <Link href={"/"} className="text-xl font-bold text-gray-900">
              ADA Split Bills
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <button
                onClick={handleConnectWallet}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <div className="bg-green-100 px-3 py-2 rounded-lg text-sm">
                  <span className="text-green-800">
                    Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <div>
                  <button
                    onClick={disconnect}
                    className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
