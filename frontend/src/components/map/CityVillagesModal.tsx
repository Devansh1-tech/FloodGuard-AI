/**
 * CityVillagesModal.tsx — Interactive Village & Town Inspector for Nepal Terai Cities.
 *
 * When a government officer clicks any city color point on either map,
 * this modal/drawer presents the full directory of villages, towns, wards,
 * inundation water depths, and safe shelters with instant search and filtering.
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cross,
  Compass,
  ExternalLink,
  Filter,
  HeartPulse,
  Info,
  MapPin,
  Navigation,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { TeraiCityData, VillageTownItem } from '@/data/teraiCitiesData';
import { SettlementDossierModal } from '@/components/intelligence/SettlementDossierModal';

interface CityVillagesModalProps {
  city: TeraiCityData | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusVillage?: (village: VillageTownItem) => void;
}

export const CityVillagesModal: React.FC<CityVillagesModalProps> = ({
  city,
  isOpen,
  onClose,
  onFocusVillage,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'flooded' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDossierVillage, setSelectedDossierVillage] = useState<VillageTownItem | null>(null);

  if (!isOpen || !city) return null;

  const filteredVillages = city.villagesAndTowns.filter((item) => {
    if (filterMode === 'flooded' && !item.isFlooded) return false;
    if (filterMode === 'safe' && item.isFlooded) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.localName && item.localName.toLowerCase().includes(q)) ||
        item.type.toLowerCase().includes(q) ||
        item.recommendedAction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const floodedCount = city.villagesAndTowns.filter((v) => v.isFlooded).length;
  const safeCount = city.villagesAndTowns.filter((v) => !v.isFlooded).length;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col max-w-3xl w-full max-h-[92vh] rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden font-sans">
        {/* Header with City Dossier */}
        <div
          className="border-b border-slate-800 p-5 md:p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, ${city.color}15 100%)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-wide uppercase border"
                  style={{
                    backgroundColor: `${city.color}25`,
                    borderColor: `${city.color}60`,
                    color: city.color,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full animate-ping"
                    style={{ backgroundColor: city.color }}
                  />
                  {city.status.toUpperCase()} ZONE
                </span>
                <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300 font-medium border border-slate-700">
                  {city.district} District
                </span>
                <span className="rounded bg-blue-950/80 px-2 py-0.5 text-xs text-blue-300 font-medium border border-blue-800">
                  {city.basin}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>{city.name}</span>
                <span className="text-sm font-normal text-slate-400">({city.nepaliName})</span>
              </h2>

              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {city.statusText}. Major rivers monitored:{' '}
                <strong className="text-cyan-300">{city.majorRivers.join(', ')}</strong>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
              title="Close Inspector"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-3 border-t border-slate-800/80 text-xs">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">Inundated Land</span>
              <span className="text-sm font-black text-cyan-400 font-mono">
                {city.inundatedAreaKm2} km²
              </span>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">Total Population</span>
              <span className="text-sm font-black text-white font-mono">
                {city.totalPopulation.toLocaleString()}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">At Risk Citizens</span>
              <span className="text-sm font-black text-rose-400 font-mono">
                {city.affectedPopulation.toLocaleString()}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">Villages &amp; Hubs</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {city.villagesAndTowns.length} Cataloged
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60 px-5 py-3 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({city.villagesAndTowns.length})
            </button>
            <button
              onClick={() => setFilterMode('flooded')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold transition-all ${
                filterMode === 'flooded'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              <Waves className="h-3 w-3" />
              <span>Flooded ({floodedCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('safe')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold transition-all ${
                filterMode === 'safe'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Safe ({safeCount})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter village or town..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Scrollable Village & Town Directory */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-slate-950/40">
          {filteredVillages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Info className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold">No villages or towns found matching filter.</p>
            </div>
          ) : (
            filteredVillages.map((item) => {
              const isFlooded = item.isFlooded;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition-all duration-150 ${
                    isFlooded
                      ? 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/60'
                      : 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isFlooded ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                          }`}
                        />
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-400 border border-slate-700">
                          {item.type}
                        </span>
                        {item.floodDepthMeters && (
                          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-300 border border-rose-500/30 font-mono">
                            🌊 Depth: {item.floodDepthMeters}m
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.recommendedAction}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Users className="h-3 w-3 text-purple-400" />
                          Pop: <strong>{item.population.toLocaleString()}</strong>
                        </span>
                        {item.nearestShelter && (
                          <span className="flex items-center gap-1 text-emerald-300">
                            <Shield className="h-3 w-3 text-emerald-400" />
                            Shelter: <strong>{item.nearestShelter}</strong>
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500">
                          [{item.coords[0].toFixed(2)}°N, {item.coords[1].toFixed(2)}°E]
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedDossierVillage(item)}
                        className="flex items-center gap-1 rounded-xl border border-blue-500/40 bg-blue-600/20 px-2.5 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-600/40 transition-all active:scale-95 shadow-sm"
                        title="Inspect Public Demographics & Hospitals (Gemini AI)"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                        <span>Gemini Dossier</span>
                      </button>

                      {onFocusVillage && (
                        <button
                          onClick={() => {
                            onFocusVillage(item);
                            onClose();
                          }}
                          className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                            isFlooded
                              ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/30'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                          }`}
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Pinpoint</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>National Emergency Operations Center (NEOC 1155) Verified Directory</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Stage 5.5 Gemini AI Demographic & Healthcare Dossier Modal */}
      <SettlementDossierModal
        settlementName={selectedDossierVillage?.name || null}
        district={city.district}
        isFlooded={selectedDossierVillage?.isFlooded}
        floodDepthMeters={selectedDossierVillage?.floodDepthMeters}
        isOpen={Boolean(selectedDossierVillage)}
        onClose={() => setSelectedDossierVillage(null)}
      />
    </div>
  );
};
