import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSignUpMutation,
  useOnboardingMutation,
  signUpSchema,
  createCompanySchema,
} from '@repo/api-client';
import type { SignUpPayload } from '@repo/types';
import { useThemeColor } from '@/hooks/use-theme-color';

const registerSchema = signUpSchema.extend({
  company_name: createCompanySchema.shape.name,
});

type RegisterForm = SignUpPayload & { company_name: string };

export default function RegisterScreen() {
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      company_name: '',
    },
  });

  const signUp = useSignUpMutation();
  const onboard = useOnboardingMutation();
  const insets = useSafeAreaInsets();

  const isLoading = signUp.isPending || onboard.isPending;

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const inputBg = useThemeColor({ light: '#fff', dark: '#1e293b' }, 'background');
  const errorBorderColor = '#ef4444';

  async function onSubmit(data: RegisterForm) {
    setServerError('');

    try {
      // Step 1: Create account
      const authResult = await signUp.mutateAsync({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || undefined,
      });

      if (authResult.error) {
        setServerError(authResult.error.message);
        return;
      }

      // Step 2: Create company (onboarding)
      const companyResult = await onboard.mutateAsync({
        name: data.company_name,
      });

      if (companyResult.error) {
        setServerError(companyResult.error.message);
        return;
      }

      // Auth gate will redirect to /home
    } catch {
      setServerError('Something went wrong. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            Sign up and set up your company to get started
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: textColor }]}>Full name</Text>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.full_name ? errorBorderColor : borderColor,
                      color: textColor,
                      backgroundColor: inputBg,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="John Doe"
                  placeholderTextColor={mutedColor}
                  autoComplete="name"
                  textContentType="name"
                  accessibilityLabel="Full name"
                />
              )}
            />
            {errors.full_name ? (
              <Text style={styles.fieldError}>{errors.full_name.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.email ? errorBorderColor : borderColor,
                      color: textColor,
                      backgroundColor: inputBg,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="you@example.com"
                  placeholderTextColor={mutedColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="Email address"
                />
              )}
            />
            {errors.email ? (
              <Text style={styles.fieldError}>{errors.email.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: textColor }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.password ? errorBorderColor : borderColor,
                      color: textColor,
                      backgroundColor: inputBg,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="At least 8 characters"
                  placeholderTextColor={mutedColor}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  accessibilityLabel="Password"
                />
              )}
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: textColor }]}>
              Phone <Text style={{ color: mutedColor, fontWeight: '400' }}>(optional)</Text>
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.phone ? errorBorderColor : borderColor,
                      color: textColor,
                      backgroundColor: inputBg,
                    },
                  ]}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="+1 234 567 890"
                  placeholderTextColor={mutedColor}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  accessibilityLabel="Phone number"
                />
              )}
            />
            {errors.phone ? (
              <Text style={styles.fieldError}>{errors.phone.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: textColor }]}>Company name</Text>
            <Controller
              control={control}
              name="company_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.company_name ? errorBorderColor : borderColor,
                      color: textColor,
                      backgroundColor: inputBg,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Acme Surveying"
                  placeholderTextColor={mutedColor}
                  accessibilityLabel="Company name"
                />
              )}
            />
            {errors.company_name ? (
              <Text style={styles.fieldError}>{errors.company_name.message}</Text>
            ) : null}
          </View>

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: mutedColor }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link">
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 13,
  },
  serverError: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
});
