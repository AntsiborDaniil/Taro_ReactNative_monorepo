import { Admin, Resource } from 'react-admin';
import { defaultTheme } from 'react-admin';
import { BrowserRouter } from 'react-router-dom';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PeopleIcon from '@mui/icons-material/People';
import StyleIcon from '@mui/icons-material/Style';
import PaymentsIcon from '@mui/icons-material/Payments';
import { LoginPage } from './LoginPage';
import { dataProvider } from './dataProvider';
import {
  adminSignIn,
  adminSignOut,
  fetchAdminMe,
  setAdminToken,
} from './auth';
import { UserEdit, UserList, UserShow } from './resources/users';
import { SpreadEdit, SpreadList, SpreadShow } from './resources/spreads';
import { TicketEdit, TicketList, TicketShow } from './resources/tickets';
import { PaymentList, PaymentShow } from './resources/payments';

/** Subpath on the public site; must match Vite `base` without trailing slash. */
const ADMIN_BASENAME = '/admin';

const theme = {
  ...defaultTheme,
  palette: {
    ...defaultTheme.palette,
    mode: 'dark' as const,
    primary: { main: '#F6C01B' },
    secondary: { main: '#6498CA' },
    background: { default: '#171F2C', paper: '#1E232B' },
  },
};

const authProvider = {
  login: async ({ username, password, email }: Record<string, string>) => {
    const result = await adminSignIn(email || username, password);
    setAdminToken(result.token);
  },
  logout: async () => {
    await adminSignOut();
  },
  checkAuth: async () => {
    const me = await fetchAdminMe();
    if (!me) {
      throw new Error('Not authenticated');
    }
  },
  checkError: async (error: { status?: number }) => {
    if (error.status === 401) {
      await adminSignOut();
      throw new Error('Unauthorized');
    }
  },
  getIdentity: async () => {
    const me = await fetchAdminMe();
    if (!me) {
      throw new Error('Not authenticated');
    }
    return { id: me.id, fullName: `${me.name || me.email} (${me.role})` };
  },
  getPermissions: async () => {
    const me = await fetchAdminMe();
    if (!me) {
      throw new Error('Not authenticated');
    }
    return me.role;
  },
};

export function App() {
  // RA 5 defaults to HashRouter; with basename="/admin" hash path "/" does not match.
  // Outer BrowserRouter disables the hash router and enables clean /admin/* URLs.
  return (
    <BrowserRouter basename={ADMIN_BASENAME}>
      <Admin
        basename={ADMIN_BASENAME}
        theme={theme}
        darkTheme={theme}
        loginPage={LoginPage}
        dataProvider={dataProvider}
        authProvider={authProvider}
        title="Mindful Tarot Admin"
        requireAuth
      >
        <Resource
          name="users"
          options={{ label: 'Пользователи' }}
          icon={PeopleIcon}
          list={UserList}
          show={UserShow}
          edit={UserEdit}
        />
        <Resource
          name="spreads"
          options={{ label: 'Расклады' }}
          icon={StyleIcon}
          list={SpreadList}
          show={SpreadShow}
          edit={SpreadEdit}
        />
        <Resource
          name="tickets"
          options={{ label: 'Поддержка' }}
          icon={SupportAgentIcon}
          list={TicketList}
          show={TicketShow}
          edit={TicketEdit}
        />
        <Resource
          name="payments"
          options={{ label: 'Оплаты' }}
          icon={PaymentsIcon}
          list={PaymentList}
          show={PaymentShow}
        />
      </Admin>
    </BrowserRouter>
  );
}
