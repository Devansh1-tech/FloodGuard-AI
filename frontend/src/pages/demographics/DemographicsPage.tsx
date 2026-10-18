/**
 * DemographicsPage.tsx — Nepal Terai Population Exposure & Demographics.
 *
 * Visualizes real empirical demographic exposure derived from the
 * WorldPop 100m raster dataset (npl_pop_2026_CN_100m_R2025A_v1.tif):
 * - Headcount at risk per district.
 * - Inundated land area (km²) per district.
 * - Hospital facilities and shelter availability.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  Shield,
  TrendingDown,
  Users,
  Waves,
} from 'lucide-react';
import { TERAI_DISTRICT_STATS, DistrictDemographics } from '@/data/teraiInfrastructure';

export const DemographicsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('all');

  const filteredDistricts = TERAI_DISTRICT_STATS.filter((d) => {
    const matchesSearch = d.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBasin = selectedBasin === 'all' || d.basin === selectedBasin;
    return matchesSearch && matchesBasin;
  });

  const totalPop = TERAI_DISTRICT_STATS.reduce((acc, d) => acc + d.totalPopulation, 0);
  const totalAtRisk = TERAI_DISTRICT_STATS.reduce((acc, d) => acc + d.atRiskPopulation, 0);
  const totalFloodArea = TERAI_DISTRICT_STATS.reduce((acc, d) => acc + d.inundatedAreaKm2, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              WORLDPOP 100M RASTER DEMOGRAPHICS
            </span>
            <span className="text-xs text-slate-400">Nepal Terai Lowland Population Baseline</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-400" />
            Population Exposure &amp; Vulnerability Directory
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Empirical population headcounts, displaced citizen projections, and flooded surface area across all Terai districts.
          </p>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            Total Terai Population
          </span>
          <div className="text-2xl font-black text-white">{totalPop.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Citizens across southern plain districts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            Population in Flood Hazard Zone
          </span>
          <div className="text-2xl font-black text-rose-400">{totalAtRisk.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Residents within active 250m river corridors</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            Total Inundated Surface Area
          </span>
          <div className="text-2xl font-black text-cyan-400">{totalFloodArea.toFixed(1)} km²</div>
          <p className="text-[11px] text-slate-400">Delineated via Sentinel-1 SAR change detection</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district name..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={selectedBasin}
          onChange={(e) => setSelectedBasin(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
        >
          <option value="all">All River Basins</option>
          <option value="Eastern Terai">Eastern Terai</option>
          <option value="Central Terai">Central Terai</option>
          <option value="Western Terai">Western Terai</option>
          <option value="Far-Western Terai">Far-Western Terai</option>
        </select>
      </div>

      {/* District Exposure Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3">District</th>
                <th className="px-5 py-3">Basin</th>
                <th className="px-5 py-3 text-right">Total Population</th>
                <th className="px-5 py-3 text-right">Population at Risk</th>
                <th className="px-5 py-3 text-right">Flooded Area (km²)</th>
                <th className="px-5 py-3 text-right">Hospitals</th>
                <th className="px-5 py-3 text-right">Safe Havens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredDistricts.map((d) => (
                <tr key={d.district} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 font-bold text-white flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    {d.district}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{d.basin}</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-300">
                    {d.totalPopulation.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-rose-400">
                    {d.atRiskPopulation.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-cyan-400 font-bold">
                    {d.inundatedAreaKm2} km²
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-blue-300">
                    {d.hospitalsCount}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-emerald-400">
                    {d.sheltersCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
