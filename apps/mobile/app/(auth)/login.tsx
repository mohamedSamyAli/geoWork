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
import { useSignInMutation, signInSchema } from '@repo/api-client';
import type { SignInPayload } from '@repo/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInPayload>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signIn = useSignInMutation();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const inputBg = useThemeColor({ light: '#fff', dark: '#1e293b' }, 'background');
  const errorBorderColor = '#ef4444';

  function onSubmit(data: SignInPayload) {
    setServerError('');

    signIn.mutate(data, {
      onSuccess: (result) => {
        if (result.error) {
          setServerError(result.error.message);
        }
        // Auth gate redirects to /home on success
      },
      onError: () => {
        setServerError('Something went wrong. Please try again.');
      },
    });
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
          <Text style={[styles.title, { color: textColor }]}>Sign in</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            Enter your credentials to access your account
          </Text>
        </View>

        <View style={styles.form}>
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
                  placeholder="Enter your password"
                  placeholderTextColor={mutedColor}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  accessibilityLabel="Password"
                />
              )}
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            ) : null}
          </View>

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={signIn.isPending}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {signIn.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: mutedColor }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/register" asChild>
            <Pressable accessibilityRole="link">
              <Text style={styles.footerLink}>Sign up</Text>
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
