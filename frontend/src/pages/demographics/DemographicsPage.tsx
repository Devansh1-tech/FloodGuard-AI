import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  HeartPulse,
  MapPin,
  Search,
  Shield,
  Sparkles,
  TrendingDown,
  Users,
  Waves,
} from 'lucide-react';
import { TERAI_DISTRICT_STATS, DistrictDemographics } from '@/data/teraiInfrastructure';
import { TERAI_PUBLIC_SETTLEMENTS } from '@/data/teraiPublicDemographics';
import { SettlementDossierModal } from '@/components/intelligence/SettlementDossierModal';

export const DemographicsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('all');
  const [activeDossierTarget, setActiveDossierTarget] = useState<{
    name: string;
    district: string;
    isFlooded?: boolean;
    floodDepthMeters?: number;
  } | null>(null);

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
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              STAGE 5.5: PUBLIC DEMOGRAPHIC &amp; HEALTHCARE INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400">
              Grounded in Public Data Available on Google &bull; Nepal CBS Census 2021 &bull; MoHP
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-400" />
            Population Exposure &amp; Healthcare Vulnerability Directory
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Verified public census numbers, vulnerable group headcounts, hospital bed capacities, and Gemini 1.5 disaster synthesis across all 21 Terai districts.
          </p>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            Total Terai Census Population
          </span>
          <div className="text-2xl font-black text-white">{totalPop.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Nepal Census 2021 (53.6% of national headcount)</p>
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

      {/* ───────────────────────────────────────────────────────────────────
          STAGE 5.5: PUBLIC GROUNDED SETTLEMENT DOSSIER QUICK-INSPECT STRIP
      ───────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>Public Settlement Demographic &amp; Hospital Dossier Launcher</span>
            </h3>
            <p className="text-xs text-slate-300">
              Query publicly available census headcounts and local hospital ICU/bed capacity for major flood-impacted settlements:
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
            Google Gemini 1.5 Flash Grounded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {Object.values(TERAI_PUBLIC_SETTLEMENTS).map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setActiveDossierTarget({
                  name: item.name,
                  district: item.district,
                  isFlooded: item.isFlooded,
                  floodDepthMeters: item.waterDepthMeters,
                })
              }
              className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                item.isFlooded
                  ? 'border-rose-500/40 bg-rose-950/30 hover:border-rose-400'
                  : 'border-slate-800 bg-slate-950/80 hover:border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">{item.name.split(' ')[0]}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.isFlooded ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'}`}>
                  {item.isFlooded ? 'FLOODED' : 'SAFE'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{item.district} District</div>
              <div className="text-[11px] font-mono text-cyan-300 font-bold mt-0.5">
                {item.censusPopulation.toLocaleString()} citizens
              </div>
            </button>
          ))}
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
                <th className="px-5 py-3 text-right">AI Dossier</th>
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
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() =>
                        setActiveDossierTarget({
                          name: `${d.district} District Center`,
                          district: d.district,
                          isFlooded: d.inundatedAreaKm2 > 30,
                          floodDepthMeters: d.inundatedAreaKm2 > 30 ? 1.5 : undefined,
                        })
                      }
                      className="rounded-lg bg-blue-600/30 border border-blue-500/40 px-2.5 py-1 text-[11px] font-bold text-blue-200 hover:bg-blue-600/50 transition-colors inline-flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-300" />
                      <span>Gemini Dossier</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Dossier Modal */}
      <SettlementDossierModal
        settlementName={activeDossierTarget?.name || null}
        district={activeDossierTarget?.district || null}
        isFlooded={activeDossierTarget?.isFlooded}
        floodDepthMeters={activeDossierTarget?.floodDepthMeters}
        isOpen={Boolean(activeDossierTarget)}
        onClose={() => setActiveDossierTarget(null)}
      />
    </div>
  );
};

export default DemographicsPage;

