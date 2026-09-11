import { CustomerInfo } from 'react-native-purchases';
import { SubscriptionType } from 'shared/api';

export type TarotDailyQuota = {
  used: number;
  limit: number;
  day: string;
};

export type AuthSessionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type TUserHookResult = {
  customerInfo?: CustomerInfo | null;
  subscriptionType: SubscriptionType | null;
  isPractitioner: boolean;
  setSubscriptionType: (subscriptionType: SubscriptionType) => void;
  /** Web: сессия из cookie + /api/auth/me */
  isAuthenticated?: boolean;
  authUser?: AuthSessionUser | null;
  tarotDaily?: TarotDailyQuota | null;
  spreadCredits?: number;
  authSessionLoading?: boolean;
  refreshAuthSession?: () => Promise<void>;
  /** Web: refresh only tarotDaily / spreadCredits without auth loading flash. */
  refreshSpreadQuota?: () => Promise<void>;
  setTarotDaily?: (daily: TarotDailyQuota | null) => void;
  setSpreadCredits?: (credits: number) => void;
};
