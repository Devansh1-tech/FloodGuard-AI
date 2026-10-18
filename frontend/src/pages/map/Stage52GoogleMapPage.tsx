/**
 * Stage52GoogleMapPage.tsx — Terai Disaster Command Map Page.
 *
 * User-friendly field operations interface powered by Google Maps JavaScript API:
 * - Real-time settlements and healthcare infrastructure.
 * - Road accessibility & live highway traffic over Mahendra Highway.
 * - Sentinel-1 flood extents and designated safe refugee shelters.
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
              GOOGLE MAPS PLATFORM
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
            Live Google Maps JavaScript API v3 engine loaded with your Google Cloud API key, rendering satellite imagery, vector flood polygons, hospital status, live highway traffic, and settlement dossiers.
          </p>
        </div>
      </div>

      {/* Main Google Maps Viewer Component */}
      <GoogleMapsViewer />

      {/* Technical Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            Google Maps JavaScript API Engine
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Loaded asynchronously via <code className="text-blue-300">@googlemaps/js-api-loader</code> with your authenticated API key. Viewport is strictly constrained to the 21 Terai districts to eliminate irrelevant mountain views.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-blue-300">
            Engine: Google Maps JS API v3 &bull; Bounds: Nepal Terai
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <HeartPulse className="h-4 w-4" />
            Healthcare Infrastructure &amp; POIs
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tracks real hospital locations, primary health posts, emergency phone numbers, and operational flood status across the Terai belt to direct rescue teams.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-300">
            Source: OpenStreetMap Health POIs &bull; Verified Coordinates
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Car className="h-4 w-4" />
            Real-Time Highway Traffic Flow
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integrates <code className="text-amber-300">google.maps.TrafficLayer</code> over the East-West Highway (Mahendra Highway) to monitor road congestion and bridge blockages caused by monsoon overflow.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-amber-300">
            Layer: Live Traffic &bull; Status: Real-Time Flow
          </div>
        </div>
      </div>
    </div>
  );
};
