import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Header } from 'features/header';
import {
  authCredentials,
  authRequestHeaders,
  authSignHeaders,
  authUsesCookie,
  getTarotAiApiBaseUrl,
} from 'shared/api';
import { COLORS } from 'shared/themes';
import { Button, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

type AuthTab = 'signin' | 'signup';
type AuthFormValues = {
  name: string;
  email: string;
  password: string;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AuthSessionData = {
  /** Native: JWT string. Web: cookie session — keep null and never persist token. */
  token: string | null;
  user: AuthUser;
};

type ProfileFormValues = {
  name: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_SESSION_STORAGE_KEY = 'authSession';

function Auth() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<AuthTab>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  /** Сбрасывает дерево гостевой формы после выхода (RN Web иначе может «наследовать» ноду первого инпута). */
  const [guestAuthEpoch, setGuestAuthEpoch] = useState(0);

  const useCookie = authUsesCookie();

  const {
    control,
    handleSubmit,
    watch,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuthFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const profileForm = useForm<ProfileFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const isSignUp = tab === 'signup';
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const nameValue = watch('name');

  const canSubmit = useMemo(() => {
    if (isSignUp) {
      return Boolean(
        emailValue?.trim() &&
          passwordValue?.trim() &&
          nameValue?.trim()
      );
    }
    return Boolean(emailValue?.trim() && passwordValue?.trim());
  }, [emailValue, passwordValue, nameValue, isSignUp]);

  const submitLabel = isSignUp
    ? t('settings:auth.createAccount')
    : t('settings:auth.signIn');

  const memberSinceLabel = useMemo(() => {
    if (!session?.user.createdAt) {
      return '';
    }
    try {
      const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
      return new Date(session.user.createdAt).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return session.user.createdAt;
    }
  }, [session?.user.createdAt, i18n.language]);

  useEffect(() => {
    if (session?.user) {
      profileForm.reset({ name: session.user.name });
      return;
    }
    profileForm.reset({ name: '' });
  }, [session?.user?.id, session?.user?.name, session]);

  useEffect(() => {
    const loadSession = async () => {
      if (useCookie) {
        try {
          const response = await fetch(
            `${getTarotAiApiBaseUrl()}/api/auth/me`,
            {
              credentials: authCredentials(),
              headers: {
                ...authRequestHeaders(null),
              },
            }
          );

          if (!response.ok) {
            setSession(null);
            setIsSessionLoading(false);
            return;
          }

          const meResponse = (await response.json()) as { user: AuthUser };
          setSession({ token: null, user: meResponse.user });
        } catch {
          setSession(null);
        } finally {
          setIsSessionLoading(false);
        }
        return;
      }

      const savedSession = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!savedSession) {
        setIsSessionLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(savedSession) as {
          token?: string;
          user: AuthUser;
        };
        const token = parsed.token ?? null;
        if (!token) {
          await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          setSession(null);
          setIsSessionLoading(false);
          return;
        }

        const response = await fetch(`${getTarotAiApiBaseUrl()}/api/auth/me`, {
          headers: {
            ...authRequestHeaders(token),
          },
        });

        if (!response.ok) {
          await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          setSession(null);
          setIsSessionLoading(false);
          return;
        }

        const meResponse = (await response.json()) as { user: AuthUser };

        setSession({
          token,
          user: meResponse.user,
        });
      } catch {
        await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        setSession(null);
      } finally {
        setIsSessionLoading(false);
      }
    };

    loadSession().catch(() => {
      setIsSessionLoading(false);
    });
  }, [useCookie]);

  const onSubmit = async (values: AuthFormValues): Promise<void> => {
    if (isSignUp) {
      const signUpValid = await trigger(['name', 'email', 'password']);
      if (!signUpValid) {
        return;
      }
    }

    try {
      const endpoint = isSignUp ? 'signup' : 'signin';
      const payload = isSignUp
        ? values
        : {
            email: values.email,
            password: values.password,
          };

      const response = await fetch(
        `${getTarotAiApiBaseUrl()}/api/auth/${endpoint}`,
        {
          method: 'POST',
          credentials: authCredentials(),
          headers: {
            'Content-Type': 'application/json',
            ...authSignHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      const responseBody = (await response.json()) as
        | AuthSessionData
        | { user?: AuthUser; token?: string }
        | { message?: string };

      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1:
            (responseBody as { message?: string }).message ||
            t('settings:auth.error.default'),
        });
        return;
      }

      if (useCookie) {
        const user = (responseBody as { user: AuthUser }).user;
        if (!user) {
          Toast.show({
            type: 'error',
            text1: t('settings:auth.error.default'),
          });
          return;
        }
        setSession({ token: null, user });
      } else {
        const body = responseBody as { user: AuthUser; token: string };
        const nextSession: AuthSessionData = {
          token: body.token,
          user: body.user,
        };
        await AsyncStorage.setItem(
          AUTH_SESSION_STORAGE_KEY,
          JSON.stringify(nextSession)
        );
        setSession(nextSession);
      }

      reset({
        name: '',
        email: '',
        password: '',
      });

      Toast.show({
        type: 'success',
        text1: t('settings:auth.success.title'),
        text2: useCookie
          ? t('settings:auth.success.subtitle.cookie')
          : t('settings:auth.success.subtitle'),
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.error.default'),
      });
    }
  };

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    if (!session) {
      return;
    }

    setProfileSaving(true);
    try {
      const response = await fetch(
        `${getTarotAiApiBaseUrl()}/api/auth/profile`,
        {
          method: 'PATCH',
          credentials: authCredentials(),
          headers: {
            'Content-Type': 'application/json',
            ...authRequestHeaders(session.token),
          },
          body: JSON.stringify({ name: values.name }),
        }
      );

      const body = (await response.json()) as
        | { user: AuthUser }
        | { message?: string };

      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1:
            (body as { message?: string }).message ||
            t('settings:auth.profile.error'),
        });
        return;
      }

      const nextUser = (body as { user: AuthUser }).user;
      setSession({ token: session.token, user: nextUser });

      if (!useCookie) {
        await AsyncStorage.setItem(
          AUTH_SESSION_STORAGE_KEY,
          JSON.stringify({ token: session.token, user: nextUser })
        );
      }

      Toast.show({
        type: 'success',
        text1: t('settings:auth.profile.saved'),
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.profile.error'),
      });
    } finally {
      setProfileSaving(false);
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    if (!session) {
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.password.mismatch'),
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(
        `${getTarotAiApiBaseUrl()}/api/auth/password`,
        {
          method: 'PATCH',
          credentials: authCredentials(),
          headers: {
            'Content-Type': 'application/json',
            ...authRequestHeaders(session.token),
          },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        }
      );

      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1:
            body.message || t('settings:auth.password.error'),
        });
        return;
      }

      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      Toast.show({
        type: 'success',
        text1: t('settings:auth.password.changed'),
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.password.error'),
      });
    } finally {
      setPasswordSaving(false);
    }
  });

  const handleSignOut = async () => {
    try {
      await fetch(`${getTarotAiApiBaseUrl()}/api/auth/signout`, {
        method: 'POST',
        credentials: authCredentials(),
        headers: {
          ...authRequestHeaders(session?.token ?? null),
        },
      });
    } catch {
      /* ignore network errors on sign out */
    }

    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    setProfileSaving(false);
    setPasswordSaving(false);
    passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    profileForm.reset({ name: '' });
    reset({
      name: '',
      email: '',
      password: '',
    });
    clearErrors();
    passwordForm.clearErrors();
    profileForm.clearErrors();
    setGuestAuthEpoch((n) => n + 1);
    setSession(null);
    Toast.show({
      type: 'success',
      text1: t('settings:auth.signOutSuccess'),
    });
  };

  return (
    <ScreenLayout style={styles.screen}>
      <Header title={t('settings:account')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroTopGlow} />
          {session ? (
            <>
              <Text category={TEXT_TAGS.h2} style={styles.heroTitle}>
                {t('settings:auth.loggedInTitle')}
              </Text>
              <Text category={TEXT_TAGS.p2} style={styles.heroSubtitle}>
                {session.user.email}
              </Text>
              {!!memberSinceLabel && (
                <Text category={TEXT_TAGS.p2} style={styles.memberSince}>
                  {t('settings:auth.memberSince', {
                    date: memberSinceLabel,
                  })}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text category={TEXT_TAGS.h2} style={styles.heroTitle}>
                {t('settings:auth.hero.title')}
              </Text>
              <Text category={TEXT_TAGS.p2} style={styles.heroSubtitle}>
                {t('settings:auth.hero.subtitle')}
              </Text>
            </>
          )}
        </View>

        {isSessionLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.Primary} />
            <Text category={TEXT_TAGS.p2} style={styles.heroSubtitle}>
              {t('settings:auth.loading')}
            </Text>
          </View>
        ) : session ? (
          <>
            <View style={styles.formCard}>
              <Text category={TEXT_TAGS.h4} style={styles.sectionTitle}>
                {t('settings:auth.profile.sectionTitle')}
              </Text>
              <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                {t('settings:auth.email')}
              </Text>
              <Text category={TEXT_TAGS.p2} style={styles.readOnlyValue}>
                {session.user.email}
              </Text>
              <Text category={TEXT_TAGS.p2} style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
                {t('settings:auth.name')}
              </Text>
              <Controller
                control={profileForm.control}
                name="name"
                rules={{
                  required: t('settings:auth.validation.nameRequired'),
                  minLength: {
                    value: 2,
                    message: t('settings:auth.validation.nameMin'),
                  },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('settings:auth.namePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.42)"
                    style={[
                      styles.input,
                      profileForm.formState.errors.name && styles.inputError,
                    ]}
                  />
                )}
              />
              {!!profileForm.formState.errors.name?.message && (
                <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                  {profileForm.formState.errors.name.message}
                </Text>
              )}
              <Button
                disabled={profileSaving}
                style={styles.submitButton}
                onPress={onSaveProfile}
              >
                {profileSaving
                  ? t('settings:auth.profile.saving')
                  : t('settings:auth.profile.save')}
              </Button>
              <Text category={TEXT_TAGS.p2} style={styles.accountMeta}>
                {t('settings:auth.accountId')}: {session.user.id}
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text category={TEXT_TAGS.h4} style={styles.sectionTitle}>
                {t('settings:auth.password.sectionTitle')}
              </Text>
              <View style={styles.fieldWrap}>
                <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                  {t('settings:auth.password.current')}
                </Text>
                <Controller
                  control={passwordForm.control}
                  name="currentPassword"
                  rules={{
                    required: t('settings:auth.validation.passwordRequired'),
                  }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder={t('settings:auth.passwordPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      style={[
                        styles.input,
                        passwordForm.formState.errors.currentPassword &&
                          styles.inputError,
                      ]}
                    />
                  )}
                />
                {!!passwordForm.formState.errors.currentPassword?.message && (
                  <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                    {passwordForm.formState.errors.currentPassword.message}
                  </Text>
                )}
              </View>
              <View style={styles.fieldWrap}>
                <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                  {t('settings:auth.password.new')}
                </Text>
                <Controller
                  control={passwordForm.control}
                  name="newPassword"
                  rules={{
                    required: t('settings:auth.validation.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('settings:auth.validation.passwordMin'),
                    },
                  }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder={t('settings:auth.passwordPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      style={[
                        styles.input,
                        passwordForm.formState.errors.newPassword &&
                          styles.inputError,
                      ]}
                    />
                  )}
                />
                {!!passwordForm.formState.errors.newPassword?.message && (
                  <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                    {passwordForm.formState.errors.newPassword.message}
                  </Text>
                )}
              </View>
              <View style={styles.fieldWrap}>
                <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                  {t('settings:auth.password.confirm')}
                </Text>
                <Controller
                  control={passwordForm.control}
                  name="confirmPassword"
                  rules={{
                    required: t('settings:auth.validation.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('settings:auth.validation.passwordMin'),
                    },
                  }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder={t('settings:auth.passwordPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      style={[
                        styles.input,
                        passwordForm.formState.errors.confirmPassword &&
                          styles.inputError,
                      ]}
                    />
                  )}
                />
                {!!passwordForm.formState.errors.confirmPassword?.message && (
                  <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                    {passwordForm.formState.errors.confirmPassword.message}
                  </Text>
                )}
              </View>
              <Button
                disabled={passwordSaving}
                style={styles.submitButton}
                onPress={onChangePassword}
              >
                {passwordSaving
                  ? t('settings:auth.password.saving')
                  : t('settings:auth.password.change')}
              </Button>
            </View>

            <View style={styles.formCard}>
              <Text category={TEXT_TAGS.h4} style={styles.sectionTitle}>
                {t('settings:auth.payments.sectionTitle')}
              </Text>
              <Text category={TEXT_TAGS.p2} style={styles.paymentsHint}>
                {t('settings:auth.payments.stub')}
              </Text>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.paymentRow,
                  hovered && styles.paymentRowHover,
                  pressed && styles.paymentRowPressed,
                ]}
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: t('settings:auth.payments.toast.title'),
                    text2: t('settings:auth.payments.toast.subtitle'),
                  })
                }
              >
                <View style={styles.paymentRowLeft}>
                  <Text category={TEXT_TAGS.h4} style={styles.paymentBrand}>
                    Visa / Mastercard
                  </Text>
                  <Text category={TEXT_TAGS.p2} style={styles.paymentMasked}>
                    •••• •••• •••• 4242
                  </Text>
                </View>
                <View style={styles.demoBadge}>
                  <Text category={TEXT_TAGS.p2} style={styles.demoBadgeText}>
                    {t('settings:auth.payments.demo')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.addPaymentButton,
                  hovered && styles.addPaymentButtonHover,
                  pressed && styles.addPaymentButtonPressed,
                ]}
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: t('settings:auth.payments.addSoon.title'),
                    text2: t('settings:auth.payments.addSoon.subtitle'),
                  })
                }
              >
                <Text category={TEXT_TAGS.h4} style={styles.addPaymentText}>
                  {t('settings:auth.payments.addCard')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.formCard}>
              <Button style={styles.submitButton} onPress={handleSignOut}>
                {t('settings:auth.signOut')}
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.guestWrap} key={guestAuthEpoch}>
            <View style={styles.segment}>
              <Pressable
                onPress={() => {
                  setTab('signin');
                  clearErrors('name');
                }}
                style={[
                  styles.segmentButton,
                  tab === 'signin' && styles.segmentButtonActive,
                ]}
              >
                <Text
                  category={TEXT_TAGS.h4}
                  style={[
                    styles.segmentLabel,
                    tab === 'signin' && styles.segmentLabelActive,
                  ]}
                >
                  {t('settings:auth.signIn')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setTab('signup');
                  clearErrors();
                }}
                style={[
                  styles.segmentButton,
                  tab === 'signup' && styles.segmentButtonActive,
                ]}
              >
                <Text
                  category={TEXT_TAGS.h4}
                  style={[
                    styles.segmentLabel,
                    tab === 'signup' && styles.segmentLabelActive,
                  ]}
                >
                  {t('settings:auth.signUp')}
                </Text>
              </Pressable>
            </View>

            {isSignUp ? (
              <View style={styles.formCard} key="signup-fields">
                <View style={styles.fieldWrap}>
                  <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                    {t('settings:auth.name')}
                  </Text>
                  <Controller
                    control={control}
                    name="name"
                    rules={{
                      required: t('settings:auth.validation.nameRequired'),
                      minLength: {
                        value: 2,
                        message: t('settings:auth.validation.nameMin'),
                      },
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={t('settings:auth.namePlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.42)"
                        style={[styles.input, errors.name && styles.inputError]}
                      />
                    )}
                  />
                  {!!errors.name?.message && (
                    <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                      {errors.name.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldWrap}>
                  <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                    {t('settings:auth.email')}
                  </Text>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: t('settings:auth.validation.emailRequired'),
                      validate: (value) =>
                        EMAIL_RE.test(value)
                          ? true
                          : t('settings:auth.validation.emailInvalid'),
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder={t('settings:auth.emailPlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.42)"
                        style={[styles.input, errors.email && styles.inputError]}
                      />
                    )}
                  />
                  {!!errors.email?.message && (
                    <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                      {errors.email.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldWrap}>
                  <View style={styles.passwordLabelRow}>
                    <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                      {t('settings:auth.password')}
                    </Text>
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      style={({ hovered }) => [
                        styles.togglePassword,
                        hovered && styles.togglePasswordHover,
                      ]}
                    >
                      <Text category={TEXT_TAGS.p2} style={styles.togglePasswordText}>
                        {showPassword
                          ? t('settings:auth.hide')
                          : t('settings:auth.show')}
                      </Text>
                    </Pressable>
                  </View>
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: t('settings:auth.validation.passwordRequired'),
                      minLength: {
                        value: 8,
                        message: t('settings:auth.validation.passwordMin'),
                      },
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        placeholder={t('settings:auth.passwordPlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.42)"
                        style={[
                          styles.input,
                          errors.password && styles.inputError,
                        ]}
                      />
                    )}
                  />
                  {!!errors.password?.message && (
                    <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                <Button
                  disabled={!canSubmit || isSubmitting}
                  style={styles.submitButton}
                  onPress={handleSubmit(onSubmit)}
                >
                  {submitLabel}
                </Button>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text category={TEXT_TAGS.p2} style={styles.dividerText}>
                    {t('settings:auth.or')}
                  </Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtons}>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.socialButton,
                      hovered && styles.socialButtonHover,
                      pressed && styles.socialButtonPressed,
                    ]}
                    onPress={() =>
                      Toast.show({
                        type: 'info',
                        text1: t('settings:auth.socialSoon.title'),
                        text2: t('settings:auth.socialSoon.google'),
                      })
                    }
                  >
                    <Text category={TEXT_TAGS.h4} style={styles.socialButtonText}>
                      Google
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.socialButton,
                      hovered && styles.socialButtonHover,
                      pressed && styles.socialButtonPressed,
                    ]}
                    onPress={() =>
                      Toast.show({
                        type: 'info',
                        text1: t('settings:auth.socialSoon.title'),
                        text2: t('settings:auth.socialSoon.apple'),
                      })
                    }
                  >
                    <Text category={TEXT_TAGS.h4} style={styles.socialButtonText}>
                      Apple
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.formCard} key="signin-fields">
                <View style={styles.fieldWrap}>
                  <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                    {t('settings:auth.email')}
                  </Text>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: t('settings:auth.validation.emailRequired'),
                      validate: (value) =>
                        EMAIL_RE.test(value)
                          ? true
                          : t('settings:auth.validation.emailInvalid'),
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder={t('settings:auth.emailPlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.42)"
                        style={[styles.input, errors.email && styles.inputError]}
                      />
                    )}
                  />
                  {!!errors.email?.message && (
                    <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                      {errors.email.message}
                    </Text>
                  )}
                </View>

                <View style={styles.fieldWrap}>
                  <View style={styles.passwordLabelRow}>
                    <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                      {t('settings:auth.password')}
                    </Text>
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      style={({ hovered }) => [
                        styles.togglePassword,
                        hovered && styles.togglePasswordHover,
                      ]}
                    >
                      <Text category={TEXT_TAGS.p2} style={styles.togglePasswordText}>
                        {showPassword
                          ? t('settings:auth.hide')
                          : t('settings:auth.show')}
                      </Text>
                    </Pressable>
                  </View>
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: t('settings:auth.validation.passwordRequired'),
                      minLength: {
                        value: 8,
                        message: t('settings:auth.validation.passwordMin'),
                      },
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        placeholder={t('settings:auth.passwordPlaceholder')}
                        placeholderTextColor="rgba(255,255,255,0.42)"
                        style={[
                          styles.input,
                          errors.password && styles.inputError,
                        ]}
                      />
                    )}
                  />
                  {!!errors.password?.message && (
                    <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                <Button
                  disabled={!canSubmit || isSubmitting}
                  style={styles.submitButton}
                  onPress={handleSubmit(onSubmit)}
                >
                  {submitLabel}
                </Button>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text category={TEXT_TAGS.p2} style={styles.dividerText}>
                    {t('settings:auth.or')}
                  </Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtons}>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.socialButton,
                      hovered && styles.socialButtonHover,
                      pressed && styles.socialButtonPressed,
                    ]}
                    onPress={() =>
                      Toast.show({
                        type: 'info',
                        text1: t('settings:auth.socialSoon.title'),
                        text2: t('settings:auth.socialSoon.google'),
                      })
                    }
                  >
                    <Text category={TEXT_TAGS.h4} style={styles.socialButtonText}>
                      Google
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ hovered, pressed }) => [
                      styles.socialButton,
                      hovered && styles.socialButtonHover,
                      pressed && styles.socialButtonPressed,
                    ]}
                    onPress={() =>
                      Toast.show({
                        type: 'info',
                        text1: t('settings:auth.socialSoon.title'),
                        text2: t('settings:auth.socialSoon.apple'),
                      })
                    }
                  >
                    <Text category={TEXT_TAGS.h4} style={styles.socialButtonText}>
                      Apple
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
    gap: 14,
  },
  guestWrap: {
    gap: 14,
    alignSelf: 'stretch',
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(173, 191, 226, 0.2)',
    backgroundColor: 'rgba(24, 31, 45, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  heroTopGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    top: -70,
    right: -50,
    backgroundColor: 'rgba(111, 87, 236, 0.26)',
  },
  heroTitle: {
    color: COLORS.Content,
  },
  heroSubtitle: {
    color: 'rgba(218, 230, 255, 0.78)',
    lineHeight: 20,
  },
  memberSince: {
    color: 'rgba(186, 204, 235, 0.62)',
    marginTop: 4,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(166, 186, 218, 0.14)',
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(102, 154, 211, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(128, 174, 226, 0.34)',
  },
  segmentLabel: {
    color: 'rgba(229, 236, 249, 0.62)',
  },
  segmentLabelActive: {
    color: COLORS.Content,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(173, 191, 226, 0.2)',
    backgroundColor: 'rgba(24, 31, 45, 0.86)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  loadingCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(173, 191, 226, 0.2)',
    backgroundColor: 'rgba(24, 31, 45, 0.86)',
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.Content,
    marginBottom: 4,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: 'rgba(221, 231, 247, 0.9)',
  },
  fieldLabelSpaced: {
    marginTop: 8,
  },
  readOnlyValue: {
    color: 'rgba(218, 230, 255, 0.82)',
    paddingVertical: 4,
  },
  accountMeta: {
    color: 'rgba(186, 204, 235, 0.55)',
    fontSize: 12,
    marginTop: 4,
  },
  paymentsHint: {
    color: 'rgba(216, 228, 247, 0.72)',
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(176, 197, 236, 0.22)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const } as object)
      : {}),
  },
  paymentRowHover: {
    backgroundColor: 'rgba(100, 152, 202, 0.12)',
    borderColor: 'rgba(176, 197, 236, 0.35)',
  },
  paymentRowPressed: {
    opacity: 0.92,
  },
  paymentRowLeft: {
    gap: 4,
    flex: 1,
  },
  paymentBrand: {
    color: COLORS.Content,
  },
  paymentMasked: {
    color: 'rgba(218, 230, 255, 0.65)',
  },
  demoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(111, 87, 236, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(156, 138, 243, 0.35)',
  },
  demoBadgeText: {
    color: 'rgba(229, 236, 249, 0.92)',
    fontSize: 11,
  },
  addPaymentButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(176, 197, 236, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const } as object)
      : {}),
  },
  addPaymentButtonHover: {
    backgroundColor: 'rgba(100, 152, 202, 0.1)',
  },
  addPaymentButtonPressed: {
    opacity: 0.9,
  },
  addPaymentText: {
    color: COLORS.Primary,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  togglePassword: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const } as object)
      : {}),
  },
  togglePasswordHover: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  togglePasswordText: {
    color: COLORS.Primary,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(176, 197, 236, 0.2)',
    borderRadius: 12,
    minHeight: 52,
    color: COLORS.Content,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: COLORS.Warning500,
    backgroundColor: 'rgba(255, 186, 58, 0.08)',
  },
  errorText: {
    color: COLORS.Warning400,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(176, 197, 236, 0.2)',
  },
  dividerText: {
    color: 'rgba(216, 228, 247, 0.66)',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(176, 197, 236, 0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const } as object)
      : {}),
  },
  socialButtonHover: {
    backgroundColor: 'rgba(100, 152, 202, 0.14)',
  },
  socialButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  socialButtonText: {
    color: COLORS.Content,
  },
});

export default Auth;
