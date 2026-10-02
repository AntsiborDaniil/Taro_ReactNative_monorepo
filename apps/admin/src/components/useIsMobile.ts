import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

/** md и ниже — SimpleList вместо широкой таблицы. */
export function useIsMobile(): boolean {
  return useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
}
