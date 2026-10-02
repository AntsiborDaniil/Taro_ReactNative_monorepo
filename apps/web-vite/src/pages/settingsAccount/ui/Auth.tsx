import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useResendVerificationMutation,
  useSignInMutation,
  useSignOutMutation,
  useSignUpMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  type AuthApiError,
} from '@entities/user';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { userApi } from '@entities/user';
import { EMAIL_RE, isValidNonGmailEmail } from '@shared/lib/emailValidation';
import {
  passwordValidationCodeToI18nKey,
  validateStrongPassword,
} from '@shared/lib/passwordPolicy';
import { migrateLocalDataToCloud } from '@shared/lib/cloudMigration/migrateLocalToCloud';
import { useSettings } from '@entities/settings';
import {
  Button,
  EyeHideIcon,
  EyeShowIcon,
  Header,
  Input,
  ModalSheet,
  Skeleton,
  Text,
  useToast,
} from '@shared/ui';
import { VerifyCodeBoxes } from './VerifyCodeBoxes';
import styles from './Auth.module.css';

type AuthTab = 'signin' | 'signup';

function validateAuthEmail(value: string, t: (key: string) => string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return t('settings:auth.validation.emailRequired');
  if (!EMAIL_RE.test(trimmed)) return t('settings:auth.validation.emailInvalid');
  if (!isValidNonGmailEmail(trimmed)) return t('settings:auth.validation.emailNoGmail');
  return null;
}

/**
 * Перенос apps/web/src/pages/settings/ui/Auth/Auth.tsx (только web-логика:
 * cookie-сессия, без AsyncStorage/token-ветки) — вход/регистрация email,
 * подтверждение кода, профиль, смена пароля, выход. Google OAuth убран:
 * продукт — Telegram Mini App (тихий логин по initData).
 */
