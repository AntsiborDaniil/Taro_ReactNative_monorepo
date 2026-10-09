import {
  BooleanField,
  BooleanInput,
  Datagrid,
  DateField,
  FunctionField,
  List,
  SelectField,
  SelectInput,
  Show,
  SimpleList,
  SimpleShowLayout,
  TextField,
  TextInput,
  useRecordContext,
} from 'react-admin';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import { useIsMobile } from '../components/useIsMobile';

const sourceChoices = [
  { id: 'ig_bio', name: 'Instagram bio' },
  { id: 'ig_stories', name: 'Instagram stories' },
  { id: 'yt_shorts', name: 'YouTube Shorts' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'other', name: 'Other' },
  { id: 'direct', name: 'Без метки (прямой /start)' },
];

const leadFilters = [
  <TextInput key="q" label="Поиск (username, имя, telegram id)" source="q" alwaysOn />,
  <SelectInput key="source" label="Источник" source="source" choices={sourceChoices} />,
  <BooleanInput key="opened" label="Открыл приложение" source="opened" />,
];

function UserLink() {
  const record = useRecordContext();
  if (!record?.user_id) return <span>—</span>;
  return (
    <Link component={RouterLink} to={`/users/${record.user_id}/show`}>
      Открыть пользователя
    </Link>
  );
}

export function LeadList() {
  const isMobile = useIsMobile();
  return (
    <List filters={leadFilters} sort={{ field: 'created_at', order: 'DESC' }} perPage={25}>
      {isMobile ? (
        <SimpleList
          primaryText={(record) =>
            record.display_name || (record.username ? `@${record.username}` : record.telegram_id)
          }
          secondaryText={(record) =>
            `${record.source} · ${record.opened_app ? 'в приложении' : 'только бот'}`
          }
          tertiaryText={(record) =>
            record.created_at ? new Date(record.created_at).toLocaleString('ru-RU') : ''
          }
          linkType="show"
        />
      ) : (
        <Datagrid rowClick="show" bulkActionButtons={false}>
          <TextField source="telegram_id" label="Telegram ID" />
          <FunctionField
            label="Username"
            sortable={false}
            render={(record: { username?: string }) =>
              record.username ? `@${record.username}` : '—'
            }
          />
          <TextField source="display_name" label="Имя" emptyText="—" sortable={false} />
          <SelectField source="source" label="Источник" choices={sourceChoices} />
          <BooleanField source="opened_app" label="Открыл приложение" sortable={false} />
          <DateField source="created_at" label="Первый /start" showTime />
          <DateField source="updated_at" label="Обновлён" showTime />
          <UserLink />
        </Datagrid>
      )}
    </List>
  );
}

export function LeadShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="telegram_id" label="Telegram ID" />
        <TextField source="username" label="Username" emptyText="—" />
        <TextField source="display_name" label="Имя" emptyText="—" />
        <SelectField source="source" label="Источник" choices={sourceChoices} />
        <BooleanField source="opened_app" label="Открыл приложение" />
        <DateField source="created_at" label="Первый /start" showTime />
        <DateField source="updated_at" label="Обновлён" showTime />
        <UserLink />
      </SimpleShowLayout>
    </Show>
  );
}
