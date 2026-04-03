import { createContext } from 'react';
import { TUserHookResult } from './types';

type TUserContext = TUserHookResult;

export const UserContext = createContext<Partial<TUserContext>>({});
