import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import { useNotify, useRecordContext } from 'react-admin';
import { adminHeaders, getApiBase } from '../auth';

type Scope = 'user' | 'all';

async function postTelegramNotify(body: { scope: Scope; user_id?: string }) {
  const response = await fetch(`${getApiBase()}/api/admin/notify/telegram`, {
    method: 'POST',
    headers: {
      ...adminHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    sent?: number;
    failed?: number;
    skipped?: number;
  };
  if (!response.ok) {
    throw new Error(payload.message || `HTTP ${response.status}`);
  }
  return payload;
}

type TelegramNotifyDialogProps = {
  open: boolean;
  scope: Scope;
  userId?: string;
  onClose: () => void;
};

function TelegramNotifyDialog({
  open,
  scope,
  userId,
  onClose,
}: TelegramNotifyDialogProps) {
  const notify = useNotify();
  const [busy, setBusy] = useState(false);

  const title =
    scope === 'all'
      ? 'Рассылка в Telegram всем пользователям'
      : 'Отправить напоминание в Telegram';

  const description =
    scope === 'all'
      ? 'Бот отправит сообщение «Погадаем» с кнопкой Mini App всем, у кого привязан Telegram. Это может занять несколько минут.'
      : 'Бот отправит персональное напоминание с кнопкой Mini App (как автоматический nudge). Пользователь должен иметь telegram_id.';

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const result = await postTelegramNotify({
        scope,
        user_id: scope === 'user' ? userId : undefined,
      });
      if (scope === 'all') {
        notify(
          `Рассылка: отправлено ${result.sent ?? 0}, ошибок ${result.failed ?? 0}, пропущено ${result.skipped ?? 0}`,
          { type: 'info' },
        );
      } else {
        notify('Сообщение отправлено в Telegram', { type: 'info' });
      }
      onClose();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Ошибка отправки', {
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Отмена
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => void handleConfirm()}
          disabled={busy || (scope === 'user' && !userId)}
          startIcon={<SendIcon />}
        >
          {busy ? 'Отправка…' : 'Отправить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TelegramBroadcastButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<SendIcon />}
        onClick={() => setOpen(true)}
      >
        Рассылка в Telegram
      </Button>
      <TelegramNotifyDialog open={open} scope="all" onClose={() => setOpen(false)} />
    </>
  );
}

export function TelegramUserNotifyButton() {
  const [open, setOpen] = useState(false);
  const record = useRecordContext();

  if (!record?.id || !record.telegram_id) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<SendIcon />}
        onClick={() => setOpen(true)}
      >
        Telegram-напоминание
      </Button>
      <TelegramNotifyDialog
        open={open}
        scope="user"
        userId={String(record.id)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
