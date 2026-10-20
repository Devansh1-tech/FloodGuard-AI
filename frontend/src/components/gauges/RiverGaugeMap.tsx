/**
 * RiverGaugeMap.tsx — Tactical Leaflet Hydrological Monitoring Map.
 *
 * Implements Stage 5.9:
 * - Real-time spatial plotting of all DHM hydrological monitoring stations across the 21 Terai districts.
 * - Dynamic color-coded markers (Red = Extreme/Danger, Amber = Warning, Green = Normal).
 * - Concentric ripple buffer rings around stations exceeding danger thresholds.
 * - DOTTED OUTLINES for all River Basins across Nepal (dashArray: '8, 8').
 * - DOTTED POLYLINES for all Major Rivers (dashArray: '8, 8').
 * - Interactive Tap to inspect live-updating telemetry for any river.
 */

import React, { useEffect, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { AlertOctagon, Compass, Layers, Radio, Waves, Zap } from 'lucide-react';
import { RiverGaugeStation } from '@/data/teraiRiverGauges';
import {
  NEPAL_RIVER_BASINS,
  NEPAL_RIVERS,
  LiveRiverData,
  RiverBasinData,
  getRiverStatusColor,
  syncNepalRiversWithGauges,
} from '@/data/nepalRiverBasinsAndRivers';
import { LiveRiverTelemetryModal } from '@/components/gauges/LiveRiverTelemetryModal';

// Map View Controller for auto bounds
const MapViewController: React.FC<{
  gauges: RiverGaugeStation[];
  selectedStation: RiverGaugeStation | null;
  selectedRiverCoords: [number, number][] | null;
}> = ({ gauges, selectedStation, selectedRiverCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedRiverCoords && selectedRiverCoords.length > 0 && typeof map?.fitBounds === 'function') {
      const bounds = L.latLngBounds(selectedRiverCoords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 11, duration: 1.2 });
    } else if (selectedStation && typeof map?.flyTo === 'function') {
      map.flyTo(selectedStation.coords, 10, { duration: 1.0 });
    }
  }, [selectedStation, selectedRiverCoords, map]);

  useEffect(() => {
    if (selectedRiverCoords) return;
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
  }, [gauges, selectedRiverCoords, map]);

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
  // Layer controls
  const [showBasins, setShowBasins] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [activeRiver, setActiveRiver] = useState<LiveRiverData | null>(null);
  const [isRiverModalOpen, setIsRiverModalOpen] = useState<boolean>(false);
  const [riverFocusedCoords, setRiverFocusedCoords] = useState<[number, number][] | null>(null);

  // Synchronize river centerlines and telemetry dynamically with active DHM gauge data
  const syncedRivers = React.useMemo(() => {
    return syncNepalRiversWithGauges(NEPAL_RIVERS, gauges);
  }, [gauges]);

  const handleRiverTap = (river: LiveRiverData) => {
    setActiveRiver(river);
    setIsRiverModalOpen(true);
    setRiverFocusedCoords(river.coordinates);

    // Sync selected station if this river has a matching gauge
    const matchingStation = gauges.find(
      (g) =>
        g.river.toLowerCase().includes(river.name.toLowerCase()) ||
        river.name.toLowerCase().includes(g.river.toLowerCase())
    );
    if (matchingStation) {
      onSelectStation(matchingStation);
    }
  };

  const handleSosFromRiverModal = (river: LiveRiverData) => {
    // Find matching gauge or fabricate station object for SOS broadcast
    const matchingStation = gauges.find(
      (g) =>
        g.river.toLowerCase().includes(river.name.toLowerCase()) ||
        river.name.toLowerCase().includes(g.river.toLowerCase())
    );
    if (matchingStation) {
      onOpenSosModal(matchingStation);
    } else if (gauges.length > 0) {
      onOpenSosModal(gauges[0]);
    }
  };

  return (
    <div className="relative isolate z-10 w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* ─────────────────────────────────────────────────────────────────────
          TOP INTERACTIVE CONTROLS BAR (DOTTED BASINS & DOTTED RIVERS)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Toggle Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-xl">
          <button
            onClick={() => setShowBasins((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showBasins
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{language === 'ne' ? '⚡ बेसिनहरू (Dotted)' : '⚡ Basins (Dotted)'}</span>
          </button>

          <button
            onClick={() => setShowRivers((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showRivers
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-950/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Waves className="h-3.5 w-3.5" />
            <span>{language === 'ne' ? '🌊 नदीहरू (Dotted)' : '🌊 Rivers (Dotted)'}</span>
          </button>
        </div>

        {/* Informative Tap Indicator */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-xl animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>
            {language === 'ne'
              ? '💡 कुनै पनि नदी रेखामा ट्याप गरी प्रत्यक्ष विवरण हेर्नुहोस्'
              : '💡 Tap any dotted river line to inspect live telemetry updates'}
          </span>
        </div>
      </div>

      <MapContainer
        center={[27.20, 84.80]}
        zoom={7}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        maxBounds={[
          [26.0, 79.5],
          [29.5, 88.5],
        ]}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &amp; Nepal DHM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewController
          gauges={gauges}
          selectedStation={selectedStation}
          selectedRiverCoords={riverFocusedCoords}
        />

        {/* ───────────────────────────────────────────────────────────────────
            1. HIGHLIGHT ALL RIVER BASINS WITH DOTTED LINES (dashArray: '8, 8')
        ───────────────────────────────────────────────────────────────────── */}
        {showBasins &&
          NEPAL_RIVER_BASINS.map((basin: RiverBasinData) => (
            <Polygon
              key={basin.id}
              positions={basin.boundaryPolygon}
              pathOptions={{
                color: basin.color,
                weight: 2.2,
                dashArray: '8, 8', // CRISP DOTTED BOUNDARY LINE
                fillColor: basin.color,
                fillOpacity: 0.04,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Tooltip sticky direction="top" opacity={0.92}>
                <div className="p-1 font-sans text-slate-900 max-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: basin.color }}
                    ></span>
                    <strong className="text-xs font-bold text-slate-900">{basin.name}</strong>
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold">{basin.nepaliName}</div>
                  <div className="mt-1 text-[9px] font-mono text-slate-500 border-t border-slate-200 pt-1">
                    Catchment: <strong>{basin.catchmentAreaKm2.toLocaleString()} km&sup2;</strong> &bull; Avg Flow: {basin.averageAnnualDischargeM3s} m&sup3;/s
                  </div>
                  <div className="text-[9px] text-cyan-700 font-bold mt-0.5">
                    Rivers: {basin.keyRivers.join(', ')}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          ))}

        {/* ───────────────────────────────────────────────────────────────────
            2. HIGHLIGHT ALL RIVERS WITH DOTTED LINES & CLICK-FOR-LIVE-INFO
        ───────────────────────────────────────────────────────────────────── */}
        {showRivers &&
          syncedRivers.map((river: LiveRiverData) => {
            const isSelected = activeRiver?.id === river.id;
            const riverColor = getRiverStatusColor(river.status);

            return (
              <React.Fragment key={river.id}>
                {/* Visual Halo Underlayer for Maximum Contrast & Glowing Hover */}
                <Polyline
                  positions={river.coordinates}
                  pathOptions={{
                    color: isSelected ? '#00F2FE' : '#0F172A',
                    weight: isSelected ? 8 : 6,
                    opacity: isSelected ? 0.8 : 0.35,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                  eventHandlers={{
                    click: () => handleRiverTap(river),
                  }}
                />

                {/* Primary Luminous DOTTED River Line */}
                <Polyline
                  positions={river.coordinates}
                  pathOptions={{
                    color: isSelected ? '#FFFFFF' : riverColor,
                    weight: isSelected ? 4.5 : 3.5,
                    dashArray: '8, 8', // CRISP DOTTED RIVER LINE
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                  eventHandlers={{
                    click: () => handleRiverTap(river),
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.96}>
                    <div className="p-1 font-sans text-slate-900 min-w-[200px]">
                      <div className="flex items-center justify-between gap-1.5 border-b border-slate-200 pb-1">
                        <span className="font-bold text-xs text-slate-950 flex items-center gap-1">
                          <span>🌊</span>
                          <span>{language === 'ne' ? river.nepaliName : river.name}</span>
                        </span>
                        <span
                          className={`text-[8px] font-mono px-1 rounded font-bold uppercase text-white ${
                            river.status === 'extreme_flood' || river.status === 'danger'
                              ? 'bg-rose-600'
                              : 'bg-cyan-600'
                          }`}
                        >
                          {river.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono mt-1">
                        <div>
                          <span className="text-slate-400 block text-[9px]">Level:</span>
                          <strong className="text-rose-400 font-bold">{river.currentLevelMeters}m</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">Danger Mark:</span>
                          <strong className="text-amber-400 font-bold">{river.dangerLevelMeters}m</strong>
                        </div>
                        <div className="col-span-2 pt-0.5">
                          <span className="text-slate-400 block text-[9px]">Discharge:</span>
                          <strong className="text-cyan-400 font-bold">
                            {river.dischargeCusecs.toLocaleString()} cusecs
                          </strong>
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-700/80 text-[9px] font-bold text-cyan-400 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>
                          {language === 'ne'
                            ? 'प्रत्यक्ष विवरण हेर्न ट्याप गर्नुहोस्'
                            : 'Tap to inspect live telemetry updates'}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                </Polyline>
              </React.Fragment>
            );
          })}

        {/* ───────────────────────────────────────────────────────────────────
            3. CONCENTRIC DANGER RADIUS BUFFERS
        ───────────────────────────────────────────────────────────────────── */}
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

        {/* ───────────────────────────────────────────────────────────────────
            4. RENDER STATION MARKERS
        ───────────────────────────────────────────────────────────────────── */}
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
              <div className="p-1 space-y-2 max-w-xs text-white font-sans">
                <div className="border-b border-slate-700/80 pb-1.5">
                  <span className="font-mono text-[9px] font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                    DHM #{station.dhmStationNumber}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1">
                    {language === 'ne' ? station.nepaliName : station.name}
                  </h4>
                  <div className="text-[11px] text-cyan-400 font-medium">
                    {language === 'ne' ? station.nepaliRiver : station.river} &bull; {station.district} District
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-700/80">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Current Level:</span>
                    <strong className="text-rose-400 font-bold">{station.currentLevelMeters}m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Danger Mark:</span>
                    <strong className="text-amber-400 font-bold">{station.dangerLevelMeters}m</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-700/80">
                    <span className="text-slate-400 text-[10px] block">Discharge Flow:</span>
                    <strong className="text-cyan-400 font-bold">{station.dischargeCusecs.toLocaleString()} cusecs</strong>
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

      {/* ─────────────────────────────────────────────────────────────────────
          MAP LEGEND OVERLAY (HIGH-CONTRAST SOLID BACKDROP • CRISP VISIBILITY)
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        style={{ backgroundColor: '#090e1a' }}
        className="absolute bottom-4 left-4 z-[400] p-3.5 rounded-2xl border-2 border-slate-700/90 shadow-[0_12px_40px_rgba(0,0,0,0.9)] space-y-2 max-w-[290px] sm:max-w-xs select-none backdrop-blur-none"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-white font-extrabold text-[11px] uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>{language === 'ne' ? 'नक्सा संकेत (Map Legend)' : 'Hydrological Map Legend'}</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/40 px-1.5 py-0.5 rounded">
            DHM
          </span>
        </div>

        {/* Dotted River Basins & Rivers */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="w-6 h-0 border-b-[2.5px] border-dotted border-cyan-400 shrink-0"></span>
            <span className="font-bold text-cyan-300">
              {language === 'ne' ? 'नदी बेसिन (Dotted Basins)' : 'River Basins (Dotted)'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-0 border-b-[2.5px] border-dotted border-blue-400 shrink-0"></span>
              <span className="font-bold text-blue-300">
                {language === 'ne' ? 'नदी मार्ग (Dotted Rivers)' : 'Rivers (Dotted)'}
              </span>
            </div>
            <span className="text-[9px] font-mono font-semibold text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-1.5 py-0.5 rounded shadow-sm">
              Tap for Live
            </span>
          </div>
        </div>

        {/* Status Severity Badges with High Contrast */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="h-3 w-3 rounded-full bg-rose-500 ring-2 ring-rose-500/40 animate-pulse shrink-0"></span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-white">
                {language === 'ne' ? 'खतरा विन्दु पार' : 'Danger Breached'}
              </span>
              <span className="text-[10px] text-rose-300 font-mono font-bold">
                (&gt; Danger Level)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="h-3 w-3 rounded-full bg-amber-400 ring-2 ring-amber-400/40 shrink-0"></span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-white">
                {language === 'ne' ? 'सतर्कता तह' : 'Warning Watch'}
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                (&gt; Warning Level)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 shrink-0"></span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-white">
                {language === 'ne' ? 'सामान्य बहाव' : 'Normal Flow'}
              </span>
              <span className="text-[10px] text-emerald-300 font-mono font-bold">
                (Safe Flow)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          LIVE RIVER TELEMETRY MODAL / INSPECTOR (SLIDES IN ON RIVER TAP)
      ─────────────────────────────────────────────────────────────────────── */}
      <LiveRiverTelemetryModal
        river={activeRiver}
        isOpen={isRiverModalOpen}
        onClose={() => setIsRiverModalOpen(false)}
        language={language}
        onOpenSosModal={handleSosFromRiverModal}
        onFocusRiver={(r) => setRiverFocusedCoords(r.coordinates)}
      />
    </div>
  );
};
