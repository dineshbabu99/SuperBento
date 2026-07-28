import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { apiClient } from './axios';

interface AxiosBaseQueryArgs {
  baseUrl: string;
}

interface QueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
}

interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: unknown;
}

/**
 * RTK Query base query using our pre-configured Axios instance
 * (which already handles token refresh, auth headers, etc.)
 */
export const axiosBaseQuery =
  ({ baseUrl }: AxiosBaseQueryArgs): BaseQueryFn<QueryArgs, unknown, ApiErrorResponse> =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await apiClient({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });

      // Unwrap our standard API response envelope
      const responseData = result.data;
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return { data: responseData.data };
      }
      return { data: responseData };
    } catch (axiosError) {
      const err = axiosError as AxiosError<ApiErrorResponse>;
      return {
        error: {
          statusCode: err.response?.status ?? 500,
          message: err.response?.data?.message ?? err.message ?? 'An error occurred',
          errors: err.response?.data?.errors,
        },
      };
    }
  };
