import {
  Datagrid,
  DateField,
  EmailField,
  List,
  NumberField,
  ReferenceField,
  SelectField,
  SelectInput,
  Show,
  SimpleShowLayout,
  TextField,
  TextInput,
} from 'react-admin';

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

export function PaymentList() {
  return (
    <List filters={paymentFilters} sort={{ field: 'created_at', order: 'DESC' }}>
      <Datagrid rowClick="show">
        <TextField source="invoice_id" label="Invoice" />
        <SelectField source="status" choices={statusChoices} />
        <NumberField source="credits" />
        <EmailField source="email" />
        <ReferenceField source="user_id" reference="users" />
        <DateField source="created_at" showTime />
        <DateField source="paid_at" showTime />
      </Datagrid>
    </List>
  );
}

export function PaymentShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="invoice_id" />
        <TextField source="status" />
        <NumberField source="credits" />
        <EmailField source="email" />
        <ReferenceField source="user_id" reference="users" />
        <DateField source="created_at" showTime />
        <DateField source="paid_at" showTime />
      </SimpleShowLayout>
    </Show>
  );
}
