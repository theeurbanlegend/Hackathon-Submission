import QRCodeModal from "@/components/QRCodeModal";
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
  QRCode = "QRCode",
}

interface ModalState {
  [ModalTypes.WalletConnect]: {
    isOpen: boolean;
    onClose?: () => void;
  };
  [ModalTypes.QRCode]: { url: string; isOpen: boolean; onClose?: () => void };
}

interface ModalContextType {
  modalState: ModalState;
  openModal: <T extends ModalTypes>(type: T, content: ModalState[T]) => void;
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
      onClose: undefined,
    },
    [ModalTypes.QRCode]: {
      isOpen: false,
      url: "",
      onClose: undefined,
    },
  });

  const openModal = <T extends ModalTypes>(type: T, content: ModalState[T]) => {
    setModalState((prev) => ({
      ...prev,
      [type]: {
        ...content,
        isOpen: true,
      },
    }));
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

      case ModalTypes.QRCode:
        setModalState((prev) => ({
          ...prev,
          [ModalTypes.QRCode]: {
            isOpen: false,
            url: "",
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
        onClose={() => {
          modalState[ModalTypes.WalletConnect].onClose?.();
          closeModal(ModalTypes.WalletConnect);
        }}
      />
      <QRCodeModal
        isOpen={modalState[ModalTypes.QRCode].isOpen}
        onClose={() => {
          modalState[ModalTypes.QRCode].onClose?.();
          closeModal(ModalTypes.QRCode);
        }}
        url={modalState[ModalTypes.QRCode].url as string}
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
