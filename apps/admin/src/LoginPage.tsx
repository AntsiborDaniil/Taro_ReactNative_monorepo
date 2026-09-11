import { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

export function LoginPage() {
  const login = useLogin();
  const notify = useNotify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login({ email, password, username: email });
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Ошибка входа', {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#171F2C',
        p: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={onSubmit}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          bgcolor: '#1E232B',
          color: '#F4F4F5',
        }}
      >
        <Typography variant="h5" sx={{ color: '#F6C01B', mb: 1 }}>
          Mindful Tarot
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.75, mb: 3 }}>
          Админ-панель. Вход только с сайта, не из Mini App.
        </Typography>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
          autoComplete="username"
        />
        <TextField
          fullWidth
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          autoComplete="current-password"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mt: 2, bgcolor: '#F6C01B', color: '#171F2C' }}
        >
          {loading ? 'Входим…' : 'Войти'}
        </Button>
      </Paper>
    </Box>
  );
}
