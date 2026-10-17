/**
 * InteractiveMapPage.tsx — Full GIS Geospatial Analysis and Map Visualization Workspace.
 */

import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Compass,
  Download,
  Eye,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Share2,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { GisMapView } from '@/components/maps/GisMapView';
import { DEFAULT_PRESETS } from '@/config/constants';
import { useJobs } from '@/hooks/useJobs';

export const InteractiveMapPage: React.FC = () => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('nepal_terai_koshi');
  const [activeLayers, setActiveLayers] = useState({
    floodExtent: true,
    hospitals: true,
    schools: true,
    police: true,
    shelters: true,
  });

  const preset = (DEFAULT_PRESETS as Record<string, any>)[selectedPresetKey] || DEFAULT_PRESETS.nepal_terai_koshi;

  // Center coordinates for map view
  const mapCenter: [number, number] = [26.65, 87.1];

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Study Area Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-500" />
            Interactive GIS Map Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sentinel-1 SAR surface water delineation overlaid with OpenStreetMap lifelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 text-xs">
            <span className="text-slate-400 pl-2">Study Area:</span>
            <select
              value={selectedPresetKey}
              onChange={(e) => setSelectedPresetKey(e.target.value)}
              className="rounded-lg border-0 bg-slate-800 px-3 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="nepal_terai_koshi">Nepal Terai — Koshi Basin</option>
              <option value="nepal_terai_west_rapti">Nepal Terai — West Rapti Basin</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Share2 className="h-3.5 w-3.5" />}
          >
            Export Map
          </Button>
        </div>
      </div>

      {/* Main Map + Sidebar Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: Layer Controls & Quick KPI */}
        <div className="lg:col-span-1 space-y-4">
          {/* Layer Visibility Toggles */}
          <Card className="p-4 bg-slate-900/90 border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Filter className="h-3.5 w-3.5 text-blue-400" />
              Geospatial Layers
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-blue-600 border border-blue-400" />
                  <span className="font-medium text-slate-200">Flood Inundation (SAR)</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.floodExtent}
                  onChange={() => toggleLayer('floodExtent')}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="font-medium text-slate-200">Submerged Hospitals (2)</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.hospitals}
                  onChange={() => toggleLayer('hospitals')}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-slate-200">Submerged Schools (3)</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.schools}
                  onChange={() => toggleLayer('schools')}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-200">Police Outposts (2)</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.police}
                  onChange={() => toggleLayer('police')}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="font-medium text-slate-200">Active Shelters (1)</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeLayers.shelters}
                  onChange={() => toggleLayer('shelters')}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </Card>

          {/* Delineation Impact Statistics */}
          <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Calculated Impact
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Flood Inundation</span>
                <strong className="text-blue-400 font-bold">180.6 km²</strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Affected Population</span>
                <strong className="text-white font-bold">11,961 persons</strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Submerged Buildings</span>
                <strong className="text-amber-400 font-bold">70 structures</strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Road Network Status</span>
                <strong className="text-emerald-400 font-bold">Arteries Intact</strong>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Disaster Severity</span>
                <Badge variant="warning">MODERATE-HIGH</Badge>
              </div>
            </div>
          </Card>

          {/* Spatial Metadata */}
          <Card className="p-4 bg-slate-900/90 border-slate-800 text-xs space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Projection:</span>
              <span className="text-white font-mono">EPSG:4326 (WGS84)</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-white font-mono">10m Ground Pixel</span>
            </div>
            <div className="flex justify-between">
              <span>Polarization:</span>
              <span className="text-white font-mono">VV / VH Dual-Pol</span>
            </div>
          </Card>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-3">
          <GisMapView
            center={mapCenter}
            zoom={10}
            floodAreaKm2={180.6}
            className="h-[650px] w-full"
          />
        </div>
      </div>
    </div>
  );
};
