import { useEffect, useState } from 'react';
import { Title, useRedirect } from 'react-admin';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import PeopleIcon from '@mui/icons-material/People';
import StyleIcon from '@mui/icons-material/Style';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PaymentsIcon from '@mui/icons-material/Payments';
import { adminHeaders, getApiBase } from './auth';
import { TelegramBroadcastButton } from './components/TelegramNotifyButtons';

type AcquisitionStats = {
  total: number;
  rows: Array<{ source: string; label: string; count: number }>;
};

const links = [
  {
    title: 'Пользователи',
    hint: 'Роли, заряды, источники входа',
    to: 'users',
    icon: <PeopleIcon />,
  },
  {
    title: 'Расклады',
    hint: 'Вопросы, толкования, уточнения ИИ',
    to: 'spreads',
    icon: <StyleIcon />,
  },
  {
    title: 'Поддержка',
    hint: 'Тикеты из бота',
    to: 'tickets',
    icon: <SupportAgentIcon />,
  },
  {
    title: 'Оплаты',
    hint: 'Lava checkout и статусы',
    to: 'payments',
    icon: <PaymentsIcon />,
  },
];

export function Dashboard() {
  const redirect = useRedirect();
  const [stats, setStats] = useState<AcquisitionStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${getApiBase()}/api/admin/acquisition-stats`, {
          headers: adminHeaders(),
          credentials: 'include',
        });
        if (!response.ok) return;
        const body = (await response.json()) as AcquisitionStats;
        if (!cancelled) setStats(body);
      } catch {
        /* dashboard soft-fail */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1100 }}>
      <Title title="Обзор" />
      <Typography variant="h5" sx={{ mb: 0.5, color: 'primary.main' }}>
        Mindful Tarot Admin
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Пользователи, расклады с уточнениями, поддержка и оплаты. На узком экране списки
        переключаются в карточки.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TelegramBroadcastButton />
      </Box>

      {stats ? (
        <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Лиды по источникам бота — {stats.total}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {stats.rows.map((row) => (
                <Box key={row.source} sx={{ minWidth: 96 }}>
                  <Typography variant="caption" color="text.secondary">
                    {row.label}
                  </Typography>
                  <Typography variant="h6">{row.count}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {links.map((item) => (
          <Card key={item.to} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {item.icon}
                <Typography variant="h6">{item.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {item.hint}
              </Typography>
            </CardContent>
            <CardActions sx={{ flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => redirect('list', item.to)}>
                Открыть
              </Button>
              {item.to === 'spreads' ? (
                <Button
                  size="small"
                  onClick={() =>
                    redirect('list', 'spreads', undefined, {}, { filter: { has_follow_ups: true } })
                  }
                >
                  С уточнениями
                </Button>
              ) : null}
              {item.to === 'tickets' ? (
                <Button
                  size="small"
                  onClick={() =>
                    redirect('list', 'tickets', undefined, {}, { filter: { status: 'open' } })
                  }
                >
                  Открытые
                </Button>
              ) : null}
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
