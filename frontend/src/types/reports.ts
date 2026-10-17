/**
 * reports.ts — Report models and filter params.
 */

export interface ReportItem {
  id: string;
  flood_event_id: string;
  report_type: string;
  format: string;
  report_path: string;
  download_url: string;
  created_at: string;
}
