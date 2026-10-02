import {
  Datagrid,
  DateField,
  List,
  NumberField,
  ReferenceField,
  SelectField,
  SelectInput,
  Show,
  SimpleList,
  SimpleShowLayout,
  TextField,
  TextInput,
  WrapperField,
  useRecordContext,
} from 'react-admin';
import Typography from '@mui/material/Typography';
import { useIsMobile } from '../components/useIsMobile';

const statusChoices = [
  { id: 'pending', name: 'pending' },
  { id: 'paid', name: 'paid' },
  { id: 'failed', name: 'failed' },
];

const paymentFilters = [
  <TextInput key="q" label="Инвойс / email" source="q" alwaysOn />,
  <SelectInput key="status" label="Статус" source="status" choices={statusChoices} />,
  <TextInput key="user_id" label="User ID" source="user_id" />,
];

function RawJsonField({ source }: { source: string }) {
  const record = useRecordContext();
  const value = record?.[source];
  if (value == null || (typeof value === 'object' && Object.keys(value).length === 0)) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Typography
      component="pre"
      variant="body2"
      sx={{
        m: 0,
        p: 1.5,
        bgcolor: 'background.default',
        borderRadius: 1,
        overflow: 'auto',
        maxHeight: 280,
        maxWidth: '100%',
        fontSize: 12,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Typography>
  );
}

export function PaymentList() {
  const isMobile = useIsMobile();

  return (
    <List filters={paymentFilters} sort={{ field: 'created_at', order: 'DESC' }} perPage={25}>
      {isMobile ? (
        <SimpleList
          primaryText={(record) => record.invoice_id}
          secondaryText={(record) =>
            `${record.status} · ${record.credits} зар. · ${record.email || '—'}`
          }
          tertiaryText={(record) =>
            record.created_at ? new Date(record.created_at).toLocaleString('ru-RU') : ''
          }
          linkType="show"
        />
      ) : (
        <Datagrid rowClick="show" bulkActionButtons={false}>
          <TextField source="invoice_id" label="Invoice" />
          <SelectField source="status" choices={statusChoices} label="Статус" />
          <NumberField source="credits" label="Заряды" />
          <TextField source="email" label="Email" emptyText="—" />
          <ReferenceField source="user_id" reference="users" link="show" label="Пользователь" />
          <DateField source="created_at" showTime label="Создан" />
          <DateField source="paid_at" showTime label="Оплачен" emptyText="—" />
        </Datagrid>
      )}
    </List>
  );
}

export function PaymentShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="invoice_id" label="Invoice ID" />
        <SelectField source="status" choices={statusChoices} label="Статус" />
        <NumberField source="credits" label="Заряды в пакете" />
        <TextField source="email" label="Email" emptyText="—" />
        <ReferenceField source="user_id" reference="users" link="show" label="Пользователь" />
        <DateField source="created_at" showTime label="Создан" />
        <DateField source="paid_at" showTime label="Оплачен" emptyText="—" />
        <WrapperField label="Raw (Lava webhook)">
          <RawJsonField source="raw" />
        </WrapperField>
      </SimpleShowLayout>
    </Show>
  );
}
