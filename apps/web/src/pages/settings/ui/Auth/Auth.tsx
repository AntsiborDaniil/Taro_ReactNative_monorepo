import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Header } from 'features/header';
import { COLORS } from 'shared/themes';
import { Button, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

type AuthTab = 'signin' | 'signup';
type AuthFormValues = {
  name: string;
  email: string;
  password: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Auth() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AuthTab>('signin');
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
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

  const onSubmit = async (): Promise<void> => {
    if (isSignUp) {
      const signUpValid = await trigger(['name', 'email', 'password']);
      if (!signUpValid) {
        return;
      }
    }

    Toast.show({
      type: 'success',
      text1: t('settings:auth.stub.title'),
      text2: t('settings:auth.stub.subtitle'),
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
          <View style={styles.heroTopGlow} />
          <Text category={TEXT_TAGS.h2} style={styles.heroTitle}>
            {t('settings:auth.hero.title')}
          </Text>
          <Text category={TEXT_TAGS.p2} style={styles.heroSubtitle}>
            {t('settings:auth.hero.subtitle')}
          </Text>
        </View>

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

        <View style={styles.formCard}>
          {isSignUp && (
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
          )}

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
                  style={[styles.input, errors.password && styles.inputError]}
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
              onPress={handleSubmit(onSubmit)}
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
              onPress={handleSubmit(onSubmit)}
            >
              <Text category={TEXT_TAGS.h4} style={styles.socialButtonText}>
                Apple
              </Text>
            </Pressable>
          </View>
        </View>
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
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: 'rgba(221, 231, 247, 0.9)',
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
