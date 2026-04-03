import { ReactElement, useState } from 'react';

export type TModalsHookResult = {
  showModal: (modalContent: ReactElement) => void;
  closeModal: () => void;
  isModalVisible: boolean;
  modalContent: ReactElement | null;
};

export function useModals(): TModalsHookResult {
  const [modalContent, setModalContent] = useState<ReactElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const showModal = (modal: ReactElement) => {
    setModalContent(modal);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalContent(null);
  };

  return {
    isModalVisible,
    showModal,
    closeModal,
    modalContent,
  };
}
