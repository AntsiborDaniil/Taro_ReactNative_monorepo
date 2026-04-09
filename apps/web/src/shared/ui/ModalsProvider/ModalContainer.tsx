import { Modal } from 'react-native';
import { useData } from 'shared/DataProvider';
import { ModalsContext } from './ModalsContext';

function ModalContainer() {
  const { isModalVisible, modalContent } = useData({ Context: ModalsContext });

  return (
    <Modal animationType="slide" transparent={true} visible={isModalVisible}>
      {modalContent}
    </Modal>
  );
}

export default ModalContainer;
