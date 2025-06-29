import WalletModal from "@/components/WalletModal";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";

export enum ModalTypes {
  WalletConnect = "WalletConnect",
}

interface ModalState {
  [ModalTypes.WalletConnect]: {
    isOpen: boolean;
    content?: ReactNode | null;
  };
}

interface ModalContextType {
  modalState: ModalState;
  openModal: (type: ModalTypes, content: ReactNode | null) => void;
  closeModal: (type: ModalTypes) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({
    [ModalTypes.WalletConnect]: {
      isOpen: false,
      content: null,
    },
  });

  const openModal = (type: ModalTypes, content: ReactNode | null) => {
    switch (type) {
      case ModalTypes.WalletConnect:
        setModalState((prev) => ({
          ...prev,
          [ModalTypes.WalletConnect]: {
            isOpen: true,
            content,
          },
        }));
        break;

      default:
        throw new Error(`Unknown modal type: ${type}`);
    }
  };

  const closeModal = (type: ModalTypes) => {
    switch (type) {
      case ModalTypes.WalletConnect:
        setModalState((prev) => ({
          ...prev,
          [ModalTypes.WalletConnect]: {
            isOpen: false,
            content: null,
          },
        }));
        break;

      default:
        throw new Error(`Unknown modal type: ${type}`);
    }
  };

  const value = useMemo(
    () => ({
      modalState,
      openModal,
      closeModal,
    }),
    [modalState]
  );

  return (
    <ModalContext.Provider value={value}>
      <WalletModal
        isOpen={modalState[ModalTypes.WalletConnect].isOpen}
        onClose={() => closeModal(ModalTypes.WalletConnect)}
      />
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
