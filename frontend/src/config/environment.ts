/**
 * environment.ts — Runtime environment configurations and API endpoints.
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'FloodGuard AI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
