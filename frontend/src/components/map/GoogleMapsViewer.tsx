/**
 * GoogleMapsViewer.tsx — Enterprise Google Maps JavaScript API v3 Platform.
 *
 * Comprehensive Features for Nepal Terai Disaster Command:
 * 1. Strictly constrained to Nepal Terai Lowlands (Lat 26.20°N–28.35°N, Lon 79.95°E–88.25°E).
 * 2. High-resolution Sentinel-1 SAR Flood Corridors across all 11 major river basins.
 * 3. All 21 Terai District Hubs displayed as prominent color points (Crimson, Orange, Cyan, Green).
 * 4. Constituent Villages & Towns with water depth tags (e.g. 2.4m, 1.8m) and evacuation protocols.
 * 5. Interactive Settlement Filter HUD (All, Flooded Only, Safe Only) and Fast Village Search.
 * 6. Visualizes Critical Infrastructure: Hospitals, Clinics, and Emergency Highway Traffic.
 * 7. Emergency Relief Convoy & Civilian Alternate Evacuation Routing with on-map special highlighting.
 * 8. Map Fullscreen toggle for situational immersion.
 * 9. Dual Engine fallback: Instant toggle between Google Maps JS API and high-speed Leaflet.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let googleMapsOptionsConfigured = false;

import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  Compass,
  Cross,
  Eye,
  Filter,
  Globe,
  HeartPulse,
  Info,
  Key,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Phone,
  Radio,
  RefreshCw,
  Route,
  Satellite,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Truck,
  Waves,
  X,
  Zap,
} from 'lucide-react';

import {
  DATE_PRESETS,
  TERAI_REGIONS,
  TeraiRegionData,
  VillageSettlement,
  SafeHavenZone,
} from '@/data/teraiRegions';
import { nepalBoundaries } from '@/data/nepalBoundaries';
import { TERAI_HOSPITALS, HospitalFacility } from '@/data/teraiInfrastructure';
import { TERAI_SAFE_HAVENS, SafeHavenFacility } from '@/data/teraiSafeHavens';
import {
  TERAI_CITIES_DATA,
  TeraiCityData,
  VillageTownItem,
  createCityColorLeafletPin,
} from '@/data/teraiCitiesData';
import {
  TERAI_FLOOD_CORRIDORS,
  FloodCorridorData,
} from '@/data/teraiFloodCorridors';
import {
  EMERGENCY_ROUTES,
  EmergencyRoute,
} from '@/data/teraiEmergencyRoutes';
import {
  TERAI_ROAD_SEGMENTS,
  TERAI_BRIDGES,
  RoadSegment,
  TeraiBridge,
} from '@/data/teraiRoadNetwork';
import { CityVillagesModal } from '@/components/map/CityVillagesModal';
import { SettlementDossierModal } from '@/components/intelligence/SettlementDossierModal';
import {
  NEPAL_RIVER_BASINS,
  NEPAL_RIVERS,
  LiveRiverData,
  RiverBasinData,
  getRiverStatusColor,
} from '@/data/nepalRiverBasinsAndRivers';
import { LiveRiverTelemetryModal } from '@/components/gauges/LiveRiverTelemetryModal';

// Strict geographical bounds for Nepal Terai Lowlands (excludes high mountain ranges)
const NEPAL_TERAI_BOUNDS = {
  north: 28.35, // Terai foothills edge
  south: 26.20, // Southern border with Bihar/UP
  west: 79.95,  // Western border (Mahakali river)
  east: 88.25,  // Eastern border (Mechi river)
};

const LEAFLET_TERAI_BOUNDS: [[number, number], [number, number]] = [
  [26.15, 79.85],
  [28.40, 88.35],
];

// Tile URLs for Google Basemaps via Leaflet fallback
const GOOGLE_TILE_URLS = {
  hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
};

// Custom Leaflet Icons for Fallback Mode
const createHospitalLeafletIcon = (isFlooded: boolean) =>
  L.divIcon({
    className: 'custom-hospital-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        background: ${isFlooded ? '#EF4444' : '#0284C7'};
        border-radius: 8px;
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
      ">
        +
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

const createVillageLeafletIcon = (v: VillageTownItem, isTargeted: boolean = false) =>
  L.divIcon({
    className: 'custom-village-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      ">
        ${
          isTargeted
            ? `<div style="
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(239, 68, 68, 0.45);
                animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>`
            : ''
        }
        <div style="
          width: ${v.isFlooded ? '22px' : '18px'};
          height: ${v.isFlooded ? '22px' : '18px'};
          border-radius: 50%;
          background: ${v.isFlooded ? '#DC2626' : '#10B981'};
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 10px ${v.isFlooded ? '#EF4444' : '#10B981'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 900;
        ">
          ${v.isFlooded ? '!' : '✓'}
        </div>
        ${
          v.floodDepthMeters
            ? `<div style="
                margin-top: 2px;
                white-space: nowrap;
                background: #7F1D1D;
                color: #FCA5A5;
                border: 1px solid #DC2626;
                font-size: 8px;
                font-weight: 800;
                padding: 0 4px;
                border-radius: 3px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.5);
              ">${v.floodDepthMeters}m</div>`
            : ''
        }
      </div>
    `,
    iconSize: [24, 34],
    iconAnchor: [12, 17],
    popupAnchor: [0, -17],
  });

const createCheckpointLeafletIcon = (cp: { name: string; status: string }) => {
  const isStaging = cp.status === 'staging_post';
  const color = isStaging ? '#3B82F6' : '#F59E0B';
  return L.divIcon({
    className: 'checkpoint-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px ${color};
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 900;
      ">
        ${isStaging ? '⚑' : '▲'}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

const createBridgeLeafletIcon = (bridge: TeraiBridge) => {
  const isCritical = bridge.status === 'critical_danger';
  const color = isCritical ? '#EF4444' : bridge.status === 'high_warning' ? '#F59E0B' : '#06B6D4';
  return L.divIcon({
    className: 'bridge-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 6px;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px ${color};
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 900;
      ">
        BRIDGE
      </div>
    `,
    iconSize: [44, 20],
    iconAnchor: [22, 10],
    popupAnchor: [0, -10],
  });
};

const createSafeHavenLeafletIcon = (haven: SafeHavenFacility) => {
  return L.divIcon({
    className: 'shelter-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #10B981;
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px #10B981;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 900;
      ">
        HLZ
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Controller to sync Leaflet container size and flyTo region
const LeafletViewController: React.FC<{
  center: [number, number];
  zoom: number;
  onMapReady?: (map: L.Map) => void;
}> = ({ center, zoom, onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, zoom, {
      duration: 1.0,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
};

export interface GoogleMapsViewerProps {
  apiKey?: string;
  defaultRegionKey?: string;
  selectedRegionKey?: string;
  selectedDistrict?: string;
  viewLayerMode?: 'both' | 'flooded' | 'safe';
  selectedDatePreset?: string;
  beforeDate?: string;
  afterDate?: string;
  initialRouteId?: string;
  selectedRouteId?: string;
  hideHeader?: boolean;
  provider?: 'google_maps' | 'leaflet';
  onProviderChange?: (provider: 'google_maps' | 'leaflet') => void;
  onRegionChange?: (regionKey: string) => void;
  onDistrictChange?: (district: string) => void;
  onViewLayerModeChange?: (mode: 'both' | 'flooded' | 'safe') => void;
}

const isKeyPlaceholder = (key?: string) => {
  if (!key) return true;
  const clean = key.trim();
  return (
    clean.length < 20 ||
    clean.includes('your_') ||
    clean.includes('placeholder') ||
    clean === 'your_google_maps_api_key_here'
  );
};

export const GoogleMapsViewer: React.FC<GoogleMapsViewerProps> = ({
  apiKey: initialApiKey,
  defaultRegionKey = 'full_terai',
  selectedRegionKey: propSelectedRegionKey,
  selectedDistrict: propSelectedDistrict,
  viewLayerMode: propViewLayerMode,
  selectedDatePreset: propSelectedDatePreset,
  beforeDate: propBeforeDate,
  afterDate: propAfterDate,
  initialRouteId = 'none',
  selectedRouteId: propSelectedRouteId,
  hideHeader = false,
  provider: propProvider,
  onProviderChange,
  onRegionChange,
  onDistrictChange,
  onViewLayerModeChange,
}) => {
  const rawEnvKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasValidConfiguredKey = !isKeyPlaceholder(initialApiKey) || !isKeyPlaceholder(rawEnvKey);

  // API Key State (Fallback to Vite Env or User Key)
  const [apiKey, setApiKey] = useState<string>(
    (!isKeyPlaceholder(initialApiKey) && initialApiKey) ||
    (!isKeyPlaceholder(rawEnvKey) && rawEnvKey) ||
    ''
  );
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);

  // Provider State: Default to high-speed Leaflet if no valid Google Maps API key is configured
  const [provider, setProvider] = useState<'google_maps' | 'leaflet'>(
    propProvider || (hasValidConfiguredKey && apiKey ? 'google_maps' : 'leaflet')
  );

  useEffect(() => {
    if (propProvider && propProvider !== provider) {
      setProvider(propProvider);
    }
  }, [propProvider]);

  const handleSetProvider = (newProvider: 'google_maps' | 'leaflet') => {
    setProvider(newProvider);
    if (onProviderChange) onProviderChange(newProvider);
  };

  const [isLoadingGoogle, setIsLoadingGoogle] = useState<boolean>(false);
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);

  // Region & District State
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>(
    propSelectedRegionKey || defaultRegionKey
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    propSelectedDistrict || 'all'
  );
  const [mapRenderTrigger, setMapRenderTrigger] = useState<number>(0);
  const activeRegion: TeraiRegionData = TERAI_REGIONS[selectedRegionKey] || TERAI_REGIONS.full_terai;

  // Stage 5.3 Settlement Filter & Search State
  const [settlementFilter, setSettlementFilter] = useState<'all' | 'flooded_only' | 'safe_only'>('all');
  const [villageSearchQuery, setVillageSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [focusedVillage, setFocusedVillage] = useState<VillageTownItem | null>(null);

  // Emergency Routing State (Point 7 & 9)
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    propSelectedRouteId || initialRouteId
  );

  useEffect(() => {
    if (propSelectedRouteId !== undefined && propSelectedRouteId !== selectedRouteId) {
      setSelectedRouteId(propSelectedRouteId);
    }
  }, [propSelectedRouteId]);

  const activeRoute: EmergencyRoute | undefined = EMERGENCY_ROUTES.find((r) => r.id === selectedRouteId);

  // Fullscreen Mode State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Map Controls State
  const [mapTypeId, setMapTypeId] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [showNepalBorder, setShowNepalBorder] = useState<boolean>(true);
  const [showTeraiBoundary, setShowTeraiBoundary] = useState<boolean>(true);
  const [showFloodPolygons, setShowFloodPolygons] = useState<boolean>(true);
  const [highlightFloodedDotted, setHighlightFloodedDotted] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [showCityPoints, setShowCityPoints] = useState<boolean>(true);
  const [showVillagePins, setShowVillagePins] = useState<boolean>(true);
  const [showRoadNetwork, setShowRoadNetwork] = useState<boolean>(true);
  const [showBridges, setShowBridges] = useState<boolean>(true);
  const [showDottedRivers, setShowDottedRivers] = useState<boolean>(true);
  const [showDottedBasins, setShowDottedBasins] = useState<boolean>(true);
  const [selectedRiver, setSelectedRiver] = useState<LiveRiverData | null>(null);
  const [isRiverModalOpen, setIsRiverModalOpen] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<TeraiCityData | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState<boolean>(false);
  const [dossierTarget, setDossierTarget] = useState<{
    name: string;
    district: string;
    isFlooded?: boolean;
    depth?: number;
  } | null>(null);

  // DOM & Map References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const overlaysRef = useRef<(google.maps.Polygon | google.maps.Polyline | google.maps.Marker)[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Aggregate all villages across all 21 Terai cities
  const allTeraiVillages = useMemo(() => {
    const list: (VillageTownItem & { cityId: string; cityName: string; district: string })[] = [];
    TERAI_CITIES_DATA.forEach((city) => {
      city.villagesAndTowns.forEach((v) => {
        list.push({
          ...v,
          cityId: city.id,
          cityName: city.name,
          district: city.district,
        });
      });
    });
    return list;
  }, []);

  // Filtered villages according to active basin, district, and hazard filter
  const displayedVillages = useMemo(() => {
    return allTeraiVillages.filter((v) => {
      // Basin / Region Filter
      if (selectedRegionKey !== 'full_terai') {
        const parentCity = TERAI_CITIES_DATA.find((c) => c.id === v.cityId);
        if (!parentCity || parentCity.regionKey !== selectedRegionKey) return false;
      }
      // District Filter
      if (selectedDistrict !== 'all') {
        if (v.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      }
      // Hazard Filter
      if (settlementFilter === 'flooded_only' && !v.isFlooded) return false;
      if (settlementFilter === 'safe_only' && v.isFlooded) return false;
      return true;
    });
  }, [allTeraiVillages, selectedRegionKey, selectedDistrict, settlementFilter]);

  // Search Results for Quick-Navigator
  const searchResults = useMemo(() => {
    if (!villageSearchQuery.trim()) return [];
    const query = villageSearchQuery.toLowerCase();
    return allTeraiVillages
      .filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.cityName.toLowerCase().includes(query) ||
          v.district.toLowerCase().includes(query) ||
          (v.localName && v.localName.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [allTeraiVillages, villageSearchQuery]);

  // Helper to fit bounds strictly to active Terai region
  const fitToActiveRegion = (map: google.maps.Map, regionKey: string) => {
    if (!window.google) return;
    const bounds = new google.maps.LatLngBounds();

    let coords: [number, number][] = nepalBoundaries.terai_full;
    if (regionKey === 'eastern_terai') coords = nepalBoundaries.terai_eastern;
    else if (regionKey === 'central_terai') coords = nepalBoundaries.terai_central;
    else if (regionKey === 'western_terai') coords = nepalBoundaries.terai_western;
    else if (regionKey === 'far_western_terai') coords = nepalBoundaries.terai_far_western;

    coords.forEach(([lat, lng]) => {
      bounds.extend({ lat, lng });
    });

    map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
  };

  // Handle Region Selection
  const handleRegionSelect = (regionKey: string) => {
    setSelectedRegionKey(regionKey);
    setSelectedDistrict('all');
    if (onRegionChange) onRegionChange(regionKey);

    if (googleMapInstanceRef.current && window.google) {
      fitToActiveRegion(googleMapInstanceRef.current, regionKey);
    }
    if (leafletMapInstanceRef.current) {
      const reg = TERAI_REGIONS[regionKey] || TERAI_REGIONS.full_terai;
      leafletMapInstanceRef.current.flyTo(reg.center, reg.zoom);
    }
  };

  // Handle District Direct Pan
  const handleDistrictSelect = (districtName: string) => {
    setSelectedDistrict(districtName);
    if (districtName === 'all') {
      handleRegionSelect('full_terai');
      return;
    }

    const matchCity = TERAI_CITIES_DATA.find(
      (c) => c.district.toLowerCase() === districtName.toLowerCase()
    );
    if (matchCity) {
      setSelectedRegionKey(matchCity.regionKey);
    }
    const coords = matchCity ? matchCity.coords : null;

    if (coords) {
      if (googleMapInstanceRef.current && window.google) {
        googleMapInstanceRef.current.panTo({ lat: coords[0], lng: coords[1] });
        googleMapInstanceRef.current.setZoom(11);
      }
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.flyTo(coords, 11);
      }
    }
    setMapRenderTrigger((prev) => prev + 1);
  };

  // ─── PROP SYNCHRONIZATION WITH PARENT DASHBOARD BUTTONS ─────────────────────
  // 1. Sync incoming region from corridor / basin buttons
  useEffect(() => {
    if (propSelectedRegionKey && propSelectedRegionKey !== selectedRegionKey) {
      setSelectedRegionKey(propSelectedRegionKey);
      setSelectedDistrict('all');
      if (googleMapInstanceRef.current && window.google) {
        fitToActiveRegion(googleMapInstanceRef.current, propSelectedRegionKey);
      }
      if (leafletMapInstanceRef.current) {
        const reg = TERAI_REGIONS[propSelectedRegionKey] || TERAI_REGIONS.full_terai;
        leafletMapInstanceRef.current.flyTo(reg.center, reg.zoom);
      }
      setMapRenderTrigger((prev) => prev + 1);
    }
  }, [propSelectedRegionKey]);

  // 2. Sync incoming district selection from dropdown
  useEffect(() => {
    if (propSelectedDistrict && propSelectedDistrict !== selectedDistrict) {
      setSelectedDistrict(propSelectedDistrict);
      if (propSelectedDistrict !== 'all') {
        const matchCity = TERAI_CITIES_DATA.find(
          (c) => c.district.toLowerCase() === propSelectedDistrict.toLowerCase()
        );
        const coords = matchCity ? matchCity.coords : null;
        if (coords) {
          if (googleMapInstanceRef.current && window.google) {
            googleMapInstanceRef.current.panTo({ lat: coords[0], lng: coords[1] });
            googleMapInstanceRef.current.setZoom(11);
          }
          if (leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.flyTo(coords, 11);
          }
        }
      } else {
        if (googleMapInstanceRef.current && window.google) {
          fitToActiveRegion(googleMapInstanceRef.current, selectedRegionKey);
        }
        if (leafletMapInstanceRef.current) {
          const reg = TERAI_REGIONS[selectedRegionKey] || TERAI_REGIONS.full_terai;
          leafletMapInstanceRef.current.flyTo(reg.center, reg.zoom);
        }
      }
      setMapRenderTrigger((prev) => prev + 1);
    }
  }, [propSelectedDistrict]);

  // 3. Sync incoming layer visibility mode buttons ('both' | 'flooded' | 'safe')
  useEffect(() => {
    if (propViewLayerMode) {
      if (propViewLayerMode === 'flooded') {
        setShowFloodPolygons(true);
        setShowVillagePins(true);
        setSettlementFilter('flooded_only');
        setShowSafeZones(false);
        setShowHospitals(false);
      } else if (propViewLayerMode === 'safe') {
        setShowFloodPolygons(false);
        setShowVillagePins(true);
        setSettlementFilter('safe_only');
        setShowSafeZones(true);
        setShowHospitals(true);
      } else {
        setShowFloodPolygons(true);
        setShowVillagePins(true);
        setSettlementFilter('all');
        setShowSafeZones(true);
        setShowHospitals(true);
      }
      setMapRenderTrigger((prev) => prev + 1);
    }
  }, [propViewLayerMode]);

  // 4. Sync incoming date observation presets or custom dates
  useEffect(() => {
    if (propBeforeDate || propAfterDate || propSelectedDatePreset) {
      setMapRenderTrigger((prev) => prev + 1);
    }
  }, [propBeforeDate, propAfterDate, propSelectedDatePreset]);

  // Pinpoint Village on Map (Works in both Google Maps and Leaflet engines)
  const pinpointVillageOnMap = (village: VillageTownItem) => {
    setFocusedVillage(village);
    setIsSearchOpen(false);
    setVillageSearchQuery('');

    if (provider === 'google_maps' && googleMapInstanceRef.current && window.google) {
      googleMapInstanceRef.current.panTo({ lat: village.coords[0], lng: village.coords[1] });
      googleMapInstanceRef.current.setZoom(13);

      const info = new google.maps.InfoWindow({
        content: `
          <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 250px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 2px 6px;
                border-radius: 4px;
                background: ${village.isFlooded ? '#FEE2E2' : '#DCFCE7'};
                color: ${village.isFlooded ? '#991B1B' : '#166534'};
              ">
                ${village.isFlooded ? 'SUBMERGED VILLAGE' : 'SAFE HIGH-GROUND'}
              </span>
              ${
                village.floodDepthMeters
                  ? `<span style="font-size: 9px; font-weight: 800; color: #DC2626; background: #FEE2E2; padding: 2px 4px; border-radius: 4px;">Depth: ${village.floodDepthMeters}m</span>`
                  : ''
              }
            </div>
            <h4 style="margin: 2px 0 4px 0; font-size: 13px; font-weight: bold;">${village.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #334155; line-height: 1.4;">
              <strong>Population:</strong> ${village.population.toLocaleString()}<br/>
              <strong>Action:</strong> ${village.recommendedAction}<br/>
              ${village.nearestShelter ? `<strong>Shelter:</strong> ${village.nearestShelter}` : ''}
            </p>
          </div>
        `,
        position: { lat: village.coords[0], lng: village.coords[1] },
      });
      info.open(googleMapInstanceRef.current);
      activeInfoWindowRef.current = info;
    }

    if (provider === 'leaflet' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.flyTo(village.coords, 13);
    }
  };

  // Handle Route Selection & Focus
  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    if (routeId === 'none') return;

    const r = EMERGENCY_ROUTES.find((item) => item.id === routeId);
    if (!r) return;

    if (provider === 'google_maps' && googleMapInstanceRef.current && window.google) {
      const bounds = new google.maps.LatLngBounds();
      r.path.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      googleMapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }

    if (provider === 'leaflet' && leafletMapInstanceRef.current) {
      const bounds = L.latLngBounds(r.path);
      leafletMapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Create Google Map Instance
  const initGoogleMap = (MapConstructor: typeof google.maps.Map) => {
    if (!mapContainerRef.current) return;

    const map = new MapConstructor(mapContainerRef.current, {
      center: { lat: 26.85, lng: 85.30 },
      zoom: 8,
      minZoom: 7.2,
      maxZoom: 18,
      restriction: {
        latLngBounds: NEPAL_TERAI_BOUNDS,
        strictBounds: false,
      },
      mapTypeId: mapTypeId as google.maps.MapTypeId,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }],
        },
      ],
    });

    googleMapInstanceRef.current = map;
    fitToActiveRegion(map, selectedRegionKey);
    setMapRenderTrigger((prev) => prev + 1);

    setTimeout(() => {
      if (googleMapInstanceRef.current && window.google) {
        google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
        fitToActiveRegion(googleMapInstanceRef.current, selectedRegionKey);
        setMapRenderTrigger((prev) => prev + 1);
      }
    }, 150);

    setIsLoadingGoogle(false);
  };

  // Initialize Google Maps JavaScript API via Loader
  useEffect(() => {
    if (provider !== 'google_maps' || !apiKey || isKeyPlaceholder(apiKey)) {
      if (provider === 'google_maps') {
        setGoogleLoadError('Google Maps API key is unconfigured. Defaulted to high-speed Leaflet satellite engine.');
        handleSetProvider('leaflet');
      }
      setIsLoadingGoogle(false);
      return;
    }

    let isMounted = true;
    setIsLoadingGoogle(true);
    setGoogleLoadError(null);

    // Listen for Google Maps API authentication failures (invalid key, unbilled project, etc.)
    const prevAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      console.warn('Google Maps API auth failure detected. Auto-failing over to Leaflet satellite engine.');
      setGoogleLoadError('Google Maps API authentication failed with provided key. Automatically switched to Leaflet satellite engine.');
      handleSetProvider('leaflet');
      setIsLoadingGoogle(false);
    };

    // If Google Maps is already present on window
    if (window.google?.maps?.Map) {
      initGoogleMap(window.google.maps.Map);
      return;
    }

    if (!googleMapsOptionsConfigured) {
      try {
        setOptions({
          key: apiKey.trim(),
          v: 'weekly',
          libraries: ['places', 'geometry'],
        });
        googleMapsOptionsConfigured = true;
      } catch {
        // Ignore if options already configured in current browser session
      }
    }

    importLibrary('maps')
      .then((mapsLib) => {
        if (!isMounted) return;
        initGoogleMap(mapsLib.Map);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        console.warn('Google Maps JS API load failed, switching to Leaflet fallback:', err);
        setGoogleLoadError(err.message || 'Google Maps failed to authenticate with provided API key.');
        handleSetProvider('leaflet');
        setIsLoadingGoogle(false);
      });

    return () => {
      isMounted = false;
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = prevAuthFailure;
      overlaysRef.current.forEach((item) => {
        if ('setMap' in item) item.setMap(null);
      });
      overlaysRef.current = [];
    };
  }, [provider, apiKey]);

  // Sync Map Type Changes
  useEffect(() => {
    if (googleMapInstanceRef.current && window.google) {
      googleMapInstanceRef.current.setMapTypeId(mapTypeId as google.maps.MapTypeId);
    }
  }, [mapTypeId]);

  // Sync Live Highway Traffic Layer
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(googleMapInstanceRef.current);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [showTraffic]);

  // Synchronize Google Maps Vector Overlays (Corridors, Hubs, Villages, Routes)
  useEffect(() => {
    const map = googleMapInstanceRef.current;
    if (!map || !window.google) return;

    // Clear existing overlays
    overlaysRef.current.forEach((item) => {
      if ('setMap' in item) item.setMap(null);
    });
    overlaysRef.current = [];

    // 1. Draw Sovereign Nepal Border & Solid Country Highlight
    if (showNepalBorder) {
      const borderPath = nepalBoundaries.nepal_border.map(([lat, lng]) => ({ lat, lng }));

      // Vivid sovereign territory boundary & luminous country fill
      const nepalPolygon = new google.maps.Polygon({
        paths: borderPath,
        strokeColor: '#F59E0B',
        strokeOpacity: 0.95,
        strokeWeight: 3.5,
        fillColor: '#F59E0B',
        fillOpacity: 0.08,
        map,
        clickable: false,
        zIndex: 1,
      });
      overlaysRef.current.push(nepalPolygon);

      // Outer gold glowing contour line for ultra-crisp visibility on dark satellite
      const nepalOuterContour = new google.maps.Polyline({
        path: borderPath,
        strokeColor: '#FEF3C7',
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        map,
        clickable: false,
        zIndex: 2,
      });
      overlaysRef.current.push(nepalOuterContour);

      // Sovereign Emblem Marker at Central Nepal
      const nepalEmblemMarker = new google.maps.Marker({
        position: { lat: 28.3949, lng: 84.1240 },
        map,
        title: 'Sovereign Territory of Nepal',
        icon: {
          url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="34" viewBox="0 0 160 34"><rect width="160" height="34" rx="8" fill="%230F172A" stroke="%23F59E0B" stroke-width="2"/><text x="12" y="21" font-family="system-ui,sans-serif" font-size="11" font-weight="900" fill="%23F59E0B">🇳🇵 NEPAL SOVEREIGN</text></svg>`,
          anchor: new google.maps.Point(80, 17),
        },
        zIndex: 3,
      });
      overlaysRef.current.push(nepalEmblemMarker);
    }

    // 2. Draw Nepal Terai Lowland Plain Highlight Polygon
    if (showTeraiBoundary) {
      const fullTeraiPath = nepalBoundaries.terai_full.map(([lat, lng]) => ({ lat, lng }));
      const teraiBasePoly = new google.maps.Polygon({
        paths: fullTeraiPath,
        strokeColor: '#10B981',
        strokeOpacity: 0.95,
        strokeWeight: 3.0,
        fillColor: '#10B981',
        fillOpacity: 0.18,
        map,
        zIndex: 4,
      });

      teraiBasePoly.addListener('click', (e: google.maps.PolyMouseEvent) => {
        const info = new google.maps.InfoWindow({
          content: `
            <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 260px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <span style="font-size:9px; font-weight:800; background:#DCFCE7; color:#166534; padding:2px 6px; border-radius:4px;">
                  TERAI LOWLAND BASIN
                </span>
                <span style="font-size:10px; font-weight:bold; color:#059669;">21 Districts</span>
              </div>
              <h4 style="margin:2px 0; font-size:12px; font-weight:bold;">Nepal Terai Flood Plain</h4>
              <p style="margin:0; font-size:11px; color:#475569; line-height:1.4;">
                Southern fertile lowlands vulnerable to transboundary monsoon deluge. Monitored by FloodGuard AI.
              </p>
            </div>
          `,
          position: e.latLng,
        });
        info.open(map);
        activeInfoWindowRef.current = info;
      });

      overlaysRef.current.push(teraiBasePoly);

      // Active sub-basin highlight if a specific corridor is chosen
      if (selectedRegionKey !== 'full_terai') {
        let activeCoords: [number, number][] = [];
        if (selectedRegionKey === 'eastern_terai') activeCoords = nepalBoundaries.terai_eastern;
        else if (selectedRegionKey === 'central_terai') activeCoords = nepalBoundaries.terai_central;
        else if (selectedRegionKey === 'western_terai') activeCoords = nepalBoundaries.terai_western;
        else if (selectedRegionKey === 'far_western_terai') activeCoords = nepalBoundaries.terai_far_western;

        if (activeCoords.length > 0) {
          const activeBasinPath = activeCoords.map(([lat, lng]) => ({ lat, lng }));
          const activeBasinPoly = new google.maps.Polygon({
            paths: activeBasinPath,
            strokeColor: '#00F2FE',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            fillColor: '#06B6D4',
            fillOpacity: 0.28,
            map,
            zIndex: 5,
          });
          overlaysRef.current.push(activeBasinPoly);
        }
      }
    }

    // 3. Draw High-Resolution Sentinel-1 SAR Flood Corridors (Filled Deluge Extent)
    if (showFloodPolygons) {
      TERAI_FLOOD_CORRIDORS.forEach((corridor) => {
        if (selectedRegionKey !== 'full_terai') {
          const hasCommonDistrict = corridor.districts.some((d) =>
            activeRegion.districts.includes(d)
          );
          if (!hasCommonDistrict) return;
        }
        if (selectedDistrict !== 'all') {
          const matches = corridor.districts.some(
            (d) => d.toLowerCase() === selectedDistrict.toLowerCase()
          );
          if (!matches) return;
        }

        const floodPath = corridor.polygon.map(([lat, lng]) => ({ lat, lng }));
        const isCritical = corridor.severity === 'critical';
        const strokeCol = isCritical ? '#00F2FE' : '#38BDF8';
        const fillCol = isCritical ? '#0284C7' : '#0369A1';

        const floodPolygon = new google.maps.Polygon({
          paths: floodPath,
          strokeColor: strokeCol,
          strokeOpacity: highlightFloodedDotted ? 0 : 0.85,
          strokeWeight: highlightFloodedDotted ? 0 : 2.5,
          fillColor: fillCol,
          fillOpacity: 0.35,
          map,
          zIndex: 4,
        });

        floodPolygon.addListener('click', (e: google.maps.PolyMouseEvent) => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 270px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: ${isCritical ? '#FEE2E2' : '#FEF3C7'};
                    color: ${isCritical ? '#991B1B' : '#92400E'};
                  ">
                    ${corridor.severity.toUpperCase()} INUNDATION CORRIDOR
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: #0284C7;">
                    ${corridor.inundatedAreaKm2} km²
                  </span>
                </div>
                <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${corridor.name}</h4>
                <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748B;">${corridor.nepaliName}</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  <strong>Water Depth:</strong> <span style="color: #DC2626; font-weight: bold;">${corridor.waterDepthRange}</span><br/>
                  <strong>Districts:</strong> ${corridor.districts.join(', ')}<br/>
                  <strong>Key Submerged Cities:</strong> ${corridor.keySubmergedCities.join(', ')}
                </div>
              </div>
            `,
            position: e.latLng,
          });
          info.open(map);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(floodPolygon);
      });
    }

    // 3a. Draw High-Visibility Dotted Flood Lines (Perimeter Dotted Contour)
    if (highlightFloodedDotted) {
      TERAI_FLOOD_CORRIDORS.forEach((corridor) => {
        if (selectedRegionKey !== 'full_terai') {
          const hasCommonDistrict = corridor.districts.some((d) =>
            activeRegion.districts.includes(d)
          );
          if (!hasCommonDistrict) return;
        }
        if (selectedDistrict !== 'all') {
          const matches = corridor.districts.some(
            (d) => d.toLowerCase() === selectedDistrict.toLowerCase()
          );
          if (!matches) return;
        }

        const floodPath = corridor.polygon.map(([lat, lng]) => ({ lat, lng }));
        const isCritical = corridor.severity === 'critical';
        const strokeCol = isCritical ? '#00F2FE' : '#38BDF8';

        const dottedSymbol = {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          strokeColor: strokeCol,
          strokeWeight: 2.8,
          scale: 3,
        };

        const floodDottedLine = new google.maps.Polyline({
          path: floodPath,
          strokeColor: strokeCol,
          strokeOpacity: 0,
          icons: [
            {
              icon: dottedSymbol,
              offset: '0',
              repeat: '12px',
            },
          ],
          map,
          zIndex: 5,
        });

        floodDottedLine.addListener('mouseover', () => {
          floodDottedLine.setOptions({
            icons: [
              {
                icon: {
                  ...dottedSymbol,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3.5,
                  scale: 3.5,
                },
                offset: '0',
                repeat: '12px',
              },
            ],
          });
        });

        floodDottedLine.addListener('mouseout', () => {
          floodDottedLine.setOptions({
            icons: [
              {
                icon: dottedSymbol,
                offset: '0',
                repeat: '12px',
              },
            ],
          });
        });

        floodDottedLine.addListener('click', (e: google.maps.PolyMouseEvent) => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 270px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: ${isCritical ? '#FEE2E2' : '#FEF3C7'};
                    color: ${isCritical ? '#991B1B' : '#92400E'};
                  ">
                    ${corridor.severity.toUpperCase()} INUNDATION (DOTTED BOUNDARY)
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: #0284C7;">
                    ${corridor.inundatedAreaKm2} km²
                  </span>
                </div>
                <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${corridor.name}</h4>
                <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748B;">${corridor.nepaliName}</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  <strong>Water Depth:</strong> <span style="color: #DC2626; font-weight: bold;">${corridor.waterDepthRange}</span><br/>
                  <strong>Districts:</strong> ${corridor.districts.join(', ')}<br/>
                  <strong>Key Submerged Cities:</strong> ${corridor.keySubmergedCities.join(', ')}
                </div>
              </div>
            `,
            position: e.latLng,
          });
          info.open(map);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(floodDottedLine);
      });
    }

    // 3b. Draw Nepal River Basins (Dotted Boundaries)
    if (showDottedBasins) {
      NEPAL_RIVER_BASINS.forEach((basin) => {
        const basinPath = basin.boundaryPolygon.map(([lat, lng]) => ({ lat, lng }));
        const basinPoly = new google.maps.Polygon({
          paths: basinPath,
          strokeColor: basin.color,
          strokeOpacity: 0,
          fillColor: basin.color,
          fillOpacity: 0.04,
          map,
        });

        const basinDottedBorder = new google.maps.Polyline({
          path: basinPath,
          strokeColor: basin.color,
          strokeOpacity: 0,
          icons: [
            {
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                strokeColor: basin.color,
                strokeWeight: 2,
                scale: 2.5,
              },
              offset: '0',
              repeat: '10px',
            },
          ],
          map,
        });

        basinDottedBorder.addListener('click', (e: google.maps.PolyMouseEvent) => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 260px;">
                <span style="font-size: 9px; font-weight: 800; background: #E0F2FE; color: #0369A1; padding: 2px 6px; border-radius: 4px;">
                  RIVER BASIN WATERSHED
                </span>
                <h4 style="margin: 4px 0 2px 0; font-size: 13px; font-weight: bold;">${basin.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748B;">${basin.nepaliName}</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  <strong>Catchment Area:</strong> ${basin.catchmentAreaKm2.toLocaleString()} km²<br/>
                  <strong>Risk Level:</strong> <span style="font-weight: bold; color: ${basin.color};">${basin.riskLevel.toUpperCase()}</span><br/>
                  <strong>Key Rivers:</strong> ${basin.keyRivers.join(', ')}
                </div>
              </div>
            `,
            position: e.latLng,
          });
          info.open(map);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(basinPoly, basinDottedBorder);
      });
    }

    // 3c. Draw Nepal Rivers (Dotted Lines with Live Telemetry Tap)
    if (showDottedRivers) {
      NEPAL_RIVERS.forEach((river) => {
        const riverPath = river.coordinates.map(([lat, lng]) => ({ lat, lng }));
        const riverCol = getRiverStatusColor(river.status);

        // Continuous luminous water glow underlay
        const riverGlowLine = new google.maps.Polyline({
          path: riverPath,
          strokeColor: riverCol,
          strokeOpacity: 0.45,
          strokeWeight: 4.5,
          map,
          zIndex: 48,
        });

        // Invisible wider stroke for easy click hit-testing
        const hitTargetLine = new google.maps.Polyline({
          path: riverPath,
          strokeColor: '#000000',
          strokeOpacity: 0.001,
          strokeWeight: 16,
          map,
          zIndex: 49,
        });

        const riverDottedLine = new google.maps.Polyline({
          path: riverPath,
          strokeColor: riverCol,
          strokeOpacity: 0,
          icons: [
            {
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                strokeColor: riverCol,
                strokeWeight: 3.5,
                scale: 3,
              },
              offset: '0',
              repeat: '10px',
            },
          ],
          map,
          zIndex: 50,
        });

        const openRiverModal = () => {
          setSelectedRiver(river);
          setIsRiverModalOpen(true);
        };

        hitTargetLine.addListener('click', openRiverModal);
        riverGlowLine.addListener('click', openRiverModal);
        riverDottedLine.addListener('click', openRiverModal);

        overlaysRef.current.push(riverGlowLine, hitTargetLine, riverDottedLine);
      });
    }

    // 4. Draw All 21 Terai Cities with Color Points (Points 3, 5 & 6)
    if (showCityPoints) {
      TERAI_CITIES_DATA.forEach((city) => {
        if (selectedRegionKey !== 'full_terai' && city.regionKey !== selectedRegionKey) {
          return;
        }
        if (selectedDistrict !== 'all' && city.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return;
        }

        const labelText = city.name.split(' / ')[0];
        const badgeWidth = Math.max(76, labelText.length * 8 + 28);
        const cityMarker = new google.maps.Marker({
          position: { lat: city.coords[0], lng: city.coords[1] },
          map,
          title: `📍 ${city.name} (${city.district}) - ${city.nepaliName}`,
          icon: {
            url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${badgeWidth}" height="28" viewBox="0 0 ${badgeWidth} 28"><rect width="${badgeWidth}" height="28" rx="14" fill="%230F172A" stroke="${encodeURIComponent(city.color)}" stroke-width="2.5"/><circle cx="14" cy="14" r="5" fill="${encodeURIComponent(city.color)}"/><text x="25" y="18" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="900" fill="%23FFFFFF">${labelText}</text></svg>`,
            scaledSize: new google.maps.Size(badgeWidth, 28),
            anchor: new google.maps.Point(14, 14),
          },
          zIndex: 45,
        });

        cityMarker.addListener('click', () => {
          setSelectedCity(city);
          setIsCityModalOpen(true);
        });

        overlaysRef.current.push(cityMarker);
      });
    }

    // 5. Draw Constituent Village Markers (Points 3 & 6)
    if (showVillagePins) {
      displayedVillages.forEach((v) => {
        const marker = new google.maps.Marker({
          position: { lat: v.coords[0], lng: v.coords[1] },
          map,
          title: `${v.name} (${v.district})`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: v.isFlooded ? '#EF4444' : '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: v.isFlooded ? 7 : 5,
          },
        });

        marker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 250px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: ${v.isFlooded ? '#FEE2E2' : '#DCFCE7'};
                    color: ${v.isFlooded ? '#991B1B' : '#166534'};
                  ">
                    ${v.isFlooded ? 'CRITICAL: FLOODED VILLAGE' : 'SAFE HIGH-GROUND'}
                  </span>
                  ${
                    v.floodDepthMeters
                      ? `<span style="font-size: 9px; font-weight: 800; color: #DC2626; background: #FEE2E2; padding: 2px 4px; border-radius: 4px;">Depth: ${v.floodDepthMeters}m</span>`
                      : ''
                  }
                </div>
                <h4 style="margin: 4px 0 2px 0; font-size: 13px; font-weight: bold;">${v.name}</h4>
                <p style="margin: 0; font-size: 11px; color: #334155; line-height: 1.4;">
                  <strong>Hub:</strong> ${v.cityName} (${v.district})<br/>
                  <strong>Population:</strong> ${v.population.toLocaleString()}<br/>
                  <strong>Status:</strong> ${v.hazardLevel.toUpperCase()}<br/>
                  <strong>Action:</strong> <span style="color: #2563EB;">${v.recommendedAction}</span><br/>
                  ${v.nearestShelter ? `<strong>Shelter:</strong> ${v.nearestShelter}` : ''}
                </p>
              </div>
            `,
          });
          info.open(map, marker);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(marker);
      });
    }

    // 6. Draw Emergency Relief & Alternate Routes on Google Maps (Points 7 & 9)
    if (activeRoute) {
      const routePath = activeRoute.path.map(([lat, lng]) => ({ lat, lng }));

      // Glowing Route Polyline
      const routePolyline = new google.maps.Polyline({
        path: routePath,
        strokeColor: activeRoute.color,
        strokeOpacity: 0.95,
        strokeWeight: 6,
        map,
      });
      overlaysRef.current.push(routePolyline);

      // Checkpoint Markers
      activeRoute.checkpoints.forEach((cp, idx) => {
        const isStaging = cp.status === 'staging_post';
        const cpMarker = new google.maps.Marker({
          position: { lat: cp.coords[0], lng: cp.coords[1] },
          map,
          title: `Checkpoint ${idx + 1}: ${cp.name}`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: isStaging ? '#3B82F6' : '#F59E0B',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        cpMarker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 240px;">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #DBEAFE; color: #1E40AF;">
                  ROUTE CHECKPOINT #${idx + 1}
                </span>
                <h4 style="margin: 4px 0 2px 0; font-size: 12px; font-weight: bold;">${cp.name}</h4>
                <p style="margin: 0; font-size: 11px; color: #475569;">${cp.note}</p>
              </div>
            `,
          });
          info.open(map, cpMarker);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(cpMarker);
      });
    }

    // 7. Draw Terai Highway & Road Inundation Segments (Stage 5.4)
    if (showRoadNetwork) {
      TERAI_ROAD_SEGMENTS.forEach((seg) => {
        if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(seg.district)) {
          return;
        }
        if (selectedDistrict !== 'all' && seg.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return;
        }

        const isSubmerged = seg.status === 'submerged';
        const isRestricted = seg.status === 'restricted';
        const color = isSubmerged ? '#EF4444' : isRestricted ? '#F59E0B' : '#10B981';
        const weight = isSubmerged ? 5 : isRestricted ? 4 : 3;
        const opacity = isSubmerged ? 0.95 : isRestricted ? 0.9 : 0.75;

        const poly = new google.maps.Polyline({
          path: seg.path.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: color,
          strokeOpacity: opacity,
          strokeWeight: weight,
          map,
        });

        poly.addListener('click', (e: google.maps.PolyMouseEvent) => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 270px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: ${isSubmerged ? '#FEE2E2' : isRestricted ? '#FEF3C7' : '#DCFCE7'};
                    color: ${isSubmerged ? '#991B1B' : isRestricted ? '#92400E' : '#166534'};
                  ">
                    ${seg.status.toUpperCase()}
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: #2563EB;">${seg.highwayCode}</span>
                </div>
                <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">${seg.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748B;">${seg.district} &bull; ${seg.corridor}</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  ${seg.maxWaterDepthMeters > 0 ? `<strong>Water Depth:</strong> <span style="color: #DC2626; font-weight: bold;">${seg.maxWaterDepthMeters}m</span><br/>` : ''}
                  ${seg.submergedLengthKm > 0 ? `<strong>Submerged Length:</strong> ${seg.submergedLengthKm} km<br/>` : ''}
                  <strong>Advisory:</strong> ${seg.clearanceAdvice}<br/>
                  ${seg.bypassRecommendation ? `<strong style="color: #D97706;">Bypass:</strong> ${seg.bypassRecommendation}` : ''}
                </div>
              </div>
            `,
            position: e.latLng,
          });
          info.open(map);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(poly);
      });
    }

    // 8. Draw Terai Critical Bridges & Barrages (Stage 5.4)
    if (showBridges) {
      TERAI_BRIDGES.forEach((bridge) => {
        if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(bridge.district)) {
          return;
        }
        if (selectedDistrict !== 'all' && bridge.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return;
        }

        const isCrit = bridge.status === 'critical_danger';
        const isWarn = bridge.status === 'high_warning';
        const color = isCrit ? '#EF4444' : isWarn ? '#F59E0B' : '#06B6D4';

        const marker = new google.maps.Marker({
          position: { lat: bridge.coords[0], lng: bridge.coords[1] },
          map,
          title: `🌉 ${bridge.name} (${bridge.river} River, ${bridge.district}) - ${bridge.status.replace(/_/g, ' ').toUpperCase()}`,
          icon: {
            url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect width="30" height="30" rx="8" fill="%230F172A" stroke="${encodeURIComponent(color)}" stroke-width="2.5"/><text x="15" y="20.5" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">🌉</text></svg>`,
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
          },
          zIndex: 38,
        });

        marker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 270px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: ${isCrit ? '#FEE2E2' : isWarn ? '#FEF3C7' : '#E0F2FE'};
                    color: ${isCrit ? '#991B1B' : isWarn ? '#92400E' : '#0369A1'};
                  ">
                    ${bridge.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  ${bridge.dischargeCusecs ? `<span style="font-size: 10px; font-weight: 800; color: #DC2626;">${bridge.dischargeCusecs.toLocaleString()} cusecs</span>` : ''}
                </div>
                <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">${bridge.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748B;">River: ${bridge.river} &bull; ${bridge.district} District</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  ${bridge.waterLevelMeters ? `<strong>Water Level:</strong> ${bridge.waterLevelMeters}m (Danger: ${bridge.dangerLevelMeters}m)<br/>` : ''}
                  <strong>Structure:</strong> ${bridge.structuralStatus}<br/>
                  <strong>Traffic:</strong> <span style="font-weight: bold; color: ${isCrit ? '#DC2626' : '#2563EB'};">${bridge.trafficStatus.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
              </div>
            `,
          });
          info.open(map, marker);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(marker);
      });
    }

    // 9. Draw Terai Hospitals & Emergency Medical Infrastructure
    if (showHospitals) {
      TERAI_HOSPITALS.forEach((hosp) => {
        if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(hosp.district)) {
          return;
        }
        if (selectedDistrict !== 'all' && hosp.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return;
        }

        const isFlooded = hosp.isFlooded;
        const color = isFlooded ? '#DC2626' : '#2563EB';

        const hospMarker = new google.maps.Marker({
          position: { lat: hosp.coords[0], lng: hosp.coords[1] },
          map,
          title: `${hosp.name} (${hosp.district})`,
          icon: {
            url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="${encodeURIComponent(color)}" stroke="%23FFFFFF" stroke-width="2"/><text x="14" y="19" font-family="system-ui,sans-serif" font-size="13" text-anchor="middle">🏥</text></svg>`,
            scaledSize: new google.maps.Size(26, 26),
            anchor: new google.maps.Point(13, 13),
          },
          zIndex: 8,
        });

        hospMarker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 270px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: ${isFlooded ? '#FEE2E2' : '#DBEAFE'};
                    color: ${isFlooded ? '#991B1B' : '#1E40AF'};
                  ">
                    ${hosp.status.toUpperCase()}
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: #2563EB;">
                    ${hosp.beds} Beds
                  </span>
                </div>
                <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">${hosp.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748B;">${hosp.type} &bull; ${hosp.district} District</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  <strong>Condition:</strong> ${hosp.isFlooded ? '<span style="color:#DC2626;font-weight:bold;">Submerged / Inundated</span>' : '<span style="color:#16A34A;font-weight:bold;">Operational</span>'}<br/>
                  ${hosp.nearestSafeHaven ? `<strong>Nearest Safe Refuge:</strong> ${hosp.nearestSafeHaven}<br/>` : ''}
                  <strong>Emergency Hotline:</strong> <a href="tel:${hosp.phone}" style="color: #2563EB; font-weight: bold;">${hosp.phone}</a>
                </div>
              </div>
            `,
          });
          info.open(map, hospMarker);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(hospMarker);
      });
    }

    // 10. Draw Terai Safe Havens & Refugee Relief Shelters (Stage 5.7)
    if (showSafeZones) {
      TERAI_SAFE_HAVENS.forEach((haven) => {
        if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(haven.district)) {
          return;
        }
        if (selectedDistrict !== 'all' && haven.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return;
        }

        const havenMarker = new google.maps.Marker({
          position: { lat: haven.coords[0], lng: haven.coords[1] },
          map,
          title: `${haven.name} (${haven.district})`,
          icon: {
            url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="%23059669" stroke="%23FFFFFF" stroke-width="2"/><text x="14" y="19" font-family="system-ui,sans-serif" font-size="13" text-anchor="middle">🛡️</text></svg>`,
            scaledSize: new google.maps.Size(26, 26),
            anchor: new google.maps.Point(13, 13),
          },
          zIndex: 8,
        });

        havenMarker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 6px; max-width: 280px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                  <span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: #DCFCE7;
                    color: #166534;
                  ">
                    SAFE HAVEN &bull; GRADE ${haven.suitabilityGrade}
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: #059669;">
                    +${haven.elevationAboveFloodPlainMeters}m high ground
                  </span>
                </div>
                <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">${haven.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748B;">${haven.nepaliName} &bull; ${haven.district} District</p>
                <div style="font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  <strong>Capacity:</strong> ${haven.currentOccupancy.toLocaleString()} / ${haven.totalCapacity.toLocaleString()} persons<br/>
                  <strong>Structure:</strong> ${haven.structure.replace(/_/g, ' ')}<br/>
                  <strong>Helipad:</strong> ${haven.hasHelipad ? 'Nepal Army Helipad Ready' : 'No Helipad'}<br/>
                  <strong>Warden:</strong> ${haven.wardenName} (${haven.wardenPhone})
                </div>
              </div>
            `,
          });
          info.open(map, havenMarker);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(havenMarker);
      });
    }
  }, [
    selectedRegionKey,
    selectedDistrict,
    showNepalBorder,
    showTeraiBoundary,
    showFloodPolygons,
    showHospitals,
    showSafeZones,
    showCityPoints,
    showVillagePins,
    showRoadNetwork,
    showBridges,
    displayedVillages,
    activeRoute,
    mapRenderTrigger,
    propViewLayerMode,
    propSelectedDatePreset,
    propBeforeDate,
    propAfterDate,
    highlightFloodedDotted,
    showDottedBasins,
    showDottedRivers,
  ]);

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey.trim());
    setIsEditingKey(false);
  };

  return (
    <div className={`space-y-4 relative isolate z-10 ${isFullscreen ? 'fixed inset-0 z-[1000] h-screen w-screen overflow-y-auto bg-slate-950 p-4' : 'h-full flex flex-col'}`}>
      {/* ───────────────────────────────────────────────────────────────────────
          TERAI DISASTER COMMAND HUD & ROUTE DISPATCH CONTROLS
      ───────────────────────────────────────────────────────────────────────── */}
      {!hideHeader && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl space-y-4 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  FLOOD EXTENT &amp; SETTLEMENT OVERLAY
                </span>
                <span className="rounded-md bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/30 font-mono">
                  11 RIVER CORRIDORS &bull; 21 TERAI DISTRICTS
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-400 shrink-0" />
                <span>{activeRegion.name}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Interactive geospatial intelligence displaying real-time flood inundation, settlements, emergency corridors, and safe shelters.
              </p>
            </div>

            {/* Engine, Fullscreen & Provider Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Dual Provider Switcher */}
              <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
                <button
                  onClick={() => handleSetProvider('google_maps')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                    provider === 'google_maps'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  <span>Satellite</span>
                </button>
                <button
                  onClick={() => handleSetProvider('leaflet')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                    provider === 'leaflet'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Vector</span>
                </button>
              </div>

              {/* Re-center strictly to Terai button */}
              <button
                onClick={() => {
                  if (googleMapInstanceRef.current) {
                    fitToActiveRegion(googleMapInstanceRef.current, selectedRegionKey);
                  }
                  if (leafletMapInstanceRef.current) {
                    leafletMapInstanceRef.current.flyTo(activeRegion.center, activeRegion.zoom);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
                title="Reset view to Terai lowlands"
              >
                <Compass className="h-3.5 w-3.5 text-blue-400" />
                <span>Reset Bounds</span>
              </button>

            {/* Fullscreen Map Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>

            {/* API Key Drawer Toggle */}
            <button
              onClick={() => setIsEditingKey(!isEditingKey)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>API Key</span>
            </button>
          </div>
        </div>

        {/* API Key Input Drawer */}
        {isEditingKey && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Key className="h-4 w-4" />
                Google Maps JavaScript API Key:
              </span>
              <span className="text-[11px] text-amber-400/80">Active in local development session</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSaveApiKey}
                className="rounded-lg bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-500 transition-all"
              >
                Apply Key
              </button>
            </div>
          </div>
        )}

        {/* EMERGENCY RELIEF & ALTERNATE ROUTE SELECTOR BAR (Points 7 & 9) */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Route className="h-4 w-4 text-emerald-400" />
              Emergency Logistics &amp; Safe Route Engine:
            </span>
            <span className="text-[11px] text-slate-400">
              Select a safe relief corridor or civilian evacuation egress to highlight on the map.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={() => handleSelectRoute('none')}
              className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all ${
                selectedRouteId === 'none'
                  ? 'border-slate-600 bg-slate-800 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
              }`}
            >
              <div>Standard Patrol (No Route)</div>
              <div className="text-[10px] text-slate-500 font-normal">Show general flood extent</div>
            </button>

            <button
              onClick={() => handleSelectRoute('route_relief_gaur')}
              className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all ${
                selectedRouteId === 'route_relief_gaur'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Bharatpur → Gaur (88 km)</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-normal mt-0.5">Central Terai Relief Convoy</div>
            </button>

            <button
              onClick={() => handleSelectRoute('route_relief_koshi')}
              className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all ${
                selectedRouteId === 'route_relief_koshi'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Duhabi → Koshi (68 km)</span>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-normal mt-0.5">Eastern Terai Medical Lifeline</div>
            </button>

            <button
              onClick={() => handleSelectRoute('route_alt_gaur')}
              className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all ${
                selectedRouteId === 'route_alt_gaur'
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-amber-400" />
                <span>Gaur → Chandranigahapur</span>
              </div>
              <div className="text-[10px] text-amber-400/80 font-normal mt-0.5">Civilian Alternate Evacuation</div>
            </button>
          </div>

          {/* Active Route Directive Callout Banner */}
          {activeRoute && (
            <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="font-black uppercase px-2 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: `${activeRoute.color}25`, color: activeRoute.color }}
                  >
                    {activeRoute.type === 'relief_convoy' ? 'EMERGENCY RELIEF CONVOY' : 'CIVILIAN ALTERNATE EVACUATION'}
                  </span>
                  <span className="font-bold text-white">{activeRoute.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                  <span>{activeRoute.distanceKm} km</span>
                  <span>&bull;</span>
                  <span>Est. {activeRoute.estimatedMinutes} mins</span>
                </div>
              </div>
              <p className="text-slate-300 text-[11px]">{activeRoute.statusDescription}</p>
              <div className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                ⚠️ {activeRoute.hazardWarnings[0]}
              </div>
            </div>
          )}
        </div>

        {/* FAST VILLAGE NAVIGATOR & SETTLEMENT FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Fast Village Search Input */}
          <div className="relative md:col-span-5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={villageSearchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setVillageSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Find any Terai village (e.g. Gaur, Holiya, Kumarkhod, Rajapur)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
              />
              {villageSearchQuery && (
                <button
                  onClick={() => {
                    setVillageSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl">
                {searchResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => pinpointVillageOnMap(v)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-cyan-400">
                          {v.name}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            v.isFlooded ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {v.isFlooded ? `Flooded (${v.floodDepthMeters}m)` : 'Safe'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {v.cityName} &bull; {v.district} District
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settlement Hazard Status Filter Tabs */}
          <div className="flex items-center gap-2 md:col-span-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Filter:
            </span>
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs w-full">
              <button
                onClick={() => setSettlementFilter('all')}
                className={`flex-1 rounded-lg py-1 text-center font-bold transition-all ${
                  settlementFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allTeraiVillages.length})
              </button>
              <button
                onClick={() => setSettlementFilter('flooded_only')}
                className={`flex-1 rounded-lg py-1 text-center font-bold transition-all ${
                  settlementFilter === 'flooded_only'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Flooded ({allTeraiVillages.filter((v) => v.isFlooded).length})
              </button>
              <button
                onClick={() => setSettlementFilter('safe_only')}
                className={`flex-1 rounded-lg py-1 text-center font-bold transition-all ${
                  settlementFilter === 'safe_only'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Safe ({allTeraiVillages.filter((v) => !v.isFlooded).length})
              </button>
            </div>
          </div>

          {/* Inundation Severity Guide Pills */}
          <div className="flex items-center justify-end gap-2 md:col-span-3 text-[11px]">
            <span className="flex items-center gap-1 font-bold text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              &gt;1.5m Deluge
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              0.5-1.5m Spill
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Safe Ground
            </span>
          </div>
        </div>

        {/* Region & Basin Selection Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-blue-400" />
            Select Nepal Terai Flood Zone:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {Object.values(TERAI_REGIONS).map((reg) => {
              const isSelected = reg.id === selectedRegionKey;
              return (
                <button
                  key={reg.id}
                  onClick={() => handleRegionSelect(reg.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/20 text-white shadow-lg ring-1 ring-blue-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{reg.shortName}</span>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{reg.basin}</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-400 mt-1">
                    {reg.floodAreaKm2} km² inundated
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* District Fast-Jump & Basemap Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Jump to Terai District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictSelect(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All 21 Terai Districts (Full Corridor)</option>
              {TERAI_REGIONS.full_terai.districts.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </div>

          {/* Basemap Style Toggles */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Basemap:</span>
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
              {(['hybrid', 'satellite', 'roadmap', 'terrain'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapTypeId(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                    mapTypeId === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Consolidated Layer Controls Popover */}
        <div className="pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                id="btn-feature-layers"
                onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm"
              >
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>Feature Layers</span>
                <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
                  {[showNepalBorder, showTeraiBoundary, showTraffic, highlightFloodedDotted, showDottedBasins, showDottedRivers, showFloodPolygons, showCityPoints, showVillagePins, showHospitals, showSafeZones, showRoadNetwork, showBridges].filter(Boolean).length} Active
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isLayersMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLayersMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-80 rounded-xl border border-slate-700 bg-slate-900/98 p-3 shadow-2xl backdrop-blur-xl z-50 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                      Overlay Layer Toggles
                    </span>
                    <button
                      onClick={() => setIsLayersMenuOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                    >
                      Close &times;
                    </button>
                  </div>

                  {/* Section 1: Boundaries & Live Traffic */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Boundaries &amp; Traffic</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showNepalBorder}
                          onChange={(e) => setShowNepalBorder(e.target.checked)}
                          className="rounded border-amber-600 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Nepal Border</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTeraiBoundary}
                          onChange={(e) => setShowTeraiBoundary(e.target.checked)}
                          className="rounded border-emerald-600 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Terai Belt</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer col-span-2">
                        <input
                          type="checkbox"
                          checked={showTraffic}
                          onChange={(e) => setShowTraffic(e.target.checked)}
                          className="rounded border-amber-600 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                          <Car className="h-3 w-3 text-amber-400" />
                          Live Highway Traffic
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Section 2: Hydrology & Inundation */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Hydrology &amp; Inundation</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={highlightFloodedDotted}
                          onChange={(e) => setHighlightFloodedDotted(e.target.checked)}
                          className="rounded border-cyan-500 bg-slate-950 text-cyan-400 focus:ring-0 cursor-pointer accent-cyan-400"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Flood Extent</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDottedBasins}
                          onChange={(e) => setShowDottedBasins(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Basin Lines</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDottedRivers}
                          onChange={(e) => setShowDottedRivers(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Live Rivers</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showFloodPolygons}
                          onChange={(e) => setShowFloodPolygons(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0 cursor-pointer accent-sky-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">11 Corridors</span>
                      </label>
                    </div>
                  </div>

                  {/* Section 3: Settlements & Lifelines */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Settlements &amp; Lifelines</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCityPoints}
                          onChange={(e) => setShowCityPoints(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">21 Cities</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVillagePins}
                          onChange={(e) => setShowVillagePins(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-rose-600 focus:ring-0 cursor-pointer accent-rose-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Village Pins</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showHospitals}
                          onChange={(e) => setShowHospitals(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-0 cursor-pointer accent-red-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Hospitals</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showSafeZones}
                          onChange={(e) => setShowSafeZones(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Safe Havens</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showRoadNetwork}
                          onChange={(e) => setShowRoadNetwork(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Roads Network</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBridges}
                          onChange={(e) => setShowBridges(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">Critical Bridges</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400">&bull;</span>
              <span>21 Districts &bull; 11 River Basins</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MAIN VIEWPORT: DUAL ENGINE (GOOGLE MAPS V3 OR CRISP LEAFLET)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className={`relative isolate z-10 w-full rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden ${isFullscreen ? 'h-[calc(100vh-280px)] min-h-[500px]' : hideHeader ? 'h-full min-h-[580px] flex-1' : 'h-[680px]'}`}>
        {provider === 'google_maps' ? (
          <>
            <div ref={mapContainerRef} className="h-full w-full" style={{ height: '100%', width: '100%' }} />

            {/* Loading Indicator */}
            {isLoadingGoogle && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-30 space-y-3">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-sm font-bold text-white">Loading Google Maps JavaScript API...</p>
                <p className="text-xs text-slate-400">Locking viewport onto Nepal Terai Lowland belt</p>
              </div>
            )}

            {/* Error Fallback Banner */}
            {googleLoadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-30 p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-lg font-bold text-white">Google Maps JS API Notice</h3>
                  <p className="text-xs text-slate-300">{googleLoadError}</p>
                </div>
                <button
                  onClick={() => handleSetProvider('leaflet')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg cursor-pointer"
                >
                  Switch to Leaflet Fallback
                </button>
              </div>
            )}

            {/* Floating Terai Intelligence Badge */}
            <div className="absolute bottom-5 left-5 z-20 pointer-events-none">
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md text-xs font-bold text-slate-200 space-y-1">
                <div className="flex items-center justify-between gap-3 text-cyan-400">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Nepal Terai Plain &bull; {mapTypeId.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {propViewLayerMode === 'flooded' ? 'Inundation Only' : propViewLayerMode === 'safe' ? 'Safe Shelters Only' : 'Dual View (Flood + Safe)'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300">
                  Basin: <span className="text-white font-bold">{activeRegion.shortName}</span> &bull; Corridors: <span className="text-cyan-300">{TERAI_FLOOD_CORRIDORS.length}</span> &bull; Settlements: <span className="text-emerald-300">{displayedVillages.length}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/80 pt-1 flex items-center gap-2">
                  <span className={showNepalBorder ? 'text-amber-400 font-bold' : 'text-slate-500 line-through'}>
                    Nepal Border: {showNepalBorder ? 'ON' : 'OFF'}
                  </span>
                  <span>&bull;</span>
                  <span className={showTeraiBoundary ? 'text-emerald-400 font-bold' : 'text-slate-500 line-through'}>
                    Terai Lowlands: {showTeraiBoundary ? 'ON' : 'OFF'}
                  </span>
                  <span>&bull;</span>
                  <span className={showFloodPolygons ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}>
                    Flood Corridors: {showFloodPolygons ? 'ON' : 'OFF'}
                  </span>
                  {propAfterDate && (
                    <>
                      <span>&bull;</span>
                      <span className="text-cyan-400 font-semibold">Deluge: {propAfterDate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* High-Performance Dedicated Leaflet Engine for Field Operations */
          <div className="relative h-full w-full" style={{ height: '100%', width: '100%' }}>
            <MapContainer
              center={activeRegion.center}
              zoom={activeRegion.zoom}
              minZoom={7.2}
              maxBounds={LEAFLET_TERAI_BOUNDS}
              scrollWheelZoom={true}
              zoomControl={true}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
            >
              <LeafletViewController
                center={activeRegion.center}
                zoom={activeRegion.zoom}
                onMapReady={(map) => {
                  leafletMapInstanceRef.current = map;
                }}
              />

              {/* Google Basemap Tile Layer via Leaflet */}
              <TileLayer
                url={GOOGLE_TILE_URLS[mapTypeId]}
                attribution="&copy; Google Maps &copy; OpenStreetMap"
                maxZoom={20}
              />

              {/* 1. Sovereign Border & Country Fill (Amber Solid & Gold Tint) */}
              {showNepalBorder && (
                <>
                  <Polygon
                    positions={nepalBoundaries.nepal_border}
                    pathOptions={{
                      color: '#F59E0B',
                      weight: 3.5,
                      opacity: 0.95,
                      fillColor: '#F59E0B',
                      fillOpacity: 0.08,
                    }}
                  />
                  <Marker
                    position={[28.3949, 84.1240]}
                    icon={L.divIcon({
                      className: 'nepal-badge',
                      html: `
                        <div style="
                          background: #0F172A;
                          color: #F59E0B;
                          border: 2px solid #F59E0B;
                          border-radius: 8px;
                          padding: 3px 8px;
                          font-size: 10.5px;
                          font-weight: 900;
                          white-space: nowrap;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.8);
                        ">
                          NEPAL SOVEREIGN
                        </div>
                      `,
                      iconSize: [130, 26],
                      iconAnchor: [65, 13],
                    })}
                  />
                </>
              )}

              {/* 2. Terai Lowland Plains Boundary (Emerald Base + Active Basin Highlight) */}
              {showTeraiBoundary && (
                <>
                  <Polygon
                    positions={nepalBoundaries.terai_full}
                    pathOptions={{
                      color: '#10B981',
                      weight: 3.0,
                      opacity: 0.95,
                      fillColor: '#10B981',
                      fillOpacity: 0.18,
                    }}
                  />
                  {selectedRegionKey !== 'full_terai' && (
                    <Polygon
                      positions={
                        selectedRegionKey === 'eastern_terai'
                          ? nepalBoundaries.terai_eastern
                          : selectedRegionKey === 'central_terai'
                          ? nepalBoundaries.terai_central
                          : selectedRegionKey === 'western_terai'
                          ? nepalBoundaries.terai_western
                          : nepalBoundaries.terai_far_western
                      }
                      pathOptions={{
                        color: '#00F2FE',
                        weight: 4.0,
                        opacity: 1.0,
                        fillColor: '#06B6D4',
                        fillOpacity: 0.28,
                      }}
                    />
                  )}
                </>
              )}

              {/* 3. High-Resolution Sentinel-1 Flood Corridors (Filled Water Polygon Layer) */}
              {showFloodPolygons &&
                TERAI_FLOOD_CORRIDORS.map((corridor) => {
                  if (selectedRegionKey !== 'full_terai') {
                    const hasCommonDistrict = corridor.districts.some((d) =>
                      activeRegion.districts.includes(d)
                    );
                    if (!hasCommonDistrict) return null;
                  }
                  if (selectedDistrict !== 'all') {
                    const matches = corridor.districts.some(
                      (d) => d.toLowerCase() === selectedDistrict.toLowerCase()
                    );
                    if (!matches) return null;
                  }

                  const isCritical = corridor.severity === 'critical';

                  return (
                    <Polygon
                      key={`flood-poly-${corridor.id}`}
                      positions={corridor.polygon}
                      pathOptions={{
                        color: isCritical ? '#00F2FE' : '#38BDF8',
                        weight: highlightFloodedDotted ? 1 : 2.5,
                        fillColor: isCritical ? '#0284C7' : '#0369A1',
                        fillOpacity: 0.35,
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 max-w-[250px]">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {corridor.severity.toUpperCase()} INUNDATION
                            </span>
                            <span className="text-xs font-bold text-cyan-400">
                              {corridor.inundatedAreaKm2} km²
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{corridor.name}</h4>
                          <p className="text-[10px] text-slate-400">{corridor.nepaliName}</p>
                          <div className="text-xs text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                            <p><strong>Water Depth:</strong> <span className="text-rose-400 font-bold">{corridor.waterDepthRange}</span></p>
                            <p><strong>Districts:</strong> {corridor.districts.join(', ')}</p>
                          </div>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                })}

              {/* 3a. Dotted Flood Lines (High-Visibility Dotted Perimeter) */}
              {highlightFloodedDotted &&
                TERAI_FLOOD_CORRIDORS.map((corridor) => {
                  if (selectedRegionKey !== 'full_terai') {
                    const hasCommonDistrict = corridor.districts.some((d) =>
                      activeRegion.districts.includes(d)
                    );
                    if (!hasCommonDistrict) return null;
                  }
                  if (selectedDistrict !== 'all') {
                    const matches = corridor.districts.some(
                      (d) => d.toLowerCase() === selectedDistrict.toLowerCase()
                    );
                    if (!matches) return null;
                  }

                  const isCritical = corridor.severity === 'critical';

                  return (
                    <Polyline
                      key={`flood-dotted-${corridor.id}`}
                      positions={corridor.polygon}
                      pathOptions={{
                        color: isCritical ? '#00F2FE' : '#38BDF8',
                        weight: 3.2,
                        dashArray: '8, 8',
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[250px]">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {corridor.severity.toUpperCase()} INUNDATION LINE
                            </span>
                            <span className="text-xs font-bold text-cyan-400">
                              {corridor.inundatedAreaKm2} km²
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{corridor.name}</h4>
                          <p className="text-[10px] text-slate-400">{corridor.nepaliName}</p>
                          <div className="text-xs text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                            <p><strong>Water Depth:</strong> <span className="text-rose-400 font-bold">{corridor.waterDepthRange}</span></p>
                            <p><strong>Districts:</strong> {corridor.districts.join(', ')}</p>
                          </div>
                        </div>
                      </Popup>
                    </Polyline>
                  );
                })}

              {/* 3b. Nepal River Basins (Dotted Boundaries) */}
              {showDottedBasins &&
                NEPAL_RIVER_BASINS.map((basin) => (
                  <Polygon
                    key={`leaflet-basin-${basin.id}`}
                    positions={basin.boundaryPolygon}
                    pathOptions={{
                      color: basin.color,
                      weight: 2.2,
                      dashArray: '8, 8',
                      fillColor: basin.color,
                      fillOpacity: 0.04,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-slate-900">
                        <h4 className="font-bold text-xs">{basin.name}</h4>
                        <p className="text-[10px] text-slate-600">{basin.nepaliName}</p>
                        <p className="text-[10px] text-cyan-700 font-mono">
                          Catchment: {basin.catchmentAreaKm2.toLocaleString()} km²
                        </p>
                      </div>
                    </Popup>
                  </Polygon>
                ))}

              {/* 3c. Nepal Rivers (Dotted Lines with Live Telemetry Tap) */}
              {showDottedRivers &&
                NEPAL_RIVERS.map((river) => {
                  const riverCol = getRiverStatusColor(river.status);
                  return (
                    <Polyline
                      key={`leaflet-river-${river.id}`}
                      positions={river.coordinates}
                      pathOptions={{
                        color: riverCol,
                        weight: 3.8,
                        dashArray: '8, 8',
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedRiver(river);
                          setIsRiverModalOpen(true);
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 text-slate-900 min-w-[210px]">
                          <div className="flex items-center justify-between border-b pb-1">
                            <h4 className="font-bold text-xs">🌊 {river.name}</h4>
                            <span className="text-[8px] font-bold uppercase px-1 rounded bg-rose-100 text-rose-700">
                              {river.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600">{river.nepaliName}</p>
                          <div className="text-[10px] font-mono text-slate-700">
                            Level: <strong className="text-rose-600">{river.currentLevelMeters}m</strong> | Flow:{' '}
                            <strong className="text-cyan-700">{river.dischargeCusecs.toLocaleString()} cusecs</strong>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRiver(river);
                              setIsRiverModalOpen(true);
                            }}
                            className="w-full mt-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold text-white rounded cursor-pointer transition-all"
                          >
                            ⚡ View Live Telemetry Update
                          </button>
                        </div>
                      </Popup>
                    </Polyline>
                  );
                })}

              {/* 4. Terai City Color Points (User Feature) */}
              {showCityPoints &&
                TERAI_CITIES_DATA.map((city) => {
                  if (selectedRegionKey !== 'full_terai' && city.regionKey !== selectedRegionKey) {
                    return null;
                  }
                  if (selectedDistrict !== 'all' && city.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                    return null;
                  }
                  return (
                    <Marker
                      key={city.id}
                      position={city.coords}
                      icon={createCityColorLeafletPin(city)}
                      eventHandlers={{
                        click: () => {
                          setSelectedCity(city);
                          setIsCityModalOpen(true);
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 max-w-[220px]">
                          <span
                            className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border"
                            style={{
                              backgroundColor: `${city.color}25`,
                              borderColor: `${city.color}60`,
                              color: city.color,
                            }}
                          >
                            {city.status.toUpperCase()} ZONE &bull; {city.district}
                          </span>
                          <h4 className="font-bold text-sm text-white">{city.name}</h4>
                          <p className="text-xs text-slate-300">{city.statusText}</p>
                          <button
                            onClick={() => {
                              setSelectedCity(city);
                              setIsCityModalOpen(true);
                            }}
                            className="w-full mt-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
                          >
                            Inspect Villages &amp; Towns ({city.villagesAndTowns.length})
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* 5. Constituent Village Markers (Point 3) */}
              {showVillagePins &&
                displayedVillages.map((v) => (
                  <Marker
                    key={v.id}
                    position={v.coords}
                    icon={createVillageLeafletIcon(v, focusedVillage?.id === v.id)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              v.isFlooded ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {v.isFlooded ? 'CRITICAL: FLOODED VILLAGE' : 'SAFE HIGH-GROUND'}
                          </span>
                          {v.floodDepthMeters && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">
                              {v.floodDepthMeters}m
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-white mt-1">{v.name}</h4>
                        <div className="text-xs text-slate-300 space-y-0.5">
                          <p><strong>Hub:</strong> {v.cityName} ({v.district})</p>
                          <p><strong>Population:</strong> {v.population.toLocaleString()}</p>
                          <p className="text-[11px] text-blue-300">
                            <strong>Action:</strong> {v.recommendedAction}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setDossierTarget({
                              name: v.name,
                              district: v.district,
                              isFlooded: v.isFlooded,
                              depth: v.floodDepthMeters,
                            })
                          }
                          className="w-full mt-2 rounded-lg bg-blue-600/30 border border-blue-500/40 px-2 py-1 text-[11px] font-bold text-blue-200 hover:bg-blue-600/50 transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Sparkles className="h-3 w-3 text-cyan-300" />
                          <span>Gemini AI Dossier</span>
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {/* 6. Emergency Route Overlay (Points 7 & 9) */}
              {activeRoute && (
                <>
                  <Polyline
                    positions={activeRoute.path}
                    pathOptions={{
                      color: activeRoute.color,
                      weight: 6,
                      opacity: 0.95,
                    }}
                  />
                  {activeRoute.checkpoints.map((cp, idx) => (
                    <Marker
                      key={idx}
                      position={cp.coords}
                      icon={createCheckpointLeafletIcon(cp)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[220px]">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            CHECKPOINT #{idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-0.5">{cp.name}</h4>
                          <p className="text-xs text-slate-300">{cp.note}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}

              {/* 7. Stage 5.4 Road Inundation Segments */}
              {showRoadNetwork &&
                TERAI_ROAD_SEGMENTS.map((seg) => {
                  if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(seg.district)) {
                    return null;
                  }
                  if (selectedDistrict !== 'all' && seg.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                    return null;
                  }
                  const isSubmerged = seg.status === 'submerged';
                  const isRestricted = seg.status === 'restricted';
                  const color = isSubmerged ? '#EF4444' : isRestricted ? '#F59E0B' : '#10B981';
                  const weight = isSubmerged ? 5 : isRestricted ? 4 : 3;
                  return (
                    <Polyline
                      key={seg.id}
                      positions={seg.path}
                      pathOptions={{
                        color,
                        weight,
                        opacity: 0.95,
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[250px]">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isSubmerged
                                  ? 'bg-red-500/20 text-red-400'
                                  : isRestricted
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {seg.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400">
                              {seg.highwayCode}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{seg.name}</h4>
                          <p className="text-[10px] text-slate-400">{seg.district} &bull; {seg.corridor}</p>
                          <div className="text-xs text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                            {seg.maxWaterDepthMeters > 0 && (
                              <p>
                                <strong>Water Depth:</strong>{' '}
                                <span className="text-rose-400 font-bold">{seg.maxWaterDepthMeters}m</span>
                              </p>
                            )}
                            {seg.submergedLengthKm > 0 && (
                              <p><strong>Submerged:</strong> {seg.submergedLengthKm} km</p>
                            )}
                            <p className="text-[11px] text-slate-300"><strong>Advisory:</strong> {seg.clearanceAdvice}</p>
                            {seg.bypassRecommendation && (
                              <p className="text-[11px] text-amber-300"><strong>Detour:</strong> {seg.bypassRecommendation}</p>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Polyline>
                  );
                })}

              {/* 8. Stage 5.4 Critical Bridges & Barrages */}
              {showBridges &&
                TERAI_BRIDGES.map((bridge) => {
                  if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(bridge.district)) {
                    return null;
                  }
                  if (selectedDistrict !== 'all' && bridge.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                    return null;
                  }
                  return (
                    <Marker
                      key={bridge.id}
                      position={bridge.coords}
                      icon={createBridgeLeafletIcon(bridge)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[240px]">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                bridge.status === 'critical_danger'
                                  ? 'bg-red-500/20 text-red-400'
                                  : bridge.status === 'high_warning'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-cyan-500/20 text-cyan-400'
                              }`}
                            >
                              {bridge.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {bridge.dischargeCusecs && (
                              <span className="text-[10px] font-bold text-rose-400">
                                {bridge.dischargeCusecs.toLocaleString()} cusecs
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-white">{bridge.name}</h4>
                          <p className="text-[10px] text-slate-400">River: {bridge.river} &bull; {bridge.district}</p>
                          <div className="text-xs text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                            {bridge.waterLevelMeters && (
                              <p><strong>Level:</strong> {bridge.waterLevelMeters}m (Danger: {bridge.dangerLevelMeters}m)</p>
                            )}
                            <p><strong>Structure:</strong> {bridge.structuralStatus}</p>
                            <p><strong>Traffic:</strong> <span className="font-bold text-amber-300">{bridge.trafficStatus.replace(/_/g, ' ').toUpperCase()}</span></p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* 9. Terai Referral Hospitals & Healthcare Facilities */}
              {showHospitals &&
                TERAI_HOSPITALS.map((hosp) => {
                  if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(hosp.district)) {
                    return null;
                  }
                  if (selectedDistrict !== 'all' && hosp.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                    return null;
                  }
                  const isFlooded = hosp.isFlooded;
                  return (
                    <Marker
                      key={`leaflet-hosp-${hosp.id}`}
                      position={hosp.coords}
                      icon={createHospitalLeafletIcon(hosp.isFlooded)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[250px]">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isFlooded ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {hosp.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold text-cyan-400">
                              {hosp.beds} beds
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{hosp.name}</h4>
                          <p className="text-[10px] text-slate-400">{hosp.type} &bull; {hosp.district}</p>
                          <div className="text-xs text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                            <p><strong>Status:</strong> {hosp.isFlooded ? 'Submerged' : 'Operational'}</p>
                            {hosp.nearestSafeHaven && <p><strong>Refuge:</strong> {hosp.nearestSafeHaven}</p>}
                            <p><strong>Hotline:</strong> <span className="text-blue-300 font-bold">{hosp.phone}</span></p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* 10. Terai Safe Havens & Refugee Relief Compounds */}
              {showSafeZones &&
                TERAI_SAFE_HAVENS.map((haven) => {
                  if (selectedRegionKey !== 'full_terai' && !activeRegion.districts.includes(haven.district)) {
                    return null;
                  }
                  if (selectedDistrict !== 'all' && haven.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                    return null;
                  }
                  return (
                    <Marker
                      key={`leaflet-haven-${haven.id}`}
                      position={haven.coords}
                      icon={createSafeHavenLeafletIcon(haven)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[260px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              GRADE {haven.suitabilityGrade} HAVEN
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400">
                              +{haven.elevationAboveFloodPlainMeters}m high ground
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{haven.name}</h4>
                          <p className="text-[10px] text-slate-400">{haven.nepaliName} &bull; {haven.district}</p>
                          <div className="text-xs text-slate-300 space-y-0.5 border-t border-slate-800 pt-1">
                            <p><strong>Capacity:</strong> {haven.currentOccupancy.toLocaleString()} / {haven.totalCapacity.toLocaleString()}</p>
                            <p><strong>Helipad:</strong> {haven.hasHelipad ? '🚁 Nepal Army Helipad Ready' : 'None'}</p>
                            <p><strong>Warden:</strong> {haven.wardenName} ({haven.wardenPhone})</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>

            {/* Floating Terai Intelligence Badge for Leaflet Engine */}
            <div className="absolute bottom-5 left-5 z-[500] pointer-events-none">
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md text-xs font-bold text-slate-200 space-y-1">
                <div className="flex items-center justify-between gap-3 text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Nepal Terai Plain &bull; Leaflet High-Speed Engine</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {propViewLayerMode === 'flooded' ? 'Inundation Only' : propViewLayerMode === 'safe' ? 'Safe Shelters Only' : 'Dual View (Flood + Safe)'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300">
                  Basin: <span className="text-white font-bold">{activeRegion.shortName}</span> &bull; Corridors: <span className="text-cyan-300">{TERAI_FLOOD_CORRIDORS.length}</span> &bull; Route: <span className="text-amber-300">{activeRoute ? activeRoute.name : 'Standard Patrol'}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/80 pt-1 flex items-center gap-2">
                  <span className={showNepalBorder ? 'text-amber-400 font-bold' : 'text-slate-500 line-through'}>
                    Nepal Border: {showNepalBorder ? 'ON' : 'OFF'}
                  </span>
                  <span>&bull;</span>
                  <span className={showTeraiBoundary ? 'text-emerald-400 font-bold' : 'text-slate-500 line-through'}>
                    Terai Lowlands: {showTeraiBoundary ? 'ON' : 'OFF'}
                  </span>
                  <span>&bull;</span>
                  <span className={showFloodPolygons ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}>
                    Flood Corridors: {showFloodPolygons ? 'ON' : 'OFF'}
                  </span>
                  {propAfterDate && (
                    <>
                      <span>&bull;</span>
                      <span className="text-cyan-400 font-semibold">Deluge: {propAfterDate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terai City Villages & Towns Directory Modal */}
      <CityVillagesModal
        city={selectedCity}
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onFocusVillage={(v) => {
          pinpointVillageOnMap(v);
          setIsCityModalOpen(false);
        }}
      />

      {/* Stage 5.5 Gemini AI Demographic & Healthcare Dossier Modal */}
      <SettlementDossierModal
        settlementName={dossierTarget?.name || null}
        district={dossierTarget?.district || null}
        isFlooded={dossierTarget?.isFlooded}
        floodDepthMeters={dossierTarget?.depth}
        isOpen={Boolean(dossierTarget)}
        onClose={() => setDossierTarget(null)}
      />

      {/* Real-Time Live River Telemetry Inspector Modal */}
      <LiveRiverTelemetryModal
        river={selectedRiver}
        isOpen={isRiverModalOpen}
        onClose={() => setIsRiverModalOpen(false)}
        language="ne"
        onFocusRiver={(riv) => {
          if (googleMapInstanceRef.current && window.google) {
            const bounds = new google.maps.LatLngBounds();
            riv.coordinates.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
            googleMapInstanceRef.current.fitBounds(bounds);
          }
          if (leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.fitBounds(riv.coordinates as L.LatLngBoundsExpression);
          }
        }}
      />
    </div>
  );
};
