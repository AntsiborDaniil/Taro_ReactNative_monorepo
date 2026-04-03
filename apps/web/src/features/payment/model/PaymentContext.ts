import { createContext } from 'react';
import { TPaymentHookResult } from './types';

type TPaymentContextData = TPaymentHookResult;

export const PaymentContext = createContext<Partial<TPaymentContextData>>({});
