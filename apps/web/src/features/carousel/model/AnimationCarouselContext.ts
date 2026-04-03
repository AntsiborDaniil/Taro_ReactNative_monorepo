import { createContext } from 'react';
import type { TAnimationCarouselHookResult } from './types';

type TAnimationCarouselContextData = TAnimationCarouselHookResult;

export const AnimationCarouselContext = createContext<
  Partial<TAnimationCarouselContextData>
>({});
