import React, { useLayoutEffect, useState } from 'react';
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
import type { HomeStackParamList } from '../../navigation/AppNavigator';
import { groupService } from '../../services/groupService';

const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Group name must be at least 2 characters.'),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;
type CreateGroupScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'CreateGroup'
>;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      'Unable to create your group right now. Please try again.'
    );
  }

  return 'Unable to create your group right now. Please try again.';
}

export default function CreateGroupScreen({
  navigation,
}: CreateGroupScreenProps) {
  const [submissionError, setSubmissionError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Create Group',
    });
  }, [navigation]);

  const onSubmit = handleSubmit(async ({ name }) => {
    setSubmissionError('');

    try {
      await groupService.create(name);
      navigation.goBack();
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
            <Text style={styles.title}>Create Group</Text>
            <Text style={styles.subtitle}>
              Start a new InnerCircle group and invite people in.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Group name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="words"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Weekend Basketball"
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
                <Text style={styles.buttonText}>Create Group</Text>
              )}
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 10,
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
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
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
});
