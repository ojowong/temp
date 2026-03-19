import api from './api';

export interface Group {
  id: string;
  name: string;
  role?: string;
  userRole?: string;
  memberRole?: string;
  memberCount?: number;
  membersCount?: number;
  member_count?: number;
  members?: unknown[];
  [key: string]: unknown;
}

export interface GroupMember {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface GroupEvent {
  id: string;
  [key: string]: unknown;
}

export interface GroupInvite {
  token?: string;
  inviteUrl?: string;
  [key: string]: unknown;
}

type ApiSuccessResponse<T> = {
  data: T;
};

function unwrapData<T>(response: ApiSuccessResponse<T>) {
  return response.data;
}

export const groupService = {
  list: async (): Promise<Group[]> => {
    const response = await api.get<ApiSuccessResponse<Group[]>>('/groups');
    return unwrapData(response.data);
  },

  getById: async (id: string): Promise<Group> => {
    const response = await api.get<ApiSuccessResponse<Group>>(`/groups/${id}`);
    return unwrapData(response.data);
  },

  create: async (name: string): Promise<Group> => {
    const response = await api.post<ApiSuccessResponse<Group>>('/groups', { name });
    return unwrapData(response.data);
  },

  getMembers: async (id: string): Promise<GroupMember[]> => {
    const response = await api.get<ApiSuccessResponse<GroupMember[]>>(
      `/groups/${id}/members`
    );
    return unwrapData(response.data);
  },

  getEvents: async (id: string): Promise<GroupEvent[]> => {
    const response = await api.get<ApiSuccessResponse<GroupEvent[]>>(
      `/groups/${id}/events`
    );
    return unwrapData(response.data);
  },

  generateInvite: async (id: string): Promise<GroupInvite> => {
    const response = await api.post<ApiSuccessResponse<GroupInvite>>(
      `/groups/${id}/invite`
    );
    return unwrapData(response.data);
  },

  join: async (token: string): Promise<Group> => {
    const response = await api.post<ApiSuccessResponse<Group>>(
      `/groups/join/${token}`
    );
    return unwrapData(response.data);
  },
};
