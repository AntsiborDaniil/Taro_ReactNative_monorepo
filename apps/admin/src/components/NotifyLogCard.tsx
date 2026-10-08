import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { adminHeaders, getApiBase } from '../auth';

type NotifyLogEntry = {
  kind: 'daily_free' | 'broadcast_deploy' | 'broadcast_admin' | 'user_admin';
  at: string;
  sent: number;
  failed: number;
  skipped: number;
  userId?: string;
};

type NotifyOverview = {
  entries: NotifyLogEntry[];
  dailyFreeToday: number;
  day: string;
};

const KIND_LABEL: Record<NotifyLogEntry['kind'], string> = {
  daily_free: 'Бесплатный расклад доступен (крон)',
  broadcast_deploy: 'Рассылка после деплоя',
  broadcast_admin: 'Рассылка из админки',
  user_admin: 'Пользователю из админки',
};

const dateTime = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Плашка «Уведомления бота»: когда и сколько сообщений бот отправил
 * (журнал GET /api/admin/notify-log, последние 50 запусков) и сколько
 * пользователей получили «бесплатный расклад доступен» за текущие сутки.
 */
export function NotifyLogCard() {
  const [data, setData] = useState<NotifyOverview | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/admin/notify-log`, {
        headers: adminHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(String(response.status));
      setData((await response.json()) as NotifyOverview);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = data?.entries ?? [];
  const last = entries[0];
  const shown = expanded ? entries : entries.slice(0, 5);

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <NotificationsIcon />
          <Typography variant="h6" sx={{ flex: 1 }}>
            Уведомления бота
          </Typography>
          <Button size="small" onClick={() => void load()}>
            Обновить
          </Button>
        </Box>

        {error ? (
          <Typography variant="body2" color="error">
            Не удалось загрузить журнал уведомлений.
          </Typography>
        ) : !data ? (
          <Typography variant="body2" color="text.secondary">
            Загрузка…
          </Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Последняя отправка
                </Typography>
                <Typography variant="h6">{last ? dateTime.format(new Date(last.at)) : '—'}</Typography>
                {last ? (
                  <Typography variant="caption" color="text.secondary">
                    {KIND_LABEL[last.kind]}
                  </Typography>
                ) : null}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Получили дневное уведомление сегодня ({data.day}, UTC)
                </Typography>
                <Typography variant="h6">{data.dailyFreeToday}</Typography>
              </Box>
            </Box>

            {entries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Запусков пока не было. Журнал пишется с этого релиза; крон шлёт с 06:00 до 18:00 UTC.
              </Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
                {shown.map((entry) => (
                  <Box
                    component="li"
                    key={`${entry.at}-${entry.kind}`}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                      {dateTime.format(new Date(entry.at))}
                    </Typography>
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 180 }}>
                      {KIND_LABEL[entry.kind]}
                      {entry.userId ? ` · ${entry.userId.slice(0, 8)}…` : ''}
                    </Typography>
                    <Chip size="small" color="success" label={`отправлено ${entry.sent}`} />
                    {entry.failed > 0 ? <Chip size="small" color="error" label={`ошибок ${entry.failed}`} /> : null}
                    {entry.skipped > 0 ? <Chip size="small" label={`пропущено ${entry.skipped}`} /> : null}
                  </Box>
                ))}
              </Box>
            )}
            {entries.length > 5 ? (
              <Button size="small" sx={{ mt: 1 }} onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'Свернуть' : `Показать все (${entries.length})`}
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
