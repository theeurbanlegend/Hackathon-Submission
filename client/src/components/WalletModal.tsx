import { useWallet } from "@/context/WalletContext";
import React from "react";

interface WalletModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    walletConnectionState: { isConnecting },
    availableWallets,
    connect,
  } = useWallet();

  if (!isOpen) return null;

  const handleConnect = async (walletType: string) => {
    try {
      console.log(`Connecting to ${walletType}...`);
      await connect(walletType);
      console.log(`${walletType} connected successfully!`);
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-500/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Connect Wallet
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {availableWallets.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">
              No wallets available. Please install a wallet extension.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Choose your preferred wallet to connect
            </p>

            <div className="space-y-3">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleConnect(wallet.name)}
                  disabled={isConnecting}
                >
                  <img
                    src={wallet.icon}
                    alt={wallet.name}
                    className="w-6 h-6 mr-3"
                  />
                  <span className="font-medium text-gray-900">
                    {wallet.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isConnecting && (
          <div className="flex items-center justify-center text-blue-600 absolute top-0 left-0  backdrop-blur-xs w-full h-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span>Connecting...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