export default function Auth(): ReactElement {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { handleVibrationClick } = useSettings();

  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const user = useAppSelector((state) => state.user.user);

  const [signUp, { isLoading: signUpLoading }] = useSignUpMutation();
  const [signIn, { isLoading: signInLoading }] = useSignInMutation();
  const [verifyEmail, { isLoading: verifyLoading }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: resendLoading }] = useResendVerificationMutation();
  const [updateProfile, { isLoading: profileSaving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: passwordSaving }] = useChangePasswordMutation();
  const [signOut] = useSignOutMutation();

  const [tab, setTab] = useState<AuthTab>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const [existingAccountEmail, setExistingAccountEmail] = useState<string | null>(null);

  const [profileName, setProfileName] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const wasAuthenticated = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated.current && user?.id) {
      void migrateLocalDataToCloud(user.id);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    setProfileName(user?.name ?? '');
  }, [user?.id, user?.name]);

  const memberSinceLabel = useMemo(() => {
    if (!user?.createdAt) return '';
    try {
      const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
      return new Date(user.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return user.createdAt;
    }
  }, [user?.createdAt, i18n.language]);

  const isSignUp = tab === 'signup';
  const canSubmit = isSignUp
    ? Boolean(email.trim() && name.trim() && password.trim() && !validateStrongPassword(password))
    : Boolean(email.trim() && password.trim());

  const resetGuestForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setFieldErrors({});
  };

  const openVerification = (targetEmail: string, devCode?: string, signupPassword?: string, signupName?: string) => {
    setPendingEmail(targetEmail);
    setPendingPassword(signupPassword ?? null);
    setPendingName(signupName ?? null);
    setVerificationCode(devCode ?? '');
    toast.success(t('settings:auth.verify.sent'), 4000);
  };

  const extractError = (error: unknown): AuthApiError => {
    const data = (error as { data?: AuthApiError } | undefined)?.data;
    return data ?? {};
  };

  const errorMessage = (data: AuthApiError, fallbackKey: string): string => {
    const code = data.code;
    if (code?.startsWith('PASSWORD_')) {
      return t(passwordValidationCodeToI18nKey(code));
    }
    return data.message || t(fallbackKey);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    const emailError = validateAuthEmail(email, t);
    if (emailError) errors.email = emailError;
    if (isSignUp) {
      if (!name.trim() || name.trim().length < 2) errors.name = t('settings:auth.validation.nameMin');
      const pwCode = validateStrongPassword(password);
      if (pwCode) errors.password = t(passwordValidationCodeToI18nKey(pwCode));
    } else if (!password.trim()) {
      errors.password = t('settings:auth.validation.passwordRequired');
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    handleVibrationClick();

    try {
      if (isSignUp) {
        const result = await signUp({ name: name.trim(), email: email.trim(), password }).unwrap();
        if ('needsEmailVerification' in result) {
          openVerification(result.email, result.devVerificationCode, password, name.trim());
          return;
        }
        resetGuestForm();
        toast.success(t('settings:auth.success.title'));
        return;
      }

      const result = await signIn({ email: email.trim(), password }).unwrap();
      if ('needsEmailVerification' in result) {
        openVerification(result.email, result.devVerificationCode);
        return;
      }
      resetGuestForm();
      toast.success(t('settings:auth.success.title'));
    } catch (error) {
      const data = extractError(error);
      const status = (error as { status?: number } | undefined)?.status;
      if (status === 409 && isSignUp) {
        setExistingAccountEmail(email.trim());
        return;
      }
      if (data.needsEmailVerification && data.email) {
        openVerification(data.email, data.devVerificationCode, isSignUp ? password : undefined, isSignUp ? name.trim() : undefined);
        return;
      }
      toast.error(errorMessage(data, 'settings:auth.error.default'));
    }
  };

  const handleVerify = async () => {
    if (!pendingEmail || verificationCode.trim().length < 6) return;
    handleVibrationClick();
    try {
      await verifyEmail({
        email: pendingEmail,
        code: verificationCode.trim(),
        ...(pendingPassword ? { password: pendingPassword } : {}),
        ...(pendingName ? { name: pendingName } : {}),
      }).unwrap();
      setPendingEmail(null);
      setVerificationCode('');
      setPendingPassword(null);
      setPendingName(null);
      resetGuestForm();
      toast.success(t('settings:auth.verify.success'));
    } catch (error) {
      const data = extractError(error);
      toast.error(data.message || t('settings:auth.verify.error'));
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    try {
      const result = await resendVerification({ email: pendingEmail }).unwrap();
      if (result.devVerificationCode) setVerificationCode(result.devVerificationCode);
      toast.success(t('settings:auth.verify.sent'));
    } catch {
      toast.error(t('settings:auth.error.default'));
    }
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileName.trim() || profileName.trim().length < 2) return;
    try {
      await updateProfile({ name: profileName.trim() }).unwrap();
      toast.success(t('settings:auth.profile.saved'));
    } catch {
      toast.error(t('settings:auth.profile.error'));
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('settings:auth.password.mismatch'));
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings:auth.password.changed'));
    } catch (error) {
      const data = extractError(error);
      toast.error(errorMessage(data, 'settings:auth.password.error'));
    }
  };

  const handleSignOut = async () => {
    handleVibrationClick();
    try {
      await signOut().unwrap();
    } catch {
      // ignore network errors on sign out
    }
    dispatch(userApi.util.invalidateTags(['User', 'Settings', 'Favorites', 'Spreads']));
    resetGuestForm();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success(t('settings:auth.signOutSuccess'));
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('settings:account')} />
        {sessionLoading ? (
          <div className={styles.card}>
            <div className={styles.loadingRow}>
              <Skeleton width={120} height={20} />
            </div>
          </div>
        ) : isAuthenticated ? (
          <>
            <div className={styles.card}>
              <Text role="title" as="h2" className={styles.heroTitle}>
                {t('settings:auth.loggedInTitle')}
              </Text>
              <Text role="body" tone="ink100" className={styles.heroSubtitle}>
                {user?.email}
              </Text>
              {memberSinceLabel ? (
                <Text role="micro" tone="ink100" className={styles.heroSubtitle}>
                  {t('settings:auth.memberSince', { date: memberSinceLabel })}
                </Text>
              ) : null}
            </div>

            <form className={styles.card} onSubmit={handleSaveProfile}>
              <Text role="title" as="h3">
                {t('settings:auth.profile.sectionTitle')}
              </Text>
              <div className={styles.field}>
                <Text role="micro" tone="ink100" className={styles.fieldLabel}>
                  {t('settings:auth.email')}
                </Text>
                <Text role="body" className={styles.readOnlyValue}>
                  {user?.email}
                </Text>
              </div>
              <Input
                label={t('settings:auth.name')}
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder={t('settings:auth.namePlaceholder')}
              />
              <Button type="submit" variant="action" fullWidth loading={profileSaving}>
                {profileSaving ? t('settings:auth.profile.saving') : t('settings:auth.profile.save')}
              </Button>
              <Text role="micro" tone="ink100">
                {`${t('settings:auth.accountId')}: ${user?.id ?? ''}`}
              </Text>
            </form>

            <form className={styles.card} onSubmit={handleChangePassword}>
              <div className={styles.sectionTitle}>
                <Text role="title" as="h3">
                  {t('settings:auth.password.sectionTitle')}
                </Text>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  style={{ position: 'static' }}
                  onClick={() => setShowAccountPassword((v) => !v)}
                  aria-label={showAccountPassword ? t('settings:auth.hide') : t('settings:auth.show')}
                >
                  {showAccountPassword ? <EyeHideIcon width={20} height={20} /> : <EyeShowIcon width={20} height={20} />}
                </button>
              </div>
              <Input
                label={t('settings:auth.password.current')}
                type={showAccountPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={t('settings:auth.passwordPlaceholder')}
                autoComplete="current-password"
              />
              <Input
                label={t('settings:auth.password.new')}
                type={showAccountPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={t('settings:auth.passwordPlaceholder')}
                autoComplete="new-password"
              />
              <Input
                label={t('settings:auth.password.confirm')}
                type={showAccountPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t('settings:auth.passwordPlaceholder')}
                autoComplete="new-password"
              />
              <Button type="submit" variant="action" fullWidth loading={passwordSaving}>
                {passwordSaving ? t('settings:auth.password.saving') : t('settings:auth.password.change')}
              </Button>
            </form>

            <Button variant="quiet" fullWidth onClick={handleSignOut}>
              {t('settings:auth.signOut')}
            </Button>
          </>
        ) : pendingEmail ? (
          <div className={styles.card}>
            <Text role="title" as="h2" className={styles.heroTitle}>
              {t('settings:auth.verify.title')}
            </Text>
            <Text role="body" tone="ink100" className={styles.heroSubtitle}>
              {t('settings:auth.verify.subtitle')}
            </Text>
            <VerifyCodeBoxes value={verificationCode} onChange={setVerificationCode} disabled={verifyLoading} />
            <Button
              variant="action"
              fullWidth
              loading={verifyLoading}
              disabled={verificationCode.trim().length < 6}
              onClick={handleVerify}
            >
              {t('settings:auth.verify.submit')}
            </Button>
            <div className={styles.verifyRow}>
              <Button variant="link" onClick={handleResend} loading={resendLoading}>
                {resendLoading ? t('settings:auth.verify.resending') : t('settings:auth.verify.resend')}
              </Button>
              <Button
                variant="link"
                onClick={() => {
                  setPendingEmail(null);
                  setVerificationCode('');
                }}
              >
                {t('settings:auth.verify.back')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.card}>
              <Text role="title" as="h2" className={styles.heroTitle}>
                {t('settings:auth.hero.title')}
              </Text>
              <Text role="body" tone="ink100" className={styles.heroSubtitle}>
                {t('settings:auth.hero.subtitle')}
              </Text>
            </div>

            <div className={styles.card}>
              <div className={styles.tabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'signin'}
                  className={[styles.tab, tab === 'signin' ? styles.tabActive : ''].join(' ')}
                  onClick={() => {
                    setTab('signin');
                    setFieldErrors({});
                  }}
                >
                  {t('settings:auth.signIn')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'signup'}
                  className={[styles.tab, tab === 'signup' ? styles.tabActive : ''].join(' ')}
                  onClick={() => {
                    setTab('signup');
                    setFieldErrors({});
                  }}
                >
                  {t('settings:auth.signUp')}
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.field} style={{ gap: 'var(--ds-space-12)' }}>
                {isSignUp ? (
                  <Input
                    label={t('settings:auth.name')}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('settings:auth.namePlaceholder')}
                    error={fieldErrors.name}
                    autoComplete="name"
                  />
                ) : null}
                <Input
                  label={t('settings:auth.email')}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('settings:auth.emailPlaceholder')}
                  error={fieldErrors.email}
                  autoComplete="email"
                />
                <div className={styles.passwordWrap}>
                  <Input
                    label={t('settings:auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t('settings:auth.passwordPlaceholder')}
                    error={fieldErrors.password}
                    hint={isSignUp && !fieldErrors.password ? t('settings:auth.passwordRequirements') : undefined}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('settings:auth.hide') : t('settings:auth.show')}
                  >
                    {showPassword ? <EyeHideIcon width={20} height={20} /> : <EyeShowIcon width={20} height={20} />}
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="action"
                  fullWidth
                  loading={signUpLoading || signInLoading}
                  disabled={!canSubmit}
                >
                  {isSignUp ? t('settings:auth.createAccount') : t('settings:auth.signIn')}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      <ModalSheet
        open={Boolean(existingAccountEmail)}
        onClose={() => setExistingAccountEmail(null)}
        title={t('settings:auth.existingAccount.title')}
      >
        <div className={styles.existingAccountBody}>
          <Text role="body" tone="ink100">
            {t('settings:auth.existingAccount.body')}
          </Text>
          <Button
            variant="action"
            fullWidth
            onClick={() => {
              setTab('signin');
              setEmail(existingAccountEmail ?? '');
              setPassword('');
              setFieldErrors({});
              setExistingAccountEmail(null);
            }}
          >
            {t('settings:auth.existingAccount.signIn')}
          </Button>
          <Button variant="quiet" fullWidth onClick={() => setExistingAccountEmail(null)}>
            {t('settings:auth.existingAccount.close')}
          </Button>
        </div>
      </ModalSheet>
    </div>
  );
}
