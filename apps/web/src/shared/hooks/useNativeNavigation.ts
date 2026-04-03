import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationRoute, TabRoute } from '../types';

export type TNavigationParams = Record<string, any>;

export type RootStackParamList = {
  [key in TabRoute]?: {
    screen: NavigationRoute;
    params?: TNavigationParams;
  };
};

export function useNativeNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}
