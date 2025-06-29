"use client";
import { WalletProvider } from "./WalletContext";
import { ModalProvider } from "./ModalContext";
import { QueryProvider } from "./QueryContext";
import { ToastProvider } from "./ToastContext";

export function AppContextProvider({ children }) {
  return (
    <ToastProvider>
      <QueryProvider>
        <WalletProvider>
          <ModalProvider>{children}</ModalProvider>
        </WalletProvider>
      </QueryProvider>
    </ToastProvider>
  );
}
