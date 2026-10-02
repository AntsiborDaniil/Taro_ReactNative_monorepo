import {
  Datagrid,
  DateField,
  Edit,
  List,
  NumberField,
  ReferenceField,
  SelectField,
  SelectInput,
  Show,
  SimpleForm,
  SimpleList,
  SimpleShowLayout,
  TextField,
  TextInput,
  WrapperField,
} from 'react-admin';
import { LongTextField } from '../components/LongTextField';
import { useIsMobile } from '../components/useIsMobile';

const statusChoices = [
  { id: 'open', name: 'open' },
  { id: 'answered', name: 'answered' },
  { id: 'closed', name: 'closed' },
];

const ticketFilters = [
  <TextInput key="q" label="Поиск" source="q" alwaysOn />,
  <SelectInput key="status" label="Статус" source="status" choices={statusChoices} />,
  <TextInput key="telegram_id" label="Telegram ID" source="telegram_id" />,
  <TextInput key="user_id" label="User ID" source="user_id" />,
];

export function TicketList() {
  const isMobile = useIsMobile();

  return (
    <List
      filters={ticketFilters}
      sort={{ field: 'created_at', order: 'DESC' }}
      title="Поддержка"
      perPage={25}
    >
      {isMobile ? (
        <SimpleList
          primaryText={(record) => record.display_name || record.username || String(record.telegram_id)}
          secondaryText={(record) => {
            const msg = typeof record.message === 'string' ? record.message : '';
            const short = msg.length > 90 ? `${msg.slice(0, 89)}…` : msg;
            return `${record.status} · ${short}`;
          }}
          tertiaryText={(record) =>
            record.created_at ? new Date(record.created_at).toLocaleString('ru-RU') : ''
          }
          linkType="show"
          rowSx={(record) =>
            record.status === 'open'
              ? { borderLeft: '3px solid', borderColor: 'warning.main' }
              : {}
          }
        />
      ) : (
        <Datagrid rowClick="show" bulkActionButtons={false}>
          <SelectField source="status" choices={statusChoices} label="Статус" />
          <NumberField source="telegram_id" label="Telegram ID" />
          <TextField source="username" emptyText="—" />
          <TextField source="display_name" label="Имя" emptyText="—" />
          <TextField source="message" label="Вопрос" />
          <DateField source="created_at" showTime label="Создан" />
        </Datagrid>
      )}
    </List>
  );
}

export function TicketShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <SelectField source="status" choices={statusChoices} label="Статус" />
        <NumberField source="telegram_id" label="Telegram ID" />
        <TextField source="username" emptyText="—" />
        <TextField source="display_name" label="Имя" emptyText="—" />
        <ReferenceField source="user_id" reference="users" label="Профиль" link="show" />
        <TextField source="profile_email" label="Email профиля" emptyText="—" />
        <TextField source="profile_name" label="Имя профиля" emptyText="—" />
        <TextField source="profile_role" label="Роль" emptyText="—" />
        <NumberField source="profile_credits" label="Заряды" emptyText="—" />
        <WrapperField label="Вопрос">
          <LongTextField source="message" />
        </WrapperField>
        <WrapperField label="Ответ">
          <LongTextField source="admin_reply" emptyText="Ещё нет ответа" />
        </WrapperField>
        <DateField source="created_at" showTime label="Создан" />
        <DateField source="updated_at" showTime label="Обновлён" />
      </SimpleShowLayout>
    </Show>
  );
}

export function TicketEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="telegram_id" disabled />
        <TextInput source="message" multiline rows={4} disabled label="Вопрос" />
        <SelectInput source="status" choices={statusChoices} label="Статус" />
        <TextInput
          source="admin_reply"
          label="Ответ пользователю (уйдёт в бот)"
          helperText="Заголовок «Ответ поддержки», цитата вопроса и подсказка про /support добавляются автоматически — пиши только по делу."
          multiline
          rows={6}
        />
      </SimpleForm>
    </Edit>
  );
}
