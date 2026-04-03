import { PurchasesOfferings } from 'react-native-purchases';

export type TPaymentHookParameters = {
  closeModal: () => void;
};

export type TPaymentHookResult = {
  offerings?: PurchasesOfferings | null;
  isLoading?: boolean;
  handleRestorePurchase?: () => Promise<void>;
  handlePurchase?: (checkedId: string) => Promise<void>;
};
