/**
 * api.ts — Generic API envelope and response types matching backend schemas.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  timestamp: string;
  request_id?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  timestamp: string;
  request_id?: string | null;
}

export interface ApiErrorDetail {
  loc?: (string | number)[];
  msg: string;
  type?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  detail?: string | ApiErrorDetail[];
  message?: string;
  timestamp?: string;
  request_id?: string;
}
