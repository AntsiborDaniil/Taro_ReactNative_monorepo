import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
  ChevronRightIcon,
  CrossIcon,
  EyeHideIcon,
  EyeShowIcon,
} from 'shared/icons';
import {
  authCredentials,
  authRequestHeaders,
  authSignHeaders,
  authUsesCookie,
  getTarotAiApiBaseUrl,
} from 'shared/api';
import {
  EMAIL_RE,
  isValidNonGmailEmail,
} from 'shared/lib/emailValidation';
import {
  passwordValidationCodeToI18nKey,
  strongPasswordFormRules,
  validateStrongPassword,
  type PasswordValidationCode,
} from 'shared/lib/passwordPolicy';
import { navigateToAuthAccount } from 'shared/lib/handleWebOAuthReturn';
import {
  emitTarotAuthChanged,
  TAROT_AUTH_CHANGED_EVENT,
  type TarotAuthChangedDetail,
} from 'shared/lib/tarotAuthEvents';
import { fetchAuthMeSession } from 'shared/lib/web/fetchAuthMeSession';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { DS_COLORS, DS_MOTION, DS_SIZES, DS_TYPE } from 'shared/themes/ds';
import { PressableWebState } from 'shared/types';
import { Button, DsModalSheet, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { VerifyCodeBoxes } from './VerifyCodeBoxes';

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

const AUTH_SESSION_STORAGE_KEY = 'authSession';

function validateAuthEmail(
  value: string,
  t: (key: string) => string
): true | string {
  const trimmed = value.trim();
  if (!trimmed) {
    return t('settings:auth.validation.emailRequired');
  }
  if (!EMAIL_RE.test(trimmed)) {
    return t('settings:auth.validation.emailInvalid');
  }
  if (!isValidNonGmailEmail(trimmed)) {
    return t('settings:auth.validation.emailNoGmail');
  }
  return true;
}

type AuthApiBody = {
  user?: AuthUser;
  token?: string;
  message?: string;
  code?: PasswordValidationCode;
  needsEmailVerification?: boolean;
  email?: string;
  devVerificationCode?: string;
};

async function fetchAuthMeUser(): Promise<AuthUser | null> {
  const session = await fetchAuthMeSession({ retryUnauthorized: false });
  return session?.user ?? null;
}

/** Cookie from verify/sign-in must be readable via /me before we treat the user as signed in. */
async function resolveUserAfterCookieAuth(): Promise<AuthUser> {
  const session = await fetchAuthMeSession();
  if (session?.user) {
    return session.user;
  }
  throw new Error('SESSION_COOKIE_MISSING');
}

async function parseAuthResponse(
  response: Response
): Promise<{ body: AuthApiBody; parseFailed: boolean }> {
  const text = await response.text();
  if (!text.trim()) {
    return { body: {}, parseFailed: true };
  }
  try {
    return { body: JSON.parse(text) as AuthApiBody, parseFailed: false };
  } catch {
    return { body: {}, parseFailed: true };
  }
}

type AuthPasswordInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  placeholder: string;
  /** true = символы скрыты (secureTextEntry). */
  masked: boolean;
  onToggleMask: () => void;
  toggleA11yLabel: string;
  hasError?: boolean;
};

