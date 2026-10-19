/**
 * RiverGaugeMap.tsx — Tactical Leaflet Hydrological Monitoring Map.
 *
 * Implements Stage 5.9:
 * - Real-time spatial plotting of all DHM hydrological monitoring stations across the 21 Terai districts.
 * - Dynamic color-coded markers (Red = Extreme/Danger, Amber = Warning, Green = Normal).
 * - Concentric ripple buffer rings around stations exceeding danger thresholds.
 * - Clickable popups with quick SOS broadcast launcher.
 */

import React, { useEffect } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { AlertOctagon, Radio, Waves } from 'lucide-react';
import { RiverGaugeStation } from '@/data/teraiRiverGauges';

// Map View Controller for auto bounds
const MapViewController: React.FC<{
  gauges: RiverGaugeStation[];
  selectedStation: RiverGaugeStation | null;
}> = ({ gauges, selectedStation }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedStation && typeof map?.flyTo === 'function') {
      map.flyTo(selectedStation.coords, 10, { duration: 1.0 });
    }
  }, [selectedStation, map]);

  useEffect(() => {
    if (!gauges || gauges.length === 0) {
      if (typeof map?.setView === 'function') {
        map.setView([27.5, 84.5], 7);
      }
    } else if (gauges.length === 1) {
      if (typeof map?.flyTo === 'function') {
        map.flyTo(gauges[0].coords, 10, { duration: 1.0 });
      }
    } else {
      if (typeof map?.fitBounds === 'function' && typeof L?.latLngBounds === 'function') {
        const bounds = L.latLngBounds(gauges.map((g) => g.coords));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11, duration: 1.0 });
      }
    }
  }, [gauges, map]);

  return null;
};

// Custom SVG Pin Generator
const createGaugePin = (station: RiverGaugeStation) => {
  const isDanger = station.status === 'danger' || station.status === 'extreme_flood';
  const isWarning = station.status === 'warning';

  const bgColor = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';
  const borderColor = isDanger ? '#B91C1C' : isWarning ? '#D97706' : '#047857';

  return L.divIcon({
    className: 'custom-gauge-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${
          isDanger
            ? `<div style="
                position: absolute;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: rgba(239, 68, 68, 0.45);
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>`
            : ''
        }
        <div style="
          background: ${bgColor};
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 14px ${bgColor}, 0 2px 6px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 900;
        ">
          ${isDanger ? '!' : '🌊'}
        </div>
        <div style="
          position: absolute;
          bottom: -16px;
          white-space: nowrap;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid ${borderColor};
          font-size: 8px;
          font-weight: 800;
          padding: 0 4px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        ">${station.currentLevelMeters.toFixed(1)}m</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

interface RiverGaugeMapProps {
  gauges: RiverGaugeStation[];
  selectedStation: RiverGaugeStation | null;
  onSelectStation: (station: RiverGaugeStation) => void;
  onOpenSosModal: (station: RiverGaugeStation) => void;
  language: 'en' | 'ne';
}

export const RiverGaugeMap: React.FC<RiverGaugeMapProps> = ({
  gauges,
  selectedStation,
  onSelectStation,
  onOpenSosModal,
  language,
}) => {
  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={[27.20, 84.80]}
        zoom={7}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        maxBounds={[
          [26.0, 79.5],
          [29.0, 88.5],
        ]}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; Nepal DHM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewController gauges={gauges} selectedStation={selectedStation} />

        {/* Render Concentric Danger Radius Buffers */}
        {gauges.map((station) => {
          const isDanger = station.status === 'danger' || station.status === 'extreme_flood';
          if (!isDanger) return null;

          return (
            <React.Fragment key={`buffer-${station.id}`}>
              <Circle
                center={station.coords}
                radius={8000} // 8km immediate ripple buffer
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 6',
                }}
              />
              <Circle
                center={station.coords}
                radius={16000} // 16km strategic alert buffer
                pathOptions={{
                  color: '#F97316',
                  fillColor: '#F97316',
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: '2, 6',
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Render Station Markers */}
        {gauges.map((station) => (
          <Marker
            key={station.id}
            position={station.coords}
            icon={createGaugePin(station)}
            eventHandlers={{
              click: () => onSelectStation(station),
            }}
          >
            <Popup className="custom-gauge-popup">
              <div className="p-1 space-y-2 max-w-xs text-slate-900 font-sans">
                <div className="border-b border-slate-200 pb-1.5">
                  <span className="font-mono text-[9px] font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">
                    {station.dhmStationNumber}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-1">
                    {language === 'ne' ? station.nepaliName : station.name}
                  </h4>
                  <div className="text-[10px] text-slate-600 font-semibold">
                    {language === 'ne' ? station.nepaliRiver : station.river} &bull; {station.district}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-50 p-1.5 rounded">
                  <div>
                    <span className="text-slate-500 block">Current Height:</span>
                    <strong className="text-rose-600 font-bold">{station.currentLevelMeters}m</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Danger Level:</span>
                    <strong className="text-slate-800">{station.dangerLevelMeters}m</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-500 block">Discharge Flow:</span>
                    <strong className="text-cyan-700">{station.dischargeCusecs.toLocaleString()} cusecs</strong>
                  </div>
                </div>

                <button
                  onClick={() => onOpenSosModal(station)}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-2 py-1.5 text-[10px] font-bold text-white shadow transition-all cursor-pointer"
                >
                  <Radio className="h-3 w-3" />
                  <span>{language === 'ne' ? 'आपतकालीन सूचना पठाउनुहोस्' : 'Broadcast SOS Alert'}</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-xl space-y-1.5">
        <span className="font-bold text-white block text-[10px] uppercase tracking-wider">
          {language === 'ne' ? 'जलसतह संकेतक' : 'River Water Level Status'}
        </span>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>{language === 'ne' ? 'खतरा विन्दु पार (Danger Breached)' : 'Danger Breached (> Danger Level)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
          <span>{language === 'ne' ? 'सतर्कता तह (Warning Watch)' : 'Warning Watch (> Warning Level)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
          <span>{language === 'ne' ? 'सामान्य बहाव (Normal Flow)' : 'Normal Flow'}</span>
        </div>
      </div>
    </div>
  );
};
