import React, { createContext, useContext, useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ModalContextType {
  showModal: (msg: string, onOk?: (() => any) | null) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [onOkCallback, setOnOkCallback] = useState<(() => any) | null>(null);

  const showModal = (msg: string, onOk?: (() => any) | null) => {
    setMessage(msg);
    setOnOkCallback(() => onOk || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setMessage("");
    setOnOkCallback(null);
  };

  const handleOk = async () => {
    if (onOkCallback) {
      try {
        await onOkCallback();
      } catch (err) {
        console.error("Erro no callback do modal:", err);
      }
    }
    closeModal();
  };

  const value: ModalContextType = {
    showModal,
    closeModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <div id="modal" className="modal" style={{ display: "flex", zIndex: 1000 }}>
          <div className="modal__content card">
            <div id="mm" style={{ marginBottom: "16px", textAlign: "center" }} dangerouslySetInnerHTML={{ __html: message }} />
            <div className="modal__actions" style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              {onOkCallback && (
                <button id="mok" className="btn btn--sm" onClick={handleOk}>
                  {t("btn_confirm")}
                </button>
              )}
              <button className="btn btn--sm btn--outline" onClick={closeModal}>
                {t("btn_cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal deve ser usado dentro de um ModalProvider");
  return context;
}