function AuthPasswordInput({
  value,
  onChangeText,
  onBlur,
  placeholder,
  masked,
  onToggleMask,
  toggleA11yLabel,
  hasError,
}: AuthPasswordInputProps) {
  return (
    <View style={styles.passwordInputOuter}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={masked}
        autoCapitalize="none"
        placeholder={placeholder}
        placeholderTextColor={DS_COLORS.ink100}
        style={[
          styles.input,
          styles.passwordInputWithReveal,
          hasError && styles.inputError,
        ]}
      />
      <Pressable
        onPress={onToggleMask}
        style={({ pressed }) => [
          styles.passwordRevealHit,
          pressed && styles.passwordRevealPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={toggleA11yLabel}
      >
        {masked ? (
          <EyeShowIcon width={22} height={22} fill={COLORS.Primary} />
        ) : (
          <EyeHideIcon width={22} height={22} fill={COLORS.Primary} />
        )}
      </Pressable>
    </View>
  );
}

function Auth() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<AuthTab>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  /** Сбрасывает дерево гостевой формы после выхода (RN Web иначе может «наследовать» ноду первого инпута). */
  const [guestAuthEpoch, setGuestAuthEpoch] = useState(0);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [devVerificationCode, setDevVerificationCode] = useState<string | null>(
    null
  );
  const [pendingSignupPassword, setPendingSignupPassword] = useState<
    string | null
  >(null);
  const [pendingSignupName, setPendingSignupName] = useState<string | null>(
    null
  );
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [existingAccountModalVisible, setExistingAccountModalVisible] =
    useState(false);
  const [existingAccountEmail, setExistingAccountEmail] = useState('');

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

  const passwordPolicyRules = useMemo(
    () =>
      strongPasswordFormRules({
        requiredMessage: t('settings:auth.validation.passwordRequired'),
        t,
      }),
    [t]
  );

  const canSubmit = useMemo(() => {
    if (isSignUp) {
      return Boolean(
        emailValue?.trim() &&
          nameValue?.trim() &&
          passwordValue?.trim() &&
          validateStrongPassword(passwordValue) === null
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
        let loadedUser: AuthUser | null = null;
        try {
          const session = await fetchAuthMeSession();

          if (!session?.user) {
            setSession(null);
          } else {
            loadedUser = session.user;
            setSession({ token: null, user: session.user });
          }
        } catch {
          setSession(null);
        } finally {
          setIsSessionLoading(false);
          if (Platform.OS === 'web') {
            emitTarotAuthChanged(loadedUser ?? undefined);
          }
        }
        return;
      }

      const savedSession = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!savedSession) {
        setIsSessionLoading(false);
        if (Platform.OS === 'web') {
          emitTarotAuthChanged();
        }
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
          if (Platform.OS === 'web') {
            emitTarotAuthChanged();
          }
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
          if (Platform.OS === 'web') {
            emitTarotAuthChanged();
          }
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
        if (Platform.OS === 'web') {
          emitTarotAuthChanged();
        }
      }
    };

    loadSession().catch(() => {
      setIsSessionLoading(false);
    });
  }, [useCookie]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }
    const onAuthChanged = (event: Event) => {
      const hintedUser = (event as CustomEvent<TarotAuthChangedDetail>).detail
        ?.user;
      void (async () => {
        const fromMe = await fetchAuthMeUser();
        if (fromMe) {
          setSession({ token: null, user: fromMe });
          return;
        }
        if (hintedUser) {
          setSession({ token: null, user: hintedUser });
        }
      })();
    };
    window.addEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, []);

  const openEmailVerification = (
    email: string,
    devCode?: string,
    signupPassword?: string,
    signupName?: string
  ): void => {
    setPendingVerificationEmail(email);
    setPendingSignupPassword(signupPassword ?? null);
    setPendingSignupName(signupName ?? null);
    setDevVerificationCode(devCode ?? null);
    if (devCode) {
      setVerificationCode(devCode);
    }
    Toast.show({
      type: 'success',
      text1: t('settings:auth.verify.sent'),
      text2:
        __DEV__ && devCode
          ? `${t('settings:auth.verify.devHint')} ${devCode}`
          : undefined,
    });
  };

  const handleExistingAccountSignIn = (): void => {
    setExistingAccountModalVisible(false);
    setTab('signin');
    reset({
      name: '',
      email: existingAccountEmail,
      password: '',
    });
    clearErrors();
  };

  const redirectToSignInAfterVerify = (email: string): void => {
    setPendingVerificationEmail(null);
    setVerificationCode('');
    setDevVerificationCode(null);
    setPendingSignupPassword(null);
    setPendingSignupName(null);
    setTab('signin');
    reset({ name: '', email, password: '' });
    clearErrors();
    Toast.show({
      type: 'success',
      text1: t('settings:auth.verify.successSignIn'),
    });
  };

  const applyAuthenticatedSession = async (
    body: { user: AuthUser; token?: string },
    options?: {
      successTitle?: string;
      /** After verify: on cookie failure, open sign-in with this email prefilled. */
      redirectToSignInOnSessionError?: string;
    }
  ): Promise<void> => {
    let resolvedUser = body.user;

    try {
      if (useCookie) {
        setSession({ token: null, user: body.user });
      }

      if (useCookie) {
        resolvedUser = await resolveUserAfterCookieAuth();
        setSession({ token: null, user: resolvedUser });
      } else if (body.token) {
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
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'SESSION_COOKIE_MISSING'
      ) {
        const fallbackEmail = options?.redirectToSignInOnSessionError?.trim();
        if (fallbackEmail) {
          redirectToSignInAfterVerify(fallbackEmail);
          return;
        }
        Toast.show({
          type: 'error',
          text1: t('settings:auth.error.sessionCookie'),
        });
        return;
      }
      throw error;
    }

    setPendingVerificationEmail(null);
    setVerificationCode('');
    setDevVerificationCode(null);
    setPendingSignupPassword(null);
    setPendingSignupName(null);
    reset({ name: '', email: '', password: '' });

    Toast.show({
      type: 'success',
      text1: options?.successTitle ?? t('settings:auth.success.title'),
      text2: options?.successTitle
        ? undefined
        : t('settings:auth.success.subtitle'),
    });

    if (Platform.OS === 'web') {
      emitTarotAuthChanged(resolvedUser);
      navigateToAuthAccount();
      setTimeout(navigateToAuthAccount, 100);
    }
  };

  const onSubmit = async (values: AuthFormValues): Promise<void> => {
    if (isSignUp) {
      const signUpValid = await trigger(['name', 'email', 'password']);
      if (!signUpValid) {
        return;
      }
    }

    setAuthSubmitting(true);
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

      const { body: responseBody, parseFailed } =
        await parseAuthResponse(response);

      if (parseFailed) {
        Toast.show({
          type: 'error',
          text1: response.ok
            ? t('settings:auth.error.default')
            : t('settings:auth.error.network'),
        });
        return;
      }

      if (!response.ok) {
        if (response.status === 409 && isSignUp) {
          setExistingAccountEmail(values.email.trim());
          setExistingAccountModalVisible(true);
          return;
        }
        if (responseBody.needsEmailVerification && responseBody.email) {
          openEmailVerification(
            responseBody.email,
            responseBody.devVerificationCode,
            isSignUp ? values.password : undefined,
            isSignUp ? values.name : undefined
          );
          return;
        }
        const weakPasswordMessage =
          responseBody.code?.startsWith('PASSWORD_')
            ? t(passwordValidationCodeToI18nKey(responseBody.code))
            : responseBody.message || t('settings:auth.error.default');
        Toast.show({
          type: 'error',
          text1: weakPasswordMessage,
        });
        return;
      }

      if (responseBody.needsEmailVerification) {
        openEmailVerification(
          responseBody.email || values.email.trim(),
          responseBody.devVerificationCode,
          isSignUp ? values.password : undefined,
          isSignUp ? values.name : undefined
        );
        return;
      }

      if (!responseBody.user) {
        Toast.show({
          type: 'error',
          text1: t('settings:auth.error.default'),
        });
        return;
      }

      await applyAuthenticatedSession({
        user: responseBody.user,
        token: responseBody.token,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.error.network'),
      });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const onVerifyEmail = async (): Promise<void> => {
    if (!pendingVerificationEmail || verificationCode.trim().length < 6) {
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(
        `${getTarotAiApiBaseUrl()}/api/auth/verify-email`,
        {
          method: 'POST',
          credentials: authCredentials(),
          headers: {
            'Content-Type': 'application/json',
            ...authSignHeaders(),
          },
          body: JSON.stringify({
            email: pendingVerificationEmail,
            code: verificationCode.trim(),
            ...(pendingSignupPassword
              ? { password: pendingSignupPassword }
              : {}),
            ...(pendingSignupName ? { name: pendingSignupName } : {}),
          }),
        }
      );

      const { body, parseFailed } = await parseAuthResponse(response);

      if (parseFailed || !response.ok) {
        Toast.show({
          type: 'error',
          text1:
            body.message ||
            (parseFailed
              ? t('settings:auth.error.network')
              : t('settings:auth.verify.error')),
        });
        return;
      }

      if (!body.user) {
        Toast.show({
          type: 'error',
          text1: t('settings:auth.verify.error'),
        });
        return;
      }

      await applyAuthenticatedSession(
        { user: body.user, token: body.token },
        {
          successTitle: t('settings:auth.verify.success'),
          redirectToSignInOnSessionError:
            pendingVerificationEmail ?? body.user.email,
        }
      );
    } catch {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.error.network'),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendVerification = async (): Promise<void> => {
    if (!pendingVerificationEmail) {
      return;
    }

    setIsResendingCode(true);
    try {
      const response = await fetch(
        `${getTarotAiApiBaseUrl()}/api/auth/resend-verification`,
        {
          method: 'POST',
          credentials: authCredentials(),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingVerificationEmail }),
        }
      );

      const { body, parseFailed } = await parseAuthResponse(response);

      if (parseFailed || !response.ok) {
        Toast.show({
          type: 'error',
          text1:
            body.message ||
            (parseFailed
              ? t('settings:auth.error.network')
              : t('settings:auth.error.default')),
        });
        return;
      }

      if (body.devVerificationCode) {
        setDevVerificationCode(body.devVerificationCode);
        setVerificationCode(body.devVerificationCode);
      }

      Toast.show({
        type: 'success',
        text1: t('settings:auth.verify.sent'),
        text2:
          __DEV__ && body.devVerificationCode
            ? `${t('settings:auth.verify.devHintResend')} ${body.devVerificationCode}`
            : undefined,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('settings:auth.error.network'),
      });
    } finally {
      setIsResendingCode(false);
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

      const { body, parseFailed } = await parseAuthResponse(response);

      if (parseFailed || !response.ok) {
        const weakPasswordMessage =
          body.code?.startsWith('PASSWORD_')
            ? t(passwordValidationCodeToI18nKey(body.code))
            : body.message || t('settings:auth.password.error');
        Toast.show({
          type: 'error',
          text1: weakPasswordMessage,
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
    setShowPassword(false);
    setShowAccountPassword(false);
    setGuestAuthEpoch((n) => n + 1);
    setSession(null);
    if (Platform.OS === 'web') {
      emitTarotAuthChanged();
    }
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
        <View style={styles.column}>
        <View style={styles.heroCard}>
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
                    placeholderTextColor={DS_COLORS.ink100}
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
                {`${t('settings:auth.accountId')}: ${session.user.id}`}
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.passwordSectionHead}>
                <Text
                  category={TEXT_TAGS.h4}
                  style={[styles.sectionTitle, styles.sectionTitleInline]}
                >
                  {t('settings:auth.password.sectionTitle')}
                </Text>
                <Pressable
                  onPress={() => setShowAccountPassword((v) => !v)}
                  style={({ pressed }) => [
                    styles.passwordHeadToggle,
                    pressed && styles.passwordRevealPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showAccountPassword
                      ? t('settings:auth.hide')
                      : t('settings:auth.show')
                  }
                >
                  {showAccountPassword ? (
                    <EyeHideIcon width={22} height={22} fill={COLORS.Primary} />
                  ) : (
                    <EyeShowIcon width={22} height={22} fill={COLORS.Primary} />
                  )}
                </Pressable>
              </View>
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
                      secureTextEntry={!showAccountPassword}
                      autoCapitalize="none"
                      placeholder={t('settings:auth.passwordPlaceholder')}
                      placeholderTextColor={DS_COLORS.ink100}
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
                    rules={passwordPolicyRules}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showAccountPassword}
                      autoCapitalize="none"
                      placeholder={t('settings:auth.passwordPlaceholder')}
                      placeholderTextColor={DS_COLORS.ink100}
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
                <Text category={TEXT_TAGS.p2} style={styles.passwordHint}>
                  {t('settings:auth.passwordRequirements')}
                </Text>
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
                    validate: (value) =>
                      value === passwordForm.getValues('newPassword')
                        ? true
                        : t('settings:auth.password.mismatch'),
                  }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showAccountPassword}
                      autoCapitalize="none"
                      placeholder={t('settings:auth.passwordPlaceholder')}
                      placeholderTextColor={DS_COLORS.ink100}
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
              <Button style={styles.submitButton} onPress={handleSignOut}>
                {t('settings:auth.signOut')}
              </Button>
            </View>
          </>
        ) : pendingVerificationEmail ? (
          <View style={styles.formCard}>
            <Text category={TEXT_TAGS.h3} style={styles.verifyTitle}>
              {t('settings:auth.verify.title')}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.verifySubtitle}>
              {t('settings:auth.verify.subtitle', {
                email: pendingVerificationEmail,
              })}
            </Text>

            {__DEV__ && devVerificationCode ? (
              <View style={styles.devCodeBanner}>
                <Text category={TEXT_TAGS.p2} style={styles.devCodeLabel}>
                  {t('settings:auth.verify.devHint')}
                </Text>
                <Text category={TEXT_TAGS.h3} style={styles.devCodeValue}>
                  {devVerificationCode}
                </Text>
              </View>
            ) : null}

            <VerifyCodeBoxes
              value={verificationCode}
              onChange={setVerificationCode}
              disabled={isVerifying}
            />

            <Button
              disabled={
                verificationCode.trim().length < 6 || isVerifying
              }
              style={styles.submitButton}
              onPress={onVerifyEmail}
            >
              {t('settings:auth.verify.submit')}
            </Button>

            <Pressable
              onPress={onResendVerification}
              disabled={isResendingCode}
              style={styles.verifyResendHit}
            >
              <Text category={TEXT_TAGS.p2} style={styles.verifyResendText}>
                {isResendingCode
                  ? t('settings:auth.verify.resending')
                  : t('settings:auth.verify.resend')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPendingVerificationEmail(null);
                setVerificationCode('');
                setDevVerificationCode(null);
                setPendingSignupPassword(null);
                setPendingSignupName(null);
                setTab('signin');
              }}
              style={styles.verifyBackHit}
            >
              <Text category={TEXT_TAGS.p2} style={styles.verifyBackText}>
                {t('settings:auth.verify.back')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.guestWrap} key={guestAuthEpoch}>
            <View style={styles.segment}>
              <Pressable
                onPress={() => {
                  setTab('signin');
                  setShowPassword(false);
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
                  setShowPassword(false);
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
                        placeholderTextColor={DS_COLORS.ink100}
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
                      validate: (value) => validateAuthEmail(value, t),
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder={t('settings:auth.emailPlaceholder')}
                        placeholderTextColor={DS_COLORS.ink100}
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
                  <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                    {t('settings:auth.password')}
                  </Text>
                  <Controller
                    control={control}
                    name="password"
                    rules={passwordPolicyRules}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <AuthPasswordInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={t('settings:auth.passwordPlaceholder')}
                        masked={!showPassword}
                        onToggleMask={() => setShowPassword((v) => !v)}
                        toggleA11yLabel={
                          showPassword
                            ? t('settings:auth.hide')
                            : t('settings:auth.show')
                        }
                        hasError={!!errors.password}
                      />
                    )}
                  />
                  {!!errors.password?.message && (
                    <Text category={TEXT_TAGS.p2} style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                  <Text category={TEXT_TAGS.p2} style={styles.passwordHint}>
                    {t('settings:auth.passwordRequirements')}
                  </Text>
                </View>

                <Button
                  disabled={!canSubmit || isSubmitting || authSubmitting}
                  style={styles.submitButton}
                  onPress={handleSubmit(onSubmit)}
                >
                  {authSubmitting
                    ? t('settings:auth.loading')
                    : submitLabel}
                </Button>
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
                      validate: (value) => validateAuthEmail(value, t),
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder={t('settings:auth.emailPlaceholder')}
                        placeholderTextColor={DS_COLORS.ink100}
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
                  <Text category={TEXT_TAGS.p2} style={styles.fieldLabel}>
                    {t('settings:auth.password')}
                  </Text>
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: t('settings:auth.validation.passwordRequired'),
                    }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <AuthPasswordInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={t('settings:auth.passwordPlaceholder')}
                        masked={!showPassword}
                        onToggleMask={() => setShowPassword((v) => !v)}
                        toggleA11yLabel={
                          showPassword
                            ? t('settings:auth.hide')
                            : t('settings:auth.show')
                        }
                        hasError={!!errors.password}
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
                  disabled={!canSubmit || isSubmitting || authSubmitting}
                  style={styles.submitButton}
                  onPress={handleSubmit(onSubmit)}
                >
                  {authSubmitting
                    ? t('settings:auth.loading')
                    : submitLabel}
                </Button>
              </View>
            )}
          </View>
        )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={existingAccountModalVisible}
        onRequestClose={() => setExistingAccountModalVisible(false)}
      >
        <DsModalSheet
          onClose={() => setExistingAccountModalVisible(false)}
          closeAccessibilityLabel={t('settings:auth.existingAccount.close')}
          maxWidth={420}
        >
          <View style={styles.paymentModalSheet}>
            <View style={styles.paymentModalHeader}>
              <Text
                category={TEXT_TAGS.h3}
                style={styles.paymentModalTitle}
              >
                {t('settings:auth.existingAccount.title')}
              </Text>
              <Pressable
                onPress={() => setExistingAccountModalVisible(false)}
                style={({ pressed }) => [
                  styles.paymentModalClose,
                  pressed && styles.paymentModalClosePressed,
                ]}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('settings:auth.existingAccount.close')}
              >
                <CrossIcon width={22} height={22} />
              </Pressable>
            </View>
            <Text category={TEXT_TAGS.p2} style={styles.paymentModalBody}>
              {t('settings:auth.existingAccount.body', {
                email: existingAccountEmail,
              })}
            </Text>
            <Button
              style={styles.paymentModalButton}
              onPress={handleExistingAccountSignIn}
            >
              {t('settings:auth.existingAccount.signIn')}
            </Button>
          </View>
        </DsModalSheet>
      </Modal>
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
    paddingHorizontal: 25,
    paddingBottom: 28,
    paddingTop: 8,
  },
  /** Колонка экрана: во всю ширину на мобайле, до 480 по центру на ≥768. */
  column: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 14,
  },
  guestWrap: {
    gap: 14,
    alignSelf: 'stretch',
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  heroTitle: {
    color: COLORS.Content,
  },
  heroSubtitle: {
    color: DS_COLORS.ink100,
    lineHeight: 20,
  },
  memberSince: {
    color: DS_COLORS.ink100,
    marginTop: 4,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: DS_COLORS.ground700,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Выбранная вкладка — кант accent400 (см. DS §правила выбора). */
  segmentButtonActive: {
    backgroundColor: DS_COLORS.ground600,
    borderWidth: 1,
    borderColor: DS_COLORS.accent400,
  },
  segmentLabel: {
    color: DS_COLORS.ink100,
  },
  segmentLabelActive: {
    color: COLORS.Content,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  loadingCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.Content,
    marginBottom: 4,
  },
  sectionTitleInline: {
    flex: 1,
    marginBottom: 0,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: DS_COLORS.ink100,
  },
  passwordHint: {
    color: DS_COLORS.ink100,
    lineHeight: 18,
    marginTop: -4,
  },
  fieldLabelSpaced: {
    marginTop: 8,
  },
  readOnlyValue: {
    color: DS_COLORS.ink100,
    paddingVertical: 4,
  },
  accountMeta: {
    color: DS_COLORS.ink100,
    fontSize: 12,
    marginTop: 4,
  },
  paymentsHint: {
    color: DS_COLORS.ink100,
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
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  /** Наведение/нажатие — затемнение 18% (без scale). */
  paymentRowHover: {
    backgroundColor: DS_COLORS.pressDim,
  },
  paymentRowPressed: {
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  paymentRowLeft: {
    gap: 4,
    flex: 1,
  },
  paymentBrand: {
    color: COLORS.Content,
  },
  paymentMasked: {
    color: DS_COLORS.ink100,
  },
  demoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: DS_COLORS.ground600,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  demoBadgeText: {
    color: DS_COLORS.ink100,
    fontSize: 11,
  },
  passwordSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  passwordHeadToggle: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  passwordInputOuter: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  passwordInputWithReveal: {
    paddingRight: 48,
  },
  passwordRevealHit: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
    minWidth: 44,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  passwordRevealPressed: {
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    minHeight: 72,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  addPaymentButtonHover: {
    backgroundColor: DS_COLORS.pressDim,
  },
  addPaymentButtonPressed: {
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  addPaymentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS_COLORS.ground800,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  addPaymentTextCol: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  addPaymentTitle: {
    color: COLORS.Content,
  },
  addPaymentHint: {
    color: DS_COLORS.ink100,
    fontSize: 13,
    lineHeight: 18,
  },
  /** Поле DS §11: h74, r24. */
  input: {
    ...DS_TYPE.body,
    borderWidth: DS_SIZES.fieldBorder,
    borderColor: DS_COLORS.ground600,
    borderRadius: DS_SIZES.fieldRadius,
    minHeight: DS_SIZES.fieldHeight,
    color: COLORS.Content,
    backgroundColor: DS_COLORS.ground700,
    paddingHorizontal: 20,
  },
  inputError: {
    borderColor: DS_COLORS.alarm600,
  },
  errorText: {
    color: DS_COLORS.alarm600,
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
    backgroundColor: DS_COLORS.ground600,
  },
  dividerText: {
    color: DS_COLORS.ink100,
  },
  /** Тихая кнопка (Google и т.п.): фон ground600/ground700, кант ground600. */
  socialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  socialButtonHover: {
    backgroundColor: DS_COLORS.pressDim,
  },
  socialButtonPressed: {
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  socialButtonFull: {
    width: '100%',
  },
  socialButtonText: {
    color: COLORS.Content,
  },
  paymentModalSheet: {
    width: '100%',
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 16,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentModalTitle: {
    flex: 1,
    color: COLORS.Content,
    paddingRight: 4,
  },
  paymentModalClose: {
    padding: 6,
    borderRadius: 12,
    marginTop: -4,
    marginRight: -4,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  paymentModalClosePressed: {
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  paymentModalBody: {
    color: DS_COLORS.ink100,
    lineHeight: 22,
  },
  paymentModalButton: {
    marginTop: 8,
  },
  verifyTitle: {
    color: COLORS.Content,
  },
  verifySubtitle: {
    color: DS_COLORS.ink100,
    lineHeight: 20,
  },
  verifyCodeInput: {
    textAlign: 'center',
    letterSpacing: 6,
    fontSize: 22,
  },
  verifyResendHit: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  verifyResendText: {
    color: COLORS.Primary,
  },
  verifyBackHit: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  verifyBackText: {
    color: DS_COLORS.ink100,
  },
  devCodeBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  devCodeLabel: {
    color: DS_COLORS.ink100,
  },
  devCodeValue: {
    color: COLORS.Primary,
    letterSpacing: 4,
  },
});

export default Auth;
