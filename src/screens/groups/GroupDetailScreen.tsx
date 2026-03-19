import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { colors } from '../../constants/colors';
import {
  groupService,
  type Group,
  type GroupEvent,
  type GroupInvite,
  type GroupMember,
} from '../../services/groupService';
import { useAuthStore } from '../../store/authStore';

type GroupDetailParamList = {
  GroupDetail: { groupId: string };
  ScheduleRequest: { groupId: string };
};

type GroupDetailNavigationProp = NativeStackNavigationProp<
  GroupDetailParamList,
  'GroupDetail'
>;

type GroupDetailRouteProp = RouteProp<GroupDetailParamList, 'GroupDetail'>;

type DisplayEvent = {
  id: string;
  title: string;
  dateLabel: string;
  location: string | null;
  startsAt: Date | null;
};

const AVATAR_COLORS = [
  '#1E3A5F',
  '#4A90D9',
  '#27AE60',
  '#F39C12',
  '#E67E22',
  '#16A085',
];

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      'Unable to load this group right now. Please try again.'
    );
  }

  return 'Unable to load this group right now. Please try again.';
}

function getStringValue(
  value: unknown,
  fallback = ''
): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function getGroupMemberName(member: GroupMember) {
  const name = getStringValue(member.name);

  if (name) {
    return name;
  }

  const email = getStringValue(member.email);
  if (email) {
    return email.split('@')[0];
  }

  return 'Member';
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function getMemberRole(member: GroupMember) {
  const role = getStringValue(member.role, 'member').toLowerCase();

  if (role === 'owner') {
    return 'Owner';
  }

  if (role === 'admin') {
    return 'Admin';
  }

  return 'Member';
}

function getMemberCount(group: Group | null, members: GroupMember[]) {
  if (typeof group?.memberCount === 'number') {
    return group.memberCount;
  }

  if (typeof group?.membersCount === 'number') {
    return group.membersCount;
  }

  if (typeof group?.member_count === 'number') {
    return group.member_count;
  }

  return members.length;
}

function getInviteMessage(invite: GroupInvite) {
  const inviteUrl = getStringValue(invite.inviteUrl);

  if (inviteUrl) {
    return inviteUrl;
  }

  const token = getStringValue(invite.token);
  if (token) {
    return `Invite token: ${token}`;
  }

  return 'Invite created successfully.';
}

function getInviteLink(invite: GroupInvite) {
  const inviteUrl = getStringValue(invite.inviteUrl);

  if (inviteUrl) {
    return inviteUrl;
  }

  return getStringValue(invite.token);
}

function getEventStringField(event: GroupEvent, keys: string[]) {
  for (const key of keys) {
    const value = event[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

function getEventDate(event: GroupEvent) {
  const rawDate = getEventStringField(event, [
    'start_time',
    'startTime',
    'starts_at',
    'startsAt',
    'scheduled_at',
    'scheduledAt',
    'date_time',
    'dateTime',
    'datetime',
    'date',
  ]);

  if (!rawDate) {
    return null;
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(date: Date | null) {
  if (!date) {
    return 'Date TBD';
  }

  const dayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return `${dayLabel} · ${timeLabel}`;
}

function getDisplayEvent(event: GroupEvent): DisplayEvent {
  const startsAt = getEventDate(event);
  const title =
    getEventStringField(event, ['title', 'activity', 'name']) || 'Untitled Event';
  const location =
    getEventStringField(event, ['location', 'venue', 'place', 'address']) || null;
  const dateLabel = formatEventDate(startsAt);

  return {
    id:
      getEventStringField(event, ['id']) ||
      `${title}-${dateLabel}-${location ?? 'no-location'}`,
    title,
    dateLabel,
    location,
    startsAt,
  };
}

function isConfirmedEvent(event: GroupEvent) {
  if (typeof event.confirmed === 'boolean') {
    return event.confirmed;
  }

  if (typeof event.isConfirmed === 'boolean') {
    return event.isConfirmed;
  }

  if (typeof event.status === 'string') {
    return event.status.toLowerCase() === 'confirmed';
  }

  return true;
}

function isUpcomingEvent(event: DisplayEvent) {
  if (!event.startsAt) {
    return true;
  }

  return event.startsAt.getTime() >= Date.now();
}

function sortMembers(members: GroupMember[], currentUserId?: string) {
  const roleOrder: Record<string, number> = {
    owner: 0,
    admin: 1,
    member: 2,
  };

  return [...members].sort((left, right) => {
    if (currentUserId) {
      if (left.id === currentUserId && right.id !== currentUserId) {
        return -1;
      }

      if (right.id === currentUserId && left.id !== currentUserId) {
        return 1;
      }
    }

    const leftRole = getStringValue(left.role, 'member').toLowerCase();
    const rightRole = getStringValue(right.role, 'member').toLowerCase();
    const roleDifference =
      (roleOrder[leftRole] ?? roleOrder.member) -
      (roleOrder[rightRole] ?? roleOrder.member);

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return getGroupMemberName(left).localeCompare(getGroupMemberName(right));
  });
}

export default function GroupDetailScreen() {
  const navigation = useNavigation<GroupDetailNavigationProp>();
  const route = useRoute<GroupDetailRouteProp>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { groupId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroupDetails = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [nextGroup, nextMembers, nextEvents] = await Promise.all([
          groupService.getById(groupId),
          groupService.getMembers(groupId),
          groupService.getEvents(groupId),
        ]);

        setGroup(nextGroup);
        setMembers(sortMembers(nextMembers, currentUserId));
        setEvents(
          nextEvents
            .filter(isConfirmedEvent)
            .map(getDisplayEvent)
            .filter(isUpcomingEvent)
            .sort((left, right) => {
              if (!left.startsAt && !right.startsAt) {
                return left.title.localeCompare(right.title);
              }

              if (!left.startsAt) {
                return 1;
              }

              if (!right.startsAt) {
                return -1;
              }

              return left.startsAt.getTime() - right.startsAt.getTime();
            })
        );
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUserId, groupId]
  );

  useEffect(() => {
    void loadGroupDetails();
  }, [loadGroupDetails]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: group?.name ?? 'Group Detail',
    });
  }, [group?.name, navigation]);

  const handleRetry = useCallback(() => {
    void loadGroupDetails();
  }, [loadGroupDetails]);

  const handleRefresh = useCallback(() => {
    void loadGroupDetails(true);
  }, [loadGroupDetails]);

  const handleSchedulePress = useCallback(() => {
    navigation.navigate('ScheduleRequest', { groupId });
  }, [groupId, navigation]);

  const handleInvitePress = useCallback(async () => {
    setInviteLoading(true);

    try {
      const invite = await groupService.generateInvite(groupId);
      const nextInviteLink = getInviteLink(invite);

      if (!nextInviteLink) {
        Alert.alert('Invite Member', getInviteMessage(invite));
        return;
      }

      setInviteLink(nextInviteLink);
      setInviteModalVisible(true);
    } catch (inviteError) {
      Alert.alert('Invite Member', getErrorMessage(inviteError));
    } finally {
      setInviteLoading(false);
    }
  }, [groupId]);

  const handleShareInvite = useCallback(async () => {
    if (!inviteLink) {
      return;
    }

    try {
      await Share.share({
        message: `Join my InnerCircle group: ${inviteLink}`,
        url: inviteLink,
      });
    } catch (shareError) {
      Alert.alert('Share Invite', getErrorMessage(shareError));
    }
  }, [inviteLink]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !group) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType="slide"
        onRequestClose={() => setInviteModalVisible(false)}
        transparent
        visible={inviteModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite Link</Text>
            <Text style={styles.modalSubtitle}>
              Long press the link to copy it, or share it directly.
            </Text>

            <View style={styles.linkBox}>
              <Text selectable style={styles.linkText}>
                {inviteLink}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void handleShareInvite();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>Share Invite Link</Text>
            </Pressable>

            <Pressable
              onPress={() => setInviteModalVisible(false)}
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.modalCloseButton,
                pressed ? styles.secondaryButtonPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.title}>{group?.name ?? 'Group Detail'}</Text>
          <Text style={styles.memberCount}>
            {getMemberCount(group, members)} member
            {getMemberCount(group, members) === 1 ? '' : 's'}
          </Text>
          <View style={styles.avatarRow}>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>No members yet</Text>
            ) : (
              members.map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.headerAvatar,
                    { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                  ]}
                >
                  <Text style={styles.headerAvatarText}>
                    {getInitial(getGroupMemberName(member))}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Pressable
            onPress={handleSchedulePress}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>Schedule Something</Text>
          </Pressable>
          <Pressable
            disabled={inviteLoading}
            onPress={() => {
              void handleInvitePress();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              inviteLoading ? styles.disabledButton : null,
              pressed ? styles.secondaryButtonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {inviteLoading ? 'Generating Invite...' : 'Invite Member'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming events yet</Text>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{event.title}</Text>
                <Text style={styles.listItemSubtitle}>{event.dateLabel}</Text>
                {event.location ? (
                  <Text style={styles.locationText}>{event.location}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Members</Text>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members yet</Text>
          ) : (
            members.map((member, index) => (
              <View key={member.id} style={styles.memberRow}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                  ]}
                >
                  <Text style={styles.memberAvatarText}>
                    {getInitial(getGroupMemberName(member))}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{getGroupMemberName(member)}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{getMemberRole(member)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: colors.textLight,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  linkBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FDECEC',
    borderColor: '#F7C6C6',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
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
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  memberCount: {
    color: colors.textLight,
    fontSize: 16,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerAvatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  headerAvatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.background,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  listItem: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  listItemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemSubtitle: {
    color: colors.textLight,
    fontSize: 16,
    lineHeight: 22,
  },
  locationText: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  memberRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  memberAvatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  roleBadge: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 16,
    lineHeight: 24,
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
    borderRadius: 12,
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
