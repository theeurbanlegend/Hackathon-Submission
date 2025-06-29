import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { BrowserWallet, Wallet } from "@meshsdk/core";
import { CardanoNetwork } from "@/types/api.types";

interface WalletContextType {
  walletConnectionState: WalletConnectionState;
  userWallet: UserWallet;
  availableWallets: Wallet[];
  connect: (walletName: string) => void;
  signAndSubmitTxFromHex: (txHex: string) => Promise<string>;
  disconnect: () => void;
}

interface UserWallet {
  address: string;
  balance: number;
  walletApi?: BrowserWallet;
}

interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletConnectionState, setWalletConnectionState] =
    useState<WalletConnectionState>({
      isConnected: false,
      isConnecting: false,
    });
  const [userWallet, setUserWallet] = useState<UserWallet>({
    address: "",
    balance: 0,
    walletApi: undefined,
  });
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);

  const updateUserWallet = (data: Partial<UserWallet>) => {
    setUserWallet((prev) => ({
      ...prev,
      ...(data as UserWallet),
    }));
  };

  const resetUserWallet = () => {
    setUserWallet((prev) => ({
      ...prev,
      address: "",
      balance: 0,
      walletApi: undefined,
    }));
  };

  const updateWalletConnectionState = (
    data: Partial<WalletConnectionState>
  ) => {
    setWalletConnectionState((prev) => ({
      ...prev,
      ...(data as WalletConnectionState),
    }));
  };

  const connect = async (walletName: string) => {
    if (walletConnectionState.isConnecting) return;
    updateWalletConnectionState({ isConnecting: true });
    try {
      const wallet = await BrowserWallet.enable(walletName);
      const networkId = await wallet.getNetworkId();
      if (networkId !== CardanoNetwork.Testnet) {
        throw new Error(
          `We are still on the beta phase, mainnet version will be available soon. Please switch to Testnet network in your wallet settings.`
        );
      }
      const address = await wallet.getChangeAddress();
      const balance = await wallet.getBalance();
      const totalBalance =
        balance.filter((b) => b.unit === "lovelace")[0]?.quantity || 0;

      updateUserWallet({
        address,
        balance: Number(totalBalance),
        walletApi: wallet,
      });
      updateWalletConnectionState({ isConnected: true, isConnecting: false });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to connect wallet"
      );
    } finally {
      updateWalletConnectionState({ isConnecting: false });
    }
  };

  useEffect(() => {
    async function fetchAvailableWallets() {
      const availableWallets = await BrowserWallet.getAvailableWallets();
      setAvailableWallets(availableWallets);
    }
    fetchAvailableWallets();
  }, []);

  const signAndSubmitTxFromHex = async (txHex: string) => {
    if (!userWallet.walletApi) {
      throw new Error("Wallet not connected");
    }
    try {
      const signedTx = await userWallet.walletApi.signTx(txHex);
      const txHash = await userWallet.walletApi.submitTx(signedTx);
      return txHash;
    } catch (error) {
      console.error("Failed to sign and submit transaction:", error);
      throw new Error("Transaction submission failed");
    }
  };

  const disconnect = () => {
    if (!walletConnectionState.isConnected) return;
    updateWalletConnectionState({ isConnected: false, isConnecting: false });
    resetUserWallet();
  };

  const value = useMemo(
    () => ({
      walletConnectionState,
      userWallet,
      availableWallets,
      connect,
      signAndSubmitTxFromHex,
      disconnect,
    }),
    [walletConnectionState, userWallet, availableWallets]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
