/**
 * Stage52GoogleMapPage.tsx — Terai Disaster Command Map Page.
 *
 * Stage 5.3: Flood Extent & Settlement Inundation Intelligence
 * - Real-time settlements and healthcare infrastructure.
 * - Road accessibility & live highway traffic over Mahendra Highway.
 * - Sentinel-1 flood extents across all 11 major river basins.
 * - All 21 Terai district hubs with color hazard pins and village dossiers.
 */

import React from 'react';
import {
  Car,
  CheckCircle2,
  Globe,
  HeartPulse,
  Info,
  Key,
  Layers,
  MapPin,
  Shield,
  ShieldAlert,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import { GoogleMapsViewer } from '@/components/map/GoogleMapsViewer';

export const Stage52GoogleMapPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              STAGE 5.3: FLOOD EXTENT &amp; SETTLEMENT OVERLAY
            </span>
            <span className="text-xs text-slate-400">
              Interactive Field Operations &bull; Nepal Terai Lowlands
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <MapPin className="h-6 w-6 text-blue-400" />
            Terai Disaster Command Map
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
            Live Google Maps JavaScript API v3 engine loaded with your Google Cloud API key, rendering satellite imagery, vector flood polygons, all 21 Terai city color points, and constituent village dossiers with water depths.
          </p>
        </div>
      </div>

      {/* Main Google Maps Viewer Component */}
      <GoogleMapsViewer />

      {/* Technical Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Waves className="h-4 w-4" />
            Sentinel-1 SAR Vector Flood Polygons
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Delineates standing water across 11 major Terai river corridors (Koshi, Bagmati, Narayani, Rapti, Karnali, Babai) using Sentinel-1 C-SAR bimodal Otsu thresholding at -15.2 dB.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-cyan-300">
            Corridors: 11 Active &bull; Inundated: 642.8 km²
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            21 Terai Cities &amp; Village Dossiers
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Displays all 21 Terai district hubs with color pins (Crimson, Orange, Cyan, Green). Clicking any city opens all constituent villages with water depth tags and evacuation alerts.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-blue-300">
            Hubs: 21 Cities &bull; Villages Tracked: 115+
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Car className="h-4 w-4" />
            Real-Time Highway Traffic &amp; Fallback
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integrates <code className="text-amber-300">google.maps.TrafficLayer</code> over the East-West Highway with zero-latency fallback to high-speed Leaflet when operating in low-bandwidth disaster zones.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-amber-300">
            Engine: Dual Google Maps + Leaflet Fallback
          </div>
        </div>
      </div>
    </div>
  );
};
