import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { colors } from '../../constants/colors';
import { groupService, type Group } from '../../services/groupService';

type HomeNavigationParamList = {
  Home: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeNavigationParamList,
  'Home'
>;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      'Unable to load your groups right now. Please try again.'
    );
  }

  return 'Unable to load your groups right now. Please try again.';
}

function formatRole(role?: string) {
  if (!role) {
    return 'Member';
  }

  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function getRoleLabel(group: Group) {
  const role =
    typeof group.role === 'string'
      ? group.role
      : typeof group.userRole === 'string'
        ? group.userRole
        : typeof group.memberRole === 'string'
          ? group.memberRole
          : 'Member';

  return formatRole(role);
}

function getMemberCount(group: Group) {
  if (typeof group.memberCount === 'number') {
    return group.memberCount;
  }

  if (typeof group.membersCount === 'number') {
    return group.membersCount;
  }

  if (typeof group.member_count === 'number') {
    return group.member_count;
  }

  if (Array.isArray(group.members)) {
    return group.members.length;
  }

  return 0;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const nextGroups = await groupService.list();
      setGroups(nextGroups);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>InnerCircle</Text>,
      headerTitleAlign: 'left',
      headerRight: () => (
        <Pressable
          accessibilityLabel="Create group"
          onPress={() => navigation.navigate('CreateGroup')}
          style={({ pressed }) => [
            styles.headerButton,
            pressed ? styles.headerButtonPressed : null,
          ]}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      void loadGroups();
    }, [loadGroups])
  );

  const handleRetry = useCallback(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleRefresh = useCallback(() => {
    void loadGroups(true);
  }, [loadGroups]);

  const renderGroupCard = useCallback(
    ({ item }: { item: Group }) => (
      <Pressable
        onPress={() =>
          navigation.navigate('GroupDetail', {
            groupId: item.id,
          })
        }
        style={({ pressed }) => [
          styles.card,
          pressed ? styles.cardPressed : null,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(item)}</Text>
          </View>
        </View>
        <Text style={styles.memberCount}>
          {getMemberCount(item)} member{getMemberCount(item) === 1 ? '' : 's'}
        </Text>
      </Pressable>
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed ? styles.retryButtonPressed : null,
            ]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            groups.length === 0 ? styles.emptyListContent : null,
          ]}
          data={groups}
          keyExtractor={(item) => item.id}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          renderItem={renderGroupCard}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No groups yet. Create one or join with an invite link.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerButtonPressed: {
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupName: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  memberCount: {
    color: colors.textLight,
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
