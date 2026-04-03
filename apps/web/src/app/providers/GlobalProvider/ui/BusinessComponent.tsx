import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HelloScreen from 'features/HelloScreen/ui/HelloScreen';
import { useData } from 'shared/DataProvider';
import { AsyncMemoryKey } from 'shared/lib';
import { ModalsContext } from 'shared/ui/ModalsProvider';

export function BusinessComponent() {
  const { showModal } = useData({ Context: ModalsContext });

  // useEffect(() => {
  //   async function checkHello() {
  //     const viewedScreen = await AsyncStorage.getItem(
  //       AsyncMemoryKey.ViewedHelloScreen
  //     );
  //
  //     if (viewedScreen) {
  //       return;
  //     }
  //
  //     showModal?.(<HelloScreen />);
  //   }
  //
  //   checkHello();
  // }, []);

  return null;
}
