import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { z } from 'zod';
import { colors } from '../../constants/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      'Unable to log in right now. Please try again.'
    );
  }

  return 'Unable to log in right now. Please try again.';
}

function isValidAuthPayload(payload: unknown): payload is {
  user: { id: string; name: string; email: string; timezone: string };
  accessToken: string;
  refreshToken: string;
} {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'user' in payload &&
      'accessToken' in payload &&
      'refreshToken' in payload
  );
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const [submissionError, setSubmissionError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmissionError('');

    try {
      const response = await api.post('/auth/login', values);
      const payload = response.data?.data;

      if (!isValidAuthPayload(payload)) {
        throw new Error('Invalid login response.');
      }

      await setUser(payload.user, payload.accessToken, payload.refreshToken);
    } catch (error) {
      setSubmissionError(getErrorMessage(error));
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your InnerCircle groups and plans.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textLight}
                    style={[styles.input, errors.email ? styles.inputError : null]}
                    value={value}
                  />
                )}
              />
              {errors.email ? (
                <Text style={styles.fieldError}>{errors.email.message}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textLight}
                    secureTextEntry
                    style={[styles.input, errors.password ? styles.inputError : null]}
                    value={value}
                  />
                )}
              />
              {errors.password ? (
                <Text style={styles.fieldError}>{errors.password.message}</Text>
              ) : null}
            </View>

            {submissionError ? (
              <Text style={styles.submitError}>{submissionError}</Text>
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.button,
                pressed ? styles.buttonPressed : null,
                isSubmitting ? styles.buttonDisabled : null,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create one</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textLight,
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    color: colors.error,
    fontSize: 13,
    marginTop: 8,
  },
  submitError: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    minHeight: 54,
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
    marginRight: 6,
  },
  footerLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
