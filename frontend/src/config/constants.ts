/**
 * constants.ts — Global platform constants, milestone stages, and color tokens.
 */

export const DEV_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtb3BlcmF0b3IiLCJpYXQiOjE3OTIyNDEwMjEsImV4cCI6MjEwNzYwMTAyMSwicm9sZSI6IkFETUlOIiwiaXNfYWN0aXZlIjp0cnVlfQ.w0W7SL51E_WA-uTg0oL1tWhHAQKBdsOff4cUYJFXMdE';

export const PIPELINE_MILESTONES = [
  { id: 'CONFIG', label: 'Configuration', icon: 'Settings', description: 'Parameter bounds & environmental validation' },
  { id: 'VALIDATION', label: 'Validation', icon: 'CheckCircle', description: 'AOI geometry & date range compliance' },
  { id: 'EARTH_ENGINE', label: 'Earth Engine', icon: 'Globe', description: 'Sentinel-1 SAR GRD acquisition & speckle filtering' },
  { id: 'STAGE_2', label: 'Flood Detection', icon: 'Layers', description: 'Otsu thresholding & morphological delineation' },
  { id: 'STAGE_3', label: 'Settlement Impact', icon: 'Building2', description: 'OSM building, road severance, & population exposure' },
  { id: 'REPORTS', label: 'Report Generation', icon: 'FileText', description: 'Multi-map cartography & damage statistics JSON' },
  { id: 'COMPLETED', label: 'Complete', icon: 'ShieldCheck', description: 'All spatial layers & deliverables persisted' },
] as const;

export const DEFAULT_PRESETS = {
  nepal_terai_koshi: {
    id: 'nepal_terai_koshi',
    name: 'Nepal Terai - Koshi Basin',
    description: 'Eastern Gangetic plains, Koshi River alluvial basin. High historical monsoon flood inundation vulnerability.',
    country: 'Nepal',
    region: 'Terai Lowlands',
    coordinates: [
      [86.9, 26.4],
      [87.3, 26.4],
      [87.3, 26.9],
      [86.9, 26.9],
      [86.9, 26.4],
    ],
    default_before_start: '2024-06-01',
    default_before_end: '2024-06-30',
    default_after_start: '2024-09-15',
    default_after_end: '2024-10-15',
  },
  nepal_terai_west_rapti: {
    id: 'nepal_terai_west_rapti',
    name: 'Nepal Terai - West Rapti Basin',
    description: 'Banke district, Banke National Park & Nepalgunj floodplains.',
    country: 'Nepal',
    region: 'Lumbini Province',
    coordinates: [
      [81.5, 27.9],
      [81.9, 27.9],
      [81.9, 28.3],
      [81.5, 28.3],
      [81.5, 27.9],
    ],
    default_before_start: '2024-06-01',
    default_before_end: '2024-06-30',
    default_after_start: '2024-08-01',
    default_after_end: '2024-09-01',
  },
} as const;

export const COLOR_PALETTE = {
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  backgroundDark: '#0F172A',
  sidebarDark: '#111827',
  surfaceDark: '#1E293B',
  borderDark: '#334155',
} as const;
