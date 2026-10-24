import { apiClient } from '@/api/client';
import { ApiResponse } from '@/types/api';

export interface GaugeForecast {
  station_id: string;
  station_name: string;
  current_stage_m: number;
  warning_stage_m: number;
  danger_stage_m: number;
  rate_of_rise_cm_per_hour: number;
  critical_rising_alert: boolean;
  horizon_hours: number;
  stage_forecast: Array<{
    hours_ahead: number;
    stage_m: number;
    warning_threshold_crossed: boolean;
    danger_threshold_crossed: boolean;
  }>;
  downstream_forecasts: Array<{
    settlement_name: string;
    projected_arrival_hours: number;
    projected_stage_at_arrival_m: number;
    danger_threshold_projected: boolean;
  }>;
  assumptions: string[];
}

export async function fetchGaugeForecast(stationId: string, horizonHours = 24): Promise<GaugeForecast> {
  const response = await apiClient.get<ApiResponse<GaugeForecast>>('/api/v1/telemetry/forecast', {
    params: { station_id: stationId, horizon_hours: horizonHours },
  });
  return response.data.data;
}
