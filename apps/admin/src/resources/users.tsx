import { useEffect, useState } from 'react';
import {
  BooleanInput,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  SelectField,
  SelectInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar,
  usePermissions,
} from 'react-admin';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { adminHeaders, getApiBase } from '../auth';

const roleChoices = [
  { id: 'user', name: 'user' },
  { id: 'admin', name: 'admin' },
  { id: 'supervisor', name: 'supervisor' },
];

const acquisitionChoices = [
  { id: 'ig_bio', name: 'Instagram bio' },
  { id: 'ig_stories', name: 'Instagram stories' },
  { id: 'yt_shorts', name: 'YouTube Shorts' },
  { id: 'other', name: 'Other' },
];

const userFilters = [
  <TextInput key="q" label="Поиск (email, имя, telegram id)" source="q" alwaysOn />,
  <SelectInput key="role" label="Роль" source="role" choices={roleChoices} />,
  <SelectInput
    key="acquisition_source"
    label="Источник"
    source="acquisition_source"
    choices={acquisitionChoices}
  />,
  <BooleanInput key="hasCredits" label="Есть заряды" source="hasCredits" />,
];

type AcquisitionStats = {
  total: number;
  rows: Array<{ source: string; label: string; count: number }>;
};

function AcquisitionSummary() {
  const [stats, setStats] = useState<AcquisitionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${getApiBase()}/api/admin/acquisition-stats`, {
          headers: adminHeaders(),
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const body = (await response.json()) as AcquisitionStats;
        if (!cancelled) {
          setStats(body);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="error">
          Аналитика источников: {error}
        </Typography>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Источники входа (бот start=…) — всего лидов: {stats.total}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {stats.rows.map((row) => (
          <Box key={row.source} sx={{ minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">
              {row.label}
            </Typography>
            <Typography variant="h6">{row.count}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function UserList() {
  return (
    <Box>
      <AcquisitionSummary />
      <List filters={userFilters} sort={{ field: 'created_at', order: 'DESC' }}>
        <Datagrid rowClick="edit" bulkActionButtons={false}>
          <TextField source="email" label="Email" />
          <TextField source="name" label="Имя" />
          <TextField source="telegram_id" label="Telegram ID" />
          <SelectField
            source="acquisition_source"
            label="Источник"
            choices={acquisitionChoices}
            emptyText="—"
          />
          <DateField source="acquisition_at" label="Источник с" showTime emptyText="—" />
          <SelectField source="role" choices={roleChoices} label="Роль" />
          <NumberField source="spread_credits" label="Заряды" />
          <DateField source="created_at" label="Создан" showTime />
          <EditButton />
        </Datagrid>
      </List>
    </Box>
  );
}

function UserShowActions() {
  return (
    <TopToolbar>
      <EditButton />
    </TopToolbar>
  );
}

export function UserShow() {
  return (
    <Show actions={<UserShowActions />}>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="email" emptyText="—" />
        <TextField source="name" emptyText="—" />
        <TextField source="telegram_id" emptyText="—" />
        <SelectField
          source="acquisition_source"
          label="Источник"
          choices={acquisitionChoices}
          emptyText="—"
        />
        <DateField source="acquisition_at" label="Источник зафиксирован" showTime emptyText="—" />
        <TextField source="role" />
        <NumberField source="spread_credits" label="Заряды" />
        <NumberField source="spreads_count" label="Раскладов" />
        <NumberField source="daily_used" label="Дневных слотов сегодня" />
        <DateField source="created_at" showTime />
      </SimpleShowLayout>
    </Show>
  );
}

export function UserEdit() {
  const { permissions } = usePermissions();
  return (
    <Edit mutationMode="pessimistic" queryOptions={{ retry: 2 }}>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="email" disabled />
        <TextInput source="name" />
        <TextInput source="telegram_id" disabled />
        <SelectInput
          source="acquisition_source"
          label="Источник"
          choices={acquisitionChoices}
          disabled
          emptyText="—"
        />
        <TextInput source="acquisition_at" label="Источник зафиксирован" disabled />
        {permissions === 'supervisor' ? (
          <SelectInput
            source="role"
            choices={roleChoices}
            helperText="Роль меняет только supervisor"
          />
        ) : (
          <TextInput source="role" disabled />
        )}
        <NumberInput
          source="spread_credits"
          label="Заряды"
          min={0}
          helperText="Итоговый баланс зарядов пользователя (можно выдать вручную)"
        />
      </SimpleForm>
    </Edit>
  );
}
