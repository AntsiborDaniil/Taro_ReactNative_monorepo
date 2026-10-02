import { useRecordContext } from 'react-admin';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type FollowUp = { q: string; a: string; createdAt?: string };

/** Блок уточняющих вопросов из payload.followUps (обогащённый API как follow_ups). */
export function FollowUpsField() {
  const record = useRecordContext();
  const items = (Array.isArray(record?.follow_ups) ? record.follow_ups : []) as FollowUp[];

  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Уточнений нет
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 720 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Уточнения ({items.length}/3)
      </Typography>
      {items.map((item, index) => (
        <Paper
          key={`${index}-${item.q.slice(0, 24)}`}
          variant="outlined"
          sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.default' }}
        >
          <Typography variant="caption" color="text.secondary">
            Уточнение {index + 1}
            {item.createdAt
              ? ` · ${new Date(item.createdAt).toLocaleString('ru-RU')}`
              : ''}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Вопрос
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {item.q}
            </Typography>
          </Box>
          <Box sx={{ mt: 1.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Ответ ИИ
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {item.a}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
