/**
 * MapControls.tsx — Custom Leaflet controls for coordinates, zoom, and basemap selection.
 */

import React from 'react';
import { Compass, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleFullscreen?: () => void;
  activeBasemap: 'dark' | 'osm' | 'satellite';
  onBasemapChange: (basemap: 'dark' | 'osm' | 'satellite') => void;
  mouseCoords?: { lat: number; lng: number };
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleFullscreen,
  activeBasemap,
  onBasemapChange,
  mouseCoords,
}) => {
  return (
    <>
      {/* Top Right: Basemap Selector */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md">
        <button
          onClick={() => onBasemapChange('dark')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeBasemap === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => onBasemapChange('satellite')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeBasemap === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => onBasemapChange('osm')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeBasemap === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          OSM
        </button>
      </div>

      {/* Top Left: Navigation Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur-md">
        <button
          onClick={onZoomIn}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={onResetView}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-t border-slate-800"
          title="Reset AOI Center"
        >
          <Compass className="h-4 w-4 text-blue-400" />
        </button>
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Bottom Left: Mouse Coordinates Badge */}
      <div className="absolute bottom-6 left-6 z-[1000] rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 shadow-lg backdrop-blur-md text-[11px] text-slate-300 flex items-center gap-3">
        <span className="font-mono">
          Lat: <strong className="text-white">{mouseCoords?.lat.toFixed(4) || '26.6500'}°N</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="font-mono">
          Lng: <strong className="text-white">{mouseCoords?.lng.toFixed(4) || '87.1000'}°E</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-blue-400 font-semibold">EPSG:4326</span>
      </div>
    </>
  );
};
