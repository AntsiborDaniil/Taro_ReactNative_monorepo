import { baseApi } from '@shared/api/baseApi';

/** Статус награды недели по серверным отметкам (habitRewardService в API). */
export type HabitWeekStatus = {
  weekStart: string;
  daysWithCheckins: number;
  claimed: boolean;
  minDays: number;
  credits: number;
};

export type HabitWeekClaimResponse = {
  status: 'granted' | 'already' | 'not_enough_days';
  spreadCredits: number;
  daysWithCheckins: number;
  requiredDays: number;
};

/**
 * Серверный след целей: отметка «за сегодня» (день ставит сервер — перевод часов
 * на устройстве не помогает) и награда +1 заряд за закрытую неделю.
 */
export const habitsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    habitCheckin: build.mutation<HabitWeekStatus, { habitId: string; done: boolean }>({
      query: (body) => ({ url: '/api/habits/checkin', method: 'POST', body }),
      invalidatesTags: ['HabitWeek'],
    }),
    getHabitWeekReward: build.query<HabitWeekStatus, void>({
      query: () => ({ url: '/api/habits/week-reward', method: 'GET' }),
      providesTags: ['HabitWeek'],
    }),
    claimHabitWeekReward: build.mutation<HabitWeekClaimResponse, { requiredDays: number }>({
      query: (body) => ({ url: '/api/habits/week-reward', method: 'POST', body }),
      invalidatesTags: ['HabitWeek'],
    }),
  }),
});

export const { useHabitCheckinMutation, useGetHabitWeekRewardQuery, useClaimHabitWeekRewardMutation } = habitsApi;
