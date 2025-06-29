import React, { createContext, useContext } from "react";
import { Toaster, toast } from "sonner";

interface ToastContextType {
  toast: typeof toast;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <ToastContext.Provider value={{ toast }}>
      <Toaster position="top-right" />
      {children}
    </ToastContext.Provider>
  );
};
