import { CustomerInfo } from 'react-native-purchases';
import { SubscriptionType } from 'shared/api';

export type TUserHookResult = {
  customerInfo?: CustomerInfo | null;
  subscriptionType: SubscriptionType | null;
  isPractitioner: boolean;
  setSubscriptionType: (subscriptionType: SubscriptionType) => void;
};
