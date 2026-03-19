import api from './api';

export interface ScheduleRequestPayload {
  activity: string;
  group_id: string;
  start_range: string;
  end_range: string;
}

export interface ScheduleRequest {
  id: string;
  activity?: string;
  group_id?: string;
  start_range?: string;
  end_range?: string;
  [key: string]: unknown;
}

export interface ScheduleSuggestion {
  id: string;
  [key: string]: unknown;
}

export interface ScheduleVoteResult {
  vote: {
    id?: string;
    suggestion_id?: string;
    vote?: 'yes' | 'no' | 'maybe';
    [key: string]: unknown;
  };
  confirmed?: boolean;
  event?: {
    id?: string;
    [key: string]: unknown;
  };
}

export interface ScheduleCreateResponse {
  request: ScheduleRequest;
  suggestions: ScheduleSuggestion[];
}

type ApiSuccessResponse<T> = {
  data: T;
};

function unwrapData<T>(response: ApiSuccessResponse<T>) {
  return response.data;
}

export const scheduleService = {
  createRequest: async (
    data: ScheduleRequestPayload
  ): Promise<ScheduleCreateResponse> => {
    const response = await api.post<ApiSuccessResponse<ScheduleCreateResponse>>(
      '/schedule/request',
      data
    );
    return unwrapData(response.data);
  },

  getSuggestions: async (requestId: string): Promise<ScheduleSuggestion[]> => {
    const response = await api.get<ApiSuccessResponse<ScheduleSuggestion[]>>(
      `/schedule/suggestions/${requestId}`
    );
    return unwrapData(response.data);
  },

  vote: async (
    suggestion_id: string,
    vote: 'yes' | 'no' | 'maybe'
  ): Promise<ScheduleVoteResult> => {
    const response = await api.post<ApiSuccessResponse<ScheduleVoteResult>>(
      '/schedule/vote',
      {
        suggestion_id,
        vote,
      }
    );
    return unwrapData(response.data);
  },

  confirm: async (suggestionId: string): Promise<Record<string, unknown>> => {
    const response = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
      `/schedule/confirm/${suggestionId}`
    );
    return unwrapData(response.data);
  },
};
