import {
  BooleanField,
  BooleanInput,
  Datagrid,
  DateField,
  Edit,
  List,
  NumberField,
  ReferenceField,
  SelectInput,
  Show,
  SimpleForm,
  SimpleList,
  SimpleShowLayout,
  TextField,
  TextInput,
  WrapperField,
} from 'react-admin';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { FollowUpsField } from '../components/FollowUpsField';
import { LongTextField } from '../components/LongTextField';
import { useIsMobile } from '../components/useIsMobile';

const categoryChoices = [
  { id: 'simple', name: 'simple' },
  { id: 'thematic', name: 'thematic' },
  { id: 'universal', name: 'universal' },
  { id: 'selfDevelopment', name: 'selfDevelopment' },
  { id: 'choice', name: 'choice' },
];

const spreadFilters = [
  <TextInput key="q" label="Поиск (вопрос, толкование, уточнения)" source="q" alwaysOn />,
  <SelectInput key="category" label="Категория" source="category" choices={categoryChoices} />,
  <TextInput key="spread_key" label="Тип расклада" source="spread_key" />,
  <TextInput key="user_id" label="User ID" source="user_id" />,
  <BooleanInput key="has_follow_ups" label="Есть уточнения" source="has_follow_ups" />,
];

function FollowUpsCountField() {
  return (
    <WrapperField label="Уточнения">
      <NumberField source="follow_ups_count" />
    </WrapperField>
  );
}

export function SpreadList() {
  const isMobile = useIsMobile();

  return (
    <List filters={spreadFilters} sort={{ field: 'created_at', order: 'DESC' }} perPage={25}>
      {isMobile ? (
        <SimpleList
          primaryText={(record) => record.name || record.spread_key}
          secondaryText={(record) => {
            const q = record.question_preview || record.question || 'без вопроса';
            const fu = Number(record.follow_ups_count) || 0;
            return `${record.spread_key} · ${fu} уточн. · ${q}`;
          }}
          tertiaryText={(record) =>
            record.created_at ? new Date(record.created_at).toLocaleString('ru-RU') : ''
          }
          linkType="show"
          rowSx={(record) =>
            Number(record.follow_ups_count) > 0
              ? { borderLeft: '3px solid', borderColor: 'primary.main' }
              : {}
          }
        />
      ) : (
        <Datagrid rowClick="show" bulkActionButtons={false}>
          <TextField source="spread_key" label="Ключ" />
          <TextField source="category" label="Категория" />
          <TextField source="name" label="Название" />
          <TextField source="question_preview" label="Вопрос" emptyText="—" />
          <NumberField source="cards_count" label="Карт" />
          <FollowUpsCountField />
          <BooleanField source="has_interpretation" label="Толкование" looseValue />
          <ReferenceField source="user_id" reference="users" label="Пользователь" link="show" />
          <DateField source="created_at" showTime label="Создан" />
        </Datagrid>
      )}
    </List>
  );
}

export function SpreadShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" label="ID" />
        <ReferenceField source="user_id" reference="users" label="Пользователь" link="show" />
        <TextField source="spread_key" label="Ключ расклада" />
        <TextField source="category" label="Категория" />
        <TextField source="name" label="Название" />
        <NumberField source="cards_count" label="Карт" />
        <TextField source="cards_preview" label="Выпавшие карты" emptyText="—" />
        <BooleanField source="has_interpretation" label="Есть толкование" looseValue />
        <NumberField source="follow_ups_count" label="Уточнений" />
        <WrapperField label="Вопрос пользователя">
          <LongTextField source="question" emptyText="Без вопроса" />
        </WrapperField>
        <WrapperField label="Толкование ИИ">
          <LongTextField source="interpretation" emptyText="Нет толкования" />
        </WrapperField>
        <WrapperField label="Уточняющие вопросы">
          <FollowUpsField />
        </WrapperField>
        <DateField source="created_at" showTime label="Создан" />
        <DateField source="updated_at" showTime label="Обновлён" />
      </SimpleShowLayout>
    </Show>
  );
}

export function SpreadEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="spread_key" disabled label="Ключ" />
        <TextInput source="name" label="Название" />
        <TextInput source="question" multiline rows={3} label="Вопрос" />
        <TextInput source="interpretation" multiline rows={8} label="Толкование" />
        <Stack spacing={1} sx={{ mt: 1, width: '100%' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Уточнения (только просмотр — правятся через payload в БД)
          </Typography>
          <FollowUpsField />
          <Chip size="small" label="followUps в payload не редактируются здесь" variant="outlined" />
        </Stack>
      </SimpleForm>
    </Edit>
  );
}
