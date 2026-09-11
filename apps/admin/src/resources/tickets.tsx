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
  SimpleShowLayout,
  TextField,
  TextInput,
} from 'react-admin';

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
  return (
    <List
      filters={ticketFilters}
      sort={{ field: 'created_at', order: 'DESC' }}
      title="Поддержка"
    >
      <Datagrid rowClick="show">
        <SelectField source="status" choices={statusChoices} />
        <NumberField source="telegram_id" label="Telegram ID" />
        <TextField source="username" />
        <TextField source="display_name" label="Имя" />
        <TextField source="message" label="Вопрос" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function TicketShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <SelectField source="status" choices={statusChoices} />
        <NumberField source="telegram_id" />
        <TextField source="username" />
        <TextField source="display_name" />
        <ReferenceField source="user_id" reference="users" label="Профиль" link="edit" />
        <TextField source="profile_email" label="Email профиля" />
        <TextField source="profile_name" label="Имя профиля" />
        <TextField source="profile_role" label="Роль" />
        <NumberField source="profile_credits" label="Заряды" />
        <TextField source="message" label="Вопрос" />
        <TextField source="admin_reply" label="Ответ" />
        <DateField source="created_at" showTime />
        <DateField source="updated_at" showTime />
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
        <TextInput source="message" multiline disabled />
        <SelectInput source="status" choices={statusChoices} />
        <TextInput
          source="admin_reply"
          label="Ответ пользователю (уйдёт в бот)"
          multiline
        />
      </SimpleForm>
    </Edit>
  );
}
