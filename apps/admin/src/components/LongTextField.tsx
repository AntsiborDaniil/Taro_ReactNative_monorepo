import { useRecordContext } from 'react-admin';
import Typography from '@mui/material/Typography';

type Props = {
  source: string;
  label?: string;
  emptyText?: string;
};

/** Длинный текст с переносами — для вопроса, толкования, сообщений поддержки. */
export function LongTextField({ source, emptyText = '—' }: Props) {
  const record = useRecordContext();
  const raw = record?.[source];
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Typography
      variant="body2"
      component="div"
      sx={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxWidth: { xs: '100%', md: 720 },
        lineHeight: 1.55,
      }}
    >
      {value}
    </Typography>
  );
}
