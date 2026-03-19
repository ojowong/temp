import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;
type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      'Unable to create your account right now. Please try again.'
    );
  }

  return 'Unable to create your account right now. Please try again.';
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

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const [submissionError, setSubmissionError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async ({ confirmPassword, ...values }) => {
    setSubmissionError('');

    try {
      const response = await api.post('/auth/register', values);
      const payload = response.data?.data;

      if (!isValidAuthPayload(payload)) {
        throw new Error('Invalid register response.');
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Start organizing group schedules with InnerCircle.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="words"
                    autoComplete="name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Your name"
                    placeholderTextColor={colors.textLight}
                    style={[styles.input, errors.name ? styles.inputError : null]}
                    value={value}
                  />
                )}
              />
              {errors.name ? (
                <Text style={styles.fieldError}>{errors.name.message}</Text>
              ) : null}
            </View>

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
                    autoComplete="new-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Create a password"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Repeat your password"
                    placeholderTextColor={colors.textLight}
                    secureTextEntry
                    style={[
                      styles.input,
                      errors.confirmPassword ? styles.inputError : null,
                    ]}
                    value={value}
                  />
                )}
              />
              {errors.confirmPassword ? (
                <Text style={styles.fieldError}>
                  {errors.confirmPassword.message}
                </Text>
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
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: colors.primary,
    fontSize: 30,
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
