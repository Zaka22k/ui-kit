"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import Modal, { type ModalProps, type ModalFormRenderProps } from "./Modal";

export type OpenModalOptions = Omit<
  ModalProps,
  "isOpen" | "onClose" | "children"
> & {
  content: ReactNode | ((props: ModalFormRenderProps) => ReactNode);
  onClose?: () => void;
};

interface ModalContextValue {
  openModal: (options: OpenModalOptions) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);
export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenModalOptions | null>(null);
  const [modalKey, setModalKey] = useState(0);

  const onCloseRef = useRef<(() => void) | undefined>(undefined);
  onCloseRef.current = options?.onClose;

  const openModal = useCallback((newOptions: OpenModalOptions) => {
    setOptions(newOptions);
    setModalKey((k) => k + 1);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    onCloseRef.current?.();
  }, []);

  const contextValue = useMemo(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}

      {options && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={options.title}
          actionText={options.actionText}
          actionAppearance={options.actionAppearance}
          onAction={options.onAction}
          onError={options.onError}
          errorMessage={options.errorMessage}
          width={options.width}
          closeOnBackdropClick={options.closeOnBackdropClick}
          closeLabel={options.closeLabel}
          key={modalKey}
        >
          {options.content}
        </Modal>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal должен использоваться внутри <ModalProvider>");
  }
  return context;
};
