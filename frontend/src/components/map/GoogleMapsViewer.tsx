/**
 * GoogleMapsViewer.tsx — Enterprise Google Maps JavaScript API v3 Platform.
 *
 * Dedicated Field Intelligence & Infrastructure Engine:
 * 1. Strictly constrained and focused on the Nepal Terai region (Lat 26.20°N–28.35°N, Lon 79.95°E–88.25°E).
 * 2. Visualizes Critical Infrastructure: Hospitals, Health Posts, Clinics with flood operational status.
 * 3. Settlement & Village dossiers with water depth and population headcounts.
 * 4. Google Maps live Highway Traffic (Mahendra East-West Highway).
 * 5. Native vector rendering: Dotted sovereign border, Terai lowland plain, Sentinel-1 flood extents, and safe havens.
 * 6. Dual Engine fallback: Instant switch between Google Maps JS API and high-performance Leaflet.
 */

import React, { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
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
  Building2,
  Car,
  CheckCircle2,
  Compass,
  Cross,
  Eye,
  Filter,
  Globe,
  HeartPulse,
  Key,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Radio,
  RefreshCw,
  Satellite,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Waves,
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
import {
  TERAI_CITIES_DATA,
  TeraiCityData,
  VillageTownItem,
  createCityColorLeafletPin,
} from '@/data/teraiCitiesData';
import { CityVillagesModal } from '@/components/map/CityVillagesModal';

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
        width: 28px;
        height: 28px;
        background: ${isFlooded ? '#EF4444' : '#0284C7'};
        border-radius: 8px;
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        color: #FFFFFF;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
      ">
        +
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createSettlementLeafletIcon = (isFlooded: boolean, depth?: number) =>
  L.divIcon({
    className: 'custom-settlement-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${isFlooded ? '22px' : '18px'};
          height: ${isFlooded ? '22px' : '18px'};
          border-radius: 50%;
          background: ${isFlooded ? '#DC2626' : '#10B981'};
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 10px ${isFlooded ? '#EF4444' : '#10B981'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 800;
        ">
          ${isFlooded ? '!' : '✓'}
        </div>
        ${
          depth
            ? `<div style="
                position: absolute;
                bottom: -14px;
                white-space: nowrap;
                background: #7F1D1D;
                color: #FCA5A5;
                border: 1px solid #DC2626;
                font-size: 8px;
                font-weight: 800;
                padding: 0 4px;
                border-radius: 3px;
              ">${depth}m</div>`
            : ''
        }
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

// Controller to sync Leaflet container size and flyTo region
const LeafletViewController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

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
  onRegionChange?: (regionKey: string) => void;
}

export const GoogleMapsViewer: React.FC<GoogleMapsViewerProps> = ({
  apiKey: initialApiKey,
  defaultRegionKey = 'full_terai',
  onRegionChange,
}) => {
  // API Key State (Fallback to Vite Env or User Key)
  const [apiKey, setApiKey] = useState<string>(
    initialApiKey ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyCYKKkl1C613n508xjv25SNSDFKO9Og0rw'
  );
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);

  // Provider State: Google Maps JS API vs Leaflet Fallback
  const [provider, setProvider] = useState<'google_maps' | 'leaflet'>('google_maps');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState<boolean>(true);
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);

  // Region & District State
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>(defaultRegionKey);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const activeRegion: TeraiRegionData = TERAI_REGIONS[selectedRegionKey] || TERAI_REGIONS.full_terai;

  // Map Controls State
  const [mapTypeId, setMapTypeId] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [showNepalBorder, setShowNepalBorder] = useState<boolean>(true);
  const [showTeraiBoundary, setShowTeraiBoundary] = useState<boolean>(true);
  const [showFloodPolygons, setShowFloodPolygons] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [showSettlementPins, setShowSettlementPins] = useState<boolean>(true);
  const [showCityPoints, setShowCityPoints] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<TeraiCityData | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);

  // DOM & Map References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const overlaysRef = useRef<(google.maps.Polygon | google.maps.Polyline | google.maps.Marker)[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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
  };

  // Handle District Direct Pan
  const handleDistrictSelect = (districtName: string) => {
    setSelectedDistrict(districtName);
    if (districtName === 'all') {
      handleRegionSelect('full_terai');
      return;
    }

    const matchSettlement = activeRegion.settlements.find(
      (s) => s.district.toLowerCase() === districtName.toLowerCase()
    );
    const matchHospital = TERAI_HOSPITALS.find(
      (h) => h.district.toLowerCase() === districtName.toLowerCase()
    );
    const coords = matchSettlement ? matchSettlement.coords : matchHospital ? matchHospital.coords : null;

    if (coords && googleMapInstanceRef.current && window.google) {
      googleMapInstanceRef.current.panTo({ lat: coords[0], lng: coords[1] });
      googleMapInstanceRef.current.setZoom(11);
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
      fullscreenControl: true,
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

    setTimeout(() => {
      if (googleMapInstanceRef.current && window.google) {
        google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
        fitToActiveRegion(googleMapInstanceRef.current, selectedRegionKey);
      }
    }, 150);

    setIsLoadingGoogle(false);
  };

  // Initialize Google Maps JavaScript API via Loader
  useEffect(() => {
    if (provider !== 'google_maps' || !apiKey) {
      setIsLoadingGoogle(false);
      return;
    }

    let isMounted = true;
    setIsLoadingGoogle(true);
    setGoogleLoadError(null);

    // If Google Maps is already present on window
    if (window.google?.maps?.Map) {
      initGoogleMap(window.google.maps.Map);
      return;
    }

    try {
      setOptions({
        key: apiKey.trim(),
        v: 'weekly',
        libraries: ['places', 'geometry'],
      });
    } catch {
      // Ignore if options already configured in current browser session
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
        setIsLoadingGoogle(false);
      });

    return () => {
      isMounted = false;
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

  // Synchronize Google Maps Vector Overlays
  useEffect(() => {
    const map = googleMapInstanceRef.current;
    if (!map || !window.google) return;

    // Clear existing overlays
    overlaysRef.current.forEach((item) => {
      if ('setMap' in item) item.setMap(null);
    });
    overlaysRef.current = [];

    // 1. Draw Dotted Sovereign Nepal Border
    if (showNepalBorder) {
      const borderPath = nepalBoundaries.nepal_border.map(([lat, lng]) => ({ lat, lng }));
      const dottedSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeColor: '#F59E0B',
        strokeWeight: 2.5,
        scale: 4,
      };

      const borderLine = new google.maps.Polyline({
        path: borderPath,
        strokeColor: '#F59E0B',
        strokeOpacity: 0,
        icons: [
          {
            icon: dottedSymbol,
            offset: '0',
            repeat: '14px',
          },
        ],
        map,
      });

      borderLine.addListener('click', (e: google.maps.PolyMouseEvent) => {
        const info = new google.maps.InfoWindow({
          content: `
            <div style="color: #0F172A; font-family: sans-serif; padding: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #D97706; text-transform: uppercase;">Sovereign Boundary</span>
              <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">Federal Democratic Republic of Nepal</h4>
              <p style="margin: 0; font-size: 11px; color: #475569;">Official international border demarcation.</p>
            </div>
          `,
          position: e.latLng,
        });
        info.open(map);
        activeInfoWindowRef.current = info;
      });

      overlaysRef.current.push(borderLine);
    }

    // 2. Draw Nepal Terai Lowland Plain Highlight Polygon
    if (showTeraiBoundary) {
      let activeCoords = nepalBoundaries.terai_full;
      if (selectedRegionKey === 'eastern_terai') activeCoords = nepalBoundaries.terai_eastern;
      else if (selectedRegionKey === 'central_terai') activeCoords = nepalBoundaries.terai_central;
      else if (selectedRegionKey === 'western_terai') activeCoords = nepalBoundaries.terai_western;
      else if (selectedRegionKey === 'far_western_terai') activeCoords = nepalBoundaries.terai_far_western;

      const teraiPath = activeCoords.map(([lat, lng]) => ({ lat, lng }));
      const teraiPoly = new google.maps.Polygon({
        paths: teraiPath,
        strokeColor: '#10B981',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#10B981',
        fillOpacity: 0.12,
        map,
      });

      teraiPoly.addListener('click', (e: google.maps.PolyMouseEvent) => {
        const info = new google.maps.InfoWindow({
          content: `
            <div style="color: #0F172A; font-family: sans-serif; padding: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">Nepal Terai Plains</span>
              <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">${activeRegion.name}</h4>
              <p style="margin: 0; font-size: 11px; color: #475569;">Elevation &lt; 300m ASL &bull; 21 Lowland Districts Risk Corridor</p>
            </div>
          `,
          position: e.latLng,
        });
        info.open(map);
        activeInfoWindowRef.current = info;
      });

      overlaysRef.current.push(teraiPoly);
    }

    // 3. Draw Sentinel-1 SAR Flood Inundation Polygons
    if (showFloodPolygons && activeRegion.floodPolygons) {
      activeRegion.floodPolygons.forEach((poly, idx) => {
        const floodPath = poly.map(([lat, lng]) => ({ lat, lng }));
        const floodPoly = new google.maps.Polygon({
          paths: floodPath,
          strokeColor: '#38BDF8',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#0284C7',
          fillOpacity: 0.65,
          map,
        });

        floodPoly.addListener('click', (e: google.maps.PolyMouseEvent) => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 230px;">
                <span style="font-size: 10px; font-weight: 800; color: #0284C7; text-transform: uppercase;">Earth Engine Flood Extent</span>
                <h4 style="margin: 2px 0; font-size: 13px; font-weight: bold;">${activeRegion.shortName} Flood Zone #${idx + 1}</h4>
                <p style="margin: 0; font-size: 11px; color: #334155; line-height: 1.4;">
                  <strong>Inundation:</strong> Specular Standing Water<br/>
                  <strong>Water Depth:</strong> ~1.2m - 2.4m<br/>
                  <strong>Backscatter Drop:</strong> ${activeRegion.deltaDb} dB (Otsu: ${activeRegion.otsuThreshold} dB)
                </p>
              </div>
            `,
            position: e.latLng,
          });
          info.open(map);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(floodPoly);
      });
    }

    // 4. Draw Hospitals & Health Infrastructure
    if (showHospitals) {
      TERAI_HOSPITALS.forEach((hosp) => {
        if (selectedRegionKey !== 'full_terai') {
          const isEastern = selectedRegionKey === 'eastern_terai' && hosp.basin === 'Eastern Terai';
          const isCentral = selectedRegionKey === 'central_terai' && hosp.basin === 'Central Terai';
          const isWestern = selectedRegionKey === 'western_terai' && hosp.basin === 'Western Terai';
          const isFarWestern = selectedRegionKey === 'far_western_terai' && hosp.basin === 'Far-Western Terai';
          if (!isEastern && !isCentral && !isWestern && !isFarWestern) return;
        }

        const marker = new google.maps.Marker({
          position: { lat: hosp.coords[0], lng: hosp.coords[1] },
          map,
          title: hosp.name,
          icon: {
            path: 'M 0,-6 L 0,6 M -6,0 L 6,0',
            strokeColor: hosp.isFlooded ? '#EF4444' : '#0284C7',
            strokeWeight: 4,
            scale: 2,
          },
        });

        marker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 250px;">
                <span style="
                  font-size: 9px;
                  font-weight: 800;
                  text-transform: uppercase;
                  padding: 2px 6px;
                  border-radius: 4px;
                  background: ${hosp.isFlooded ? '#FEE2E2' : '#E0F2FE'};
                  color: ${hosp.isFlooded ? '#991B1B' : '#0369A1'};
                ">
                  ${hosp.isFlooded ? 'SUBMERGED / INOPERABLE' : 'OPERATIONAL HOSPITAL'}
                </span>
                <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${hosp.name}</h4>
                <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">
                  <strong>Type:</strong> ${hosp.type}<br/>
                  <strong>District:</strong> ${hosp.district} (${hosp.basin})<br/>
                  <strong>Bed Capacity:</strong> ${hosp.beds} beds<br/>
                  <strong>Emergency Contact:</strong> <a href="tel:${hosp.phone}" style="color: #2563EB;">${hosp.phone}</a><br/>
                  <strong>Nearest Safe Refuge:</strong> ${hosp.nearestSafeHaven}
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

    // 5. Draw Safe High-Ground Refugee Shelters
    if (showSafeZones && activeRegion.safeZones) {
      activeRegion.safeZones.forEach((safe) => {
        const safePath = safe.polygon.map(([lat, lng]) => ({ lat, lng }));
        const safePoly = new google.maps.Polygon({
          paths: safePath,
          strokeColor: '#10B981',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#059669',
          fillOpacity: 0.35,
          map,
        });

        safePoly.addListener('click', (e: google.maps.PolyMouseEvent) => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 240px;">
                <span style="font-size: 9px; font-weight: 800; background: #DCFCE7; color: #166534; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                  SAFE HIGH-GROUND SHELTER
                </span>
                <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${safe.name}</h4>
                <p style="margin: 0; font-size: 11px; color: #334155; line-height: 1.4;">
                  <strong>District:</strong> ${safe.district}<br/>
                  <strong>Elevation:</strong> ${safe.elevationMeters}m ASL (Flood-Resistant)<br/>
                  <strong>Shelter Capacity:</strong> ${safe.shelterCapacity.toLocaleString()} persons<br/>
                  <strong>Managing Agency:</strong> ${safe.contactAgency}
                </p>
              </div>
            `,
            position: e.latLng,
          });
          info.open(map);
          activeInfoWindowRef.current = info;
        });

        overlaysRef.current.push(safePoly);
      });
    }

    // 6. Draw Settlement Pins
    if (showSettlementPins && activeRegion.settlements) {
      activeRegion.settlements.forEach((v) => {
        const marker = new google.maps.Marker({
          position: { lat: v.coords[0], lng: v.coords[1] },
          map,
          title: v.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: v.isFlooded ? '#EF4444' : '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: v.isFlooded ? 8 : 6,
          },
        });

        marker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="color: #0F172A; font-family: sans-serif; padding: 4px; max-width: 240px;">
                <span style="
                  font-size: 9px;
                  font-weight: 800;
                  text-transform: uppercase;
                  padding: 2px 6px;
                  border-radius: 4px;
                  background: ${v.isFlooded ? '#FEE2E2' : '#DCFCE7'};
                  color: ${v.isFlooded ? '#991B1B' : '#166534'};
                ">
                  ${v.isFlooded ? 'CRITICAL: FLOODED SETTLEMENT' : 'SAFE HIGH-GROUND VILLAGE'}
                </span>
                <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${v.name}</h4>
                <p style="margin: 0; font-size: 11px; color: #334155; line-height: 1.4;">
                  <strong>District:</strong> ${v.district}<br/>
                  <strong>Population:</strong> ${v.population.toLocaleString()}<br/>
                  ${v.floodDepthMeters ? `<strong>Water Depth:</strong> ~${v.floodDepthMeters}m<br/>` : ''}
                  <strong>Status:</strong> ${v.status}<br/>
                  <span style="color: #2563EB;"><strong>Action:</strong> ${v.recommendedAction}</span>
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

    // 7. Draw All Terai Region Cities & Color Points (User Feature)
    if (showCityPoints) {
      TERAI_CITIES_DATA.forEach((city) => {
        if (selectedRegionKey !== 'full_terai' && city.regionKey !== selectedRegionKey) {
          return;
        }

        const cityMarker = new google.maps.Marker({
          position: { lat: city.coords[0], lng: city.coords[1] },
          map,
          title: `${city.name} (${city.district} District) — Click to inspect all villages & towns`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: city.color,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5,
          },
        });

        cityMarker.addListener('click', () => {
          setSelectedCity(city);
          setIsCityModalOpen(true);
        });

        overlaysRef.current.push(cityMarker);
      });
    }
  }, [
    selectedRegionKey,
    showNepalBorder,
    showTeraiBoundary,
    showFloodPolygons,
    showHospitals,
    showSafeZones,
    showSettlementPins,
    showCityPoints,
  ]);

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey.trim());
    setIsEditingKey(false);
  };

  return (
    <div className="space-y-5">
      {/* ───────────────────────────────────────────────────────────────────────
          TERAI REGIONAL BASIN & DISTRICT FILTER BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                GOOGLE MAPS FIELD COMMAND
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                LOCKED TO NEPAL TERAI (21 DISTRICTS)
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400 shrink-0" />
              <span>{activeRegion.name}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive Google Maps intelligence monitoring settlements, healthcare facilities, roads, and flood hazards across the southern plains.
            </p>
          </div>

          {/* Engine & Provider Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Dual Provider Switcher */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
              <button
                onClick={() => setProvider('google_maps')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                  provider === 'google_maps'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>Google Maps API</span>
              </button>
              <button
                onClick={() => setProvider('leaflet')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                  provider === 'leaflet'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-emerald-300" />
                <span>Leaflet Fallback</span>
              </button>
            </div>

            {/* Re-center strictly to Terai button */}
            <button
              onClick={() => {
                if (googleMapInstanceRef.current) {
                  fitToActiveRegion(googleMapInstanceRef.current, selectedRegionKey);
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
              title="Reset view to Terai lowlands"
            >
              <Compass className="h-3.5 w-3.5 text-blue-400" />
              <span>Lock Terai View</span>
            </button>

            {/* API Key Modal Toggle */}
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

        {/* Region & Basin Selection Buttons */}
        <div className="space-y-2">
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

        {/* District Fast-Jump Dropdown */}
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

        {/* Overlay Checkboxes */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                showTraffic
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>Live Traffic</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showHospitals}
                onChange={(e) => setShowHospitals(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span className="text-blue-400 font-semibold">🏥 Hospitals &amp; Clinics</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showFloodPolygons}
                onChange={(e) => setShowFloodPolygons(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0"
              />
              <span className="text-cyan-400 font-semibold">🌊 Flooded Areas</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showSafeZones}
                onChange={(e) => setShowSafeZones(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0"
              />
              <span className="text-emerald-400 font-semibold">🛡️ Safe Shelters</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showSettlementPins}
                onChange={(e) => setShowSettlementPins(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-rose-600 focus:ring-0"
              />
              <span className="text-rose-400 font-semibold">📍 Settlements</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showCityPoints}
                onChange={(e) => setShowCityPoints(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span className="text-cyan-300 font-semibold">🏙️ All Terai Cities (21 Color Points)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showTeraiBoundary}
                onChange={(e) => setShowTeraiBoundary(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0"
              />
              <span className="text-emerald-300 font-semibold">🟢 Terai Plain</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showNepalBorder}
                onChange={(e) => setShowNepalBorder(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
              />
              <span className="text-amber-400 font-semibold">⚪ Nepal Border</span>
            </label>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          MAIN VIEWPORT: DUAL ENGINE (GOOGLE MAPS V3 OR CRISP LEAFLET)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="relative h-[680px] w-full rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden">
        {provider === 'google_maps' ? (
          <>
            <div ref={mapContainerRef} className="h-full w-full" style={{ height: '680px', width: '100%' }} />

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
                  onClick={() => setProvider('leaflet')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg"
                >
                  Switch to Leaflet Fallback
                </button>
              </div>
            )}

            {/* Floating Terai Intelligence Badge */}
            <div className="absolute bottom-5 left-5 z-20 pointer-events-none">
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2 shadow-2xl backdrop-blur-md text-xs font-bold text-slate-200 space-y-0.5">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Nepal Terai Plain &bull; {mapTypeId.toUpperCase()}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Region: {activeRegion.shortName} &bull; Bounds Locked &bull; Hospitals: {TERAI_HOSPITALS.length} Tracked
                </div>
              </div>
            </div>
          </>
        ) : (
          /* High-Performance Dedicated Leaflet Engine for Field Operations */
          <div className="relative h-full w-full" style={{ height: '680px', width: '100%' }}>
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
              <LeafletViewController center={activeRegion.center} zoom={activeRegion.zoom} />

              {/* Google Basemap Tile Layer via Leaflet */}
              <TileLayer
                url={GOOGLE_TILE_URLS[mapTypeId]}
                attribution="&copy; Google Maps &copy; OpenStreetMap"
                maxZoom={20}
              />

              {/* 1. Sovereign Border (Amber Dotted) */}
              {showNepalBorder && (
                <Polyline
                  positions={nepalBoundaries.nepal_border}
                  pathOptions={{
                    color: '#F59E0B',
                    weight: 2.5,
                    dashArray: '8, 8',
                    opacity: 0.95,
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        Sovereign Boundary
                      </span>
                      <h4 className="font-bold text-sm text-white">Federal Democratic Republic of Nepal</h4>
                      <p className="text-xs text-slate-300">Official international border demarcation.</p>
                    </div>
                  </Popup>
                </Polyline>
              )}

              {/* 2. Terai Lowland Plains Boundary (Emerald) */}
              {showTeraiBoundary && (
                <Polygon
                  positions={
                    selectedRegionKey === 'eastern_terai'
                      ? nepalBoundaries.terai_eastern
                      : selectedRegionKey === 'central_terai'
                      ? nepalBoundaries.terai_central
                      : selectedRegionKey === 'western_terai'
                      ? nepalBoundaries.terai_western
                      : selectedRegionKey === 'far_western_terai'
                      ? nepalBoundaries.terai_far_western
                      : nepalBoundaries.terai_full
                  }
                  pathOptions={{
                    color: '#10B981',
                    weight: 2,
                    dashArray: '6, 6',
                    fillColor: '#10B981',
                    fillOpacity: 0.12,
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        Nepal Terai Plains
                      </span>
                      <h4 className="font-bold text-sm text-white">{activeRegion.name}</h4>
                      <p className="text-xs text-slate-300">Elevation &lt; 300m ASL &bull; 21 Lowland Districts</p>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* 3. Sentinel-1 Flood Inundation Polygons (Cyan/Blue) */}
              {showFloodPolygons &&
                activeRegion.floodPolygons?.map((poly, idx) => (
                  <Polygon
                    key={idx}
                    positions={poly}
                    pathOptions={{
                      color: '#38BDF8',
                      weight: 2,
                      fillColor: '#0284C7',
                      fillOpacity: 0.65,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 max-w-[220px]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                          Sentinel-1 SAR Deluge
                        </span>
                        <h4 className="font-bold text-sm text-white">
                          {activeRegion.shortName} Flood Zone #{idx + 1}
                        </h4>
                        <p className="text-xs text-slate-300">
                          Radar Specular Water Mask<br />
                          Backscatter Drop: {activeRegion.deltaDb} dB
                        </p>
                      </div>
                    </Popup>
                  </Polygon>
                ))}

              {/* 4. Hospitals & Health Infrastructure Markers */}
              {showHospitals &&
                TERAI_HOSPITALS.map((hosp) => {
                  if (selectedRegionKey !== 'full_terai') {
                    const isEastern = selectedRegionKey === 'eastern_terai' && hosp.basin === 'Eastern Terai';
                    const isCentral = selectedRegionKey === 'central_terai' && hosp.basin === 'Central Terai';
                    const isWestern = selectedRegionKey === 'western_terai' && hosp.basin === 'Western Terai';
                    const isFarWestern = selectedRegionKey === 'far_western_terai' && hosp.basin === 'Far-Western Terai';
                    if (!isEastern && !isCentral && !isWestern && !isFarWestern) return null;
                  }

                  return (
                    <Marker
                      key={hosp.id}
                      position={hosp.coords}
                      icon={createHospitalLeafletIcon(hosp.isFlooded)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 max-w-[240px]">
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              hosp.isFlooded
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            ${hosp.isFlooded ? 'SUBMERGED / INOPERABLE' : 'OPERATIONAL HOSPITAL'}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-1">{hosp.name}</h4>
                          <div className="text-xs text-slate-300 space-y-0.5">
                            <p><strong>District:</strong> {hosp.district} ({hosp.basin})</p>
                            <p><strong>Bed Capacity:</strong> {hosp.beds} beds</p>
                            <p>
                              <strong>Emergency:</strong>{' '}
                              <a href={`tel:${hosp.phone}`} className="text-blue-400 underline">
                                {hosp.phone}
                              </a>
                            </p>
                            <p className="text-[11px] text-emerald-400">
                              <strong>Safe Refuge:</strong> {hosp.nearestSafeHaven}
                            </p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* 5. Safe Refugee High-Ground Shelters */}
              {showSafeZones &&
                activeRegion.safeZones?.map((safe) => (
                  <Polygon
                    key={safe.id}
                    positions={safe.polygon}
                    pathOptions={{
                      color: '#10B981',
                      weight: 2,
                      fillColor: '#059669',
                      fillOpacity: 0.35,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 max-w-[220px]">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          SAFE REFUGEE HAVEN
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1">{safe.name}</h4>
                        <p className="text-xs text-slate-300">
                          <strong>District:</strong> {safe.district}<br />
                          <strong>Elevation:</strong> {safe.elevationMeters}m ASL<br />
                          <strong>Capacity:</strong> {safe.shelterCapacity.toLocaleString()} citizens
                        </p>
                      </div>
                    </Popup>
                  </Polygon>
                ))}

              {/* 6. Settlement Hazard Pins */}
              {showSettlementPins &&
                activeRegion.settlements?.map((v) => (
                  <Marker
                    key={v.id}
                    position={v.coords}
                    icon={createSettlementLeafletIcon(v.isFlooded, v.floodDepthMeters)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 max-w-[230px]">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            v.isFlooded
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {v.isFlooded ? 'CRITICAL: FLOODED SETTLEMENT' : 'SAFE HIGH-GROUND VILLAGE'}
                        </span>
                        <h4 className="font-bold text-sm text-white mt-1">{v.name}</h4>
                        <div className="text-xs text-slate-300 space-y-0.5">
                          <p><strong>District:</strong> {v.district}</p>
                          <p><strong>Population:</strong> {v.population.toLocaleString()}</p>
                          {v.floodDepthMeters && (
                            <p className="text-rose-300 font-bold">
                              <strong>Water Depth:</strong> ~{v.floodDepthMeters}m
                            </p>
                          )}
                          <p className="text-[11px] text-blue-300">
                            <strong>Action:</strong> {v.recommendedAction}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {/* 7. Terai City Color Points (User Feature) */}
              {showCityPoints &&
                TERAI_CITIES_DATA.map((city) => {
                  if (selectedRegionKey !== 'full_terai' && city.regionKey !== selectedRegionKey) {
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
            </MapContainer>

            {/* Floating Terai Intelligence Badge for Leaflet Engine */}
            <div className="absolute bottom-5 left-5 z-[500] pointer-events-none">
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2 shadow-2xl backdrop-blur-md text-xs font-bold text-slate-200 space-y-0.5">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Nepal Terai Plain &bull; Leaflet High-Speed Engine</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Region: {activeRegion.shortName} &bull; Bounds Locked &bull; Basemap: {mapTypeId.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          TERAI INFRASTRUCTURE & FIELD TELEMETRY METRICS
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-400" />
            Terai Hospitals &amp; Health Posts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">
              {TERAI_HOSPITALS.length} Monitored
            </span>
            <span className="text-xs text-rose-400 font-bold">2 Inundated</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Real OpenStreetMap medical facilities mapped with bed counts.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            Earth Engine Flood Extent
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{activeRegion.floodAreaKm2} km²</span>
            <span className="text-xs text-rose-400 font-bold">inundated</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Copernicus Sentinel-1 SAR change detection polygons.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Operational Refugee Shelters
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {activeRegion.safeZones?.length || 0} Hubs
            </span>
            <span className="text-xs text-slate-400">high-ground</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Total capacity:{' '}
            {(activeRegion.safeZones?.reduce((acc, z) => acc + z.shelterCapacity, 0) || 0).toLocaleString()} displaced
            persons.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            Submerged Settlements
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {activeRegion.settlements?.filter((s) => s.isFlooded).length || 0} Villages
            </span>
            <span className="text-xs text-rose-400 font-bold">active hazard</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeRegion.affectedPopulation.toLocaleString()} citizens at risk in lowlands.
          </p>
        </div>
      </div>

      {/* Terai City Villages & Towns Directory Modal */}
      <CityVillagesModal
        city={selectedCity}
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onFocusVillage={(v) => {
          if (googleMapInstanceRef.current && window.google) {
            googleMapInstanceRef.current.panTo({ lat: v.coords[0], lng: v.coords[1] });
            googleMapInstanceRef.current.setZoom(12);
          }
        }}
      />
    </div>
  );
};
