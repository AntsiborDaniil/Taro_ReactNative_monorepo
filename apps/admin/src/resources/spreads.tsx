import {
  Datagrid,
  DateField,
  Edit,
  List,
  NumberField,
  ReferenceField,
  SelectInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
} from 'react-admin';

const categoryChoices = [
  { id: 'simple', name: 'simple' },
  { id: 'thematic', name: 'thematic' },
  { id: 'universal', name: 'universal' },
  { id: 'selfDevelopment', name: 'selfDevelopment' },
  { id: 'choice', name: 'choice' },
];

const spreadFilters = [
  <TextInput key="q" label="Поиск" source="q" alwaysOn />,
  <SelectInput key="category" label="Категория" source="category" choices={categoryChoices} />,
  <TextInput key="spread_key" label="Тип расклада" source="spread_key" />,
  <TextInput key="user_id" label="User ID" source="user_id" />,
];

export function SpreadList() {
  return (
    <List filters={spreadFilters} sort={{ field: 'created_at', order: 'DESC' }}>
      <Datagrid rowClick="show">
        <TextField source="spread_key" label="Ключ" />
        <TextField source="category" label="Категория" />
        <TextField source="name" label="Название" />
        <NumberField source="cards_count" label="Карт" />
        <ReferenceField source="user_id" reference="users" label="Пользователь" link="edit" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function SpreadShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <ReferenceField source="user_id" reference="users" link="edit" />
        <TextField source="spread_key" />
        <TextField source="category" />
        <TextField source="name" />
        <TextField source="question" />
        <TextField source="interpretation" />
        <NumberField source="cards_count" />
        <DateField source="created_at" showTime />
        <DateField source="updated_at" showTime />
      </SimpleShowLayout>
    </Show>
  );
}

export function SpreadEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="spread_key" disabled />
        <TextInput source="name" />
        <TextInput source="question" multiline />
        <TextInput source="interpretation" multiline />
      </SimpleForm>
    </Edit>
  );
}
