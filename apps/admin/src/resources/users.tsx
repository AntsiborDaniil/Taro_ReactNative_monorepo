import {
  BooleanInput,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  EmailField,
  List,
  NumberField,
  NumberInput,
  ReferenceManyField,
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

const roleChoices = [
  { id: 'user', name: 'user' },
  { id: 'admin', name: 'admin' },
  { id: 'supervisor', name: 'supervisor' },
];

const userFilters = [
  <TextInput key="q" label="Поиск (email, имя, telegram id)" source="q" alwaysOn />,
  <SelectInput key="role" label="Роль" source="role" choices={roleChoices} />,
  <BooleanInput key="hasCredits" label="Есть заряды" source="hasCredits" />,
];

export function UserList() {
  return (
    <List filters={userFilters} sort={{ field: 'created_at', order: 'DESC' }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <EmailField source="email" />
        <TextField source="name" label="Имя" />
        <TextField source="telegram_id" label="Telegram ID" />
        <SelectField source="role" choices={roleChoices} label="Роль" />
        <NumberField source="spread_credits" label="Заряды" />
        <DateField source="created_at" label="Создан" showTime />
        <EditButton />
      </Datagrid>
    </List>
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
        <EmailField source="email" emptyText="—" />
        <TextField source="name" emptyText="—" />
        <TextField source="telegram_id" emptyText="—" />
        <TextField source="role" />
        <NumberField source="spread_credits" label="Заряды" />
        <NumberField source="spreads_count" label="Раскладов" />
        <NumberField source="daily_used" label="Дневных слотов сегодня" />
        <DateField source="created_at" showTime />
        <ReferenceManyField
          label="Расклады"
          reference="spreads"
          target="user_id"
          perPage={10}
          sort={{ field: 'created_at', order: 'DESC' }}
        >
          <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="spread_key" />
            <TextField source="category" />
            <TextField source="name" />
            <DateField source="created_at" showTime />
          </Datagrid>
        </ReferenceManyField>
      </SimpleShowLayout>
    </Show>
  );
}

export function UserEdit() {
  const { permissions } = usePermissions();
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="email" disabled />
        <TextInput source="name" />
        <TextInput source="telegram_id" disabled />
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
