# React Native Component Patterns

## Screen Template
import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../constants/colors';

export default function ExampleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* content here */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

## Form Pattern with React Hook Form + Zod
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

type FormData = z.infer<typeof schema>;

const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

## API Call Pattern in a Screen
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (data: FormData) => {
  setLoading(true);
  setError(null);
  try {
    const response = await authService.login(data);
    // handle success
  } catch (err: any) {
    setError(err.response?.data?.error?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};

## Common Components to Reuse
- Button: primary, secondary, danger variants
- Input: with label, error message, and icon support
- Card: white background, shadow, rounded corners
- LoadingSpinner: centered ActivityIndicator
- ErrorMessage: red text with error icon

## StyleSheet Rules
- Never use inline styles
- Always use StyleSheet.create()
- Use colors from src/constants/colors.ts
- Standard spacing: 8, 16, 24, 32
- Standard border radius: 8, 12, 16
- Standard font sizes: 12, 14, 16, 18, 24, 32