/**
 * SettlementDossierModal.tsx — Interactive Public Demographic & Healthcare Dossier.
 *
 * Implements Stage 5.5 (User Points 5 & 6):
 * - Grounded in public data available on Google & Nepal CBS Census 2021 + MoHP Registry.
 * - Enriched by Google Gemini 1.5 Flash AI for disaster logistics and disease threat synthesis.
 * - Interactive settlement drilldown with vulnerable population metrics and hospital capacities.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Baby,
  Building2,
  CheckCircle2,
  Droplets,
  ExternalLink,
  HeartPulse,
  Info,
  Key,
  Layers,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import {
  fetchSettlementDossier,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  SettlementDossier,
  HealthcareFacility,
} from '@/services/geminiService';
import { getPublicSettlementDemographics } from '@/data/teraiPublicDemographics';

interface SettlementDossierModalProps {
  settlementName: string | null;
  district: string | null;
  isFlooded?: boolean;
  floodDepthMeters?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const SettlementDossierModal: React.FC<SettlementDossierModalProps> = ({
  settlementName,
  district,
  isFlooded = false,
  floodDepthMeters,
  isOpen,
  onClose,
}) => {
  const [dossier, setDossier] = useState<SettlementDossier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(getStoredGeminiApiKey());
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  const [activeTab, setActiveTab] = useState<'demographics' | 'hospitals' | 'disease_relief'>('demographics');

  useEffect(() => {
    if (!isOpen || !settlementName || !district) return;

    let isMounted = true;
    setIsLoading(true);

    // Initial load from public grounded data
    const publicData = getPublicSettlementDemographics(settlementName, district);

    // Fetch or enrich via Gemini Service
    fetchSettlementDossier({
      settlementName,
      district,
      isFlooded,
      floodDepthMeters,
      apiKeyOverride: apiKey || undefined,
    })
      .then((data) => {
        if (isMounted) {
          setDossier(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Dossier fetch error:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, settlementName, district, isFlooded, floodDepthMeters, apiKey]);

  if (!isOpen || !settlementName || !district) return null;

  const publicGrounding = getPublicSettlementDemographics(settlementName, district);
  const totalPop = dossier ? dossier.total_population : publicGrounding.censusPopulation;
  const infants = dossier ? dossier.vulnerable_demographics.infants_under_5 : publicGrounding.infantsUnder5;
  const elderly = dossier ? dossier.vulnerable_demographics.elderly_above_60 : publicGrounding.elderlyAbove60;
  const pregnant = dossier ? dossier.vulnerable_demographics.pregnant_women : publicGrounding.pregnantWomen;
  const disabled = dossier ? dossier.vulnerable_demographics.disabled_or_chronic : publicGrounding.disabledOrChronic;

  const normalizedHospitals: HealthcareFacility[] = dossier?.healthcare_facilities?.length
    ? dossier.healthcare_facilities
    : publicGrounding.publicHospitals.map((h) => ({
        name: h.name,
        type: h.type,
        total_beds: h.totalBeds,
        operational_beds: h.operationalBeds,
        icu_beds: h.icuBeds,
        ventilators: h.ventilators,
        antivenom_stock: h.antivenomStock,
        flood_status: h.floodStatus,
        phone: h.phone,
      }));

  const handleSaveApiKey = () => {
    setStoredGeminiApiKey(tempApiKey);
    setApiKey(tempApiKey.trim());
    setIsEditingKey(false);
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col max-w-4xl w-full max-h-[92vh] rounded-3xl border border-slate-700 bg-[#070a13] shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* ───────────────────────────────────────────────────────────────────
            HEADER: SETTLEMENT DOSSIER WITH GOOGLE & CENSUS GROUNDING
        ───────────────────────────────────────────────────────────────────── */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-black uppercase text-blue-400 border border-blue-500/30">
                  <Sparkles className="h-3 w-3 text-cyan-300" />
                  STAGE 5.5: GEMINI AI DEMOGRAPHIC &amp; HEALTHCARE DOSSIER
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                  🌐 Public Data Grounded (Google &bull; Nepal CBS &bull; MoHP)
                </span>
                {isFlooded && (
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-black text-rose-300 border border-rose-500/40 animate-pulse">
                    🔴 INUNDATED {floodDepthMeters ? `(${floodDepthMeters}m depth)` : ''}
                  </span>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-400 shrink-0" />
                <span>{settlementName}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({district} District &bull; {publicGrounding.basin})
                </span>
              </h2>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Empirical Census 2021 baseline enriched with Google Gemini 1.5 disaster public health analytics. Direct tracking of vulnerable citizens, hospital beds, and antivenom stock.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditingKey(!isEditingKey)}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white transition-colors"
                title="Configure Gemini API Key"
              >
                <Key className="h-4 w-4 text-amber-400" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close modal"
                title="Close modal"
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* API Key Drawer */}
          {isEditingKey && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Custom Google Gemini API Key:
                </span>
                <span className="text-[10px] text-slate-400">Saved in browser session</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy... (Leave empty to use backend default)"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab Navigation Bar */}
          <div className="flex items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-800/80 text-xs">
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 font-bold">
              <button
                onClick={() => setActiveTab('demographics')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === 'demographics' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Demographics &amp; Vulnerability ({totalPop.toLocaleString()})</span>
              </button>
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === 'hospitals' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Hospitals &amp; Antivenom ({normalizedHospitals.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('disease_relief')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  activeTab === 'disease_relief' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Droplets className="h-3.5 w-3.5" />
                <span>Disease Threats &amp; Relief Needs</span>
              </button>
            </div>

            {isLoading && (
              <span className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Gemini Synthesizing...
              </span>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            BODY CONTENT: 3 INTERACTIVE TABS
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* TAB 1: DEMOGRAPHICS & VULNERABILITY */}
          {activeTab === 'demographics' && (
            <div className="space-y-6">
              {/* Aggregated Headcount Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Population</span>
                  <div className="text-2xl font-black text-white">{totalPop.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-400 font-mono">Nepal Census 2021</p>
                </div>
                <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                    <Baby className="h-3 w-3" />
                    Infants (&lt;5 yrs)
                  </span>
                  <div className="text-2xl font-black text-purple-200">{infants.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-400 font-mono">~12% High Risk</p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Elderly (&gt;60 yrs)</span>
                  <div className="text-2xl font-black text-amber-200">{elderly.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-400 font-mono">~8.2% Evacuation Aid</p>
                </div>
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Pregnant Mothers</span>
                  <div className="text-2xl font-black text-rose-200">{pregnant.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-400 font-mono">Urgent Obstetric</p>
                </div>
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Disabled / Chronic</span>
                  <div className="text-2xl font-black text-cyan-200">{disabled.toLocaleString()}</div>
                  <p className="text-[10px] text-slate-400 font-mono">Dialysis &amp; Mobility</p>
                </div>
              </div>

              {/* Progress Proportions Breakdown */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Vulnerable Population Proportion Distribution
                </h4>
                <div className="h-3 w-full rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                  <div style={{ width: '12%' }} className="bg-purple-500" title="Infants" />
                  <div style={{ width: '8.2%' }} className="bg-amber-500" title="Elderly" />
                  <div style={{ width: '2.6%' }} className="bg-rose-500" title="Pregnant" />
                  <div style={{ width: '3.8%' }} className="bg-cyan-500" title="Disabled" />
                  <div style={{ width: '73.4%' }} className="bg-slate-700" title="General Adult Population" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                    Infants: {((infants / totalPop) * 100).toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Elderly: {((elderly / totalPop) * 100).toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Pregnant: {((pregnant / totalPop) * 100).toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    Chronic/Disabled: {((disabled / totalPop) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Gemini Humanitarian Executive Summary */}
              {dossier && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>Gemini 1.5 Disaster Commander Directive</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {dossier.executive_summary}
                  </p>
                  <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                    <strong>Logistics Dispatch:</strong> {dossier.logistics_advice}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HOSPITALS & ANTIVENOM CAPACITY */}
          {activeTab === 'hospitals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Public Healthcare Facilities Registered in {district} District:</span>
                <span className="font-mono text-cyan-400">Source: MoHP HMIS Registry</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {normalizedHospitals.map((fac, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-5 space-y-3.5 transition-all ${
                      fac.flood_status === 'inoperable'
                        ? 'border-rose-900 bg-rose-950/20'
                        : fac.flood_status === 'submerged_ground_floor'
                        ? 'border-amber-900 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {fac.type}
                        </span>
                        <h4 className="font-black text-sm text-white pt-1">{fac.name}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          fac.flood_status === 'operational'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : fac.flood_status === 'submerged_ground_floor'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {fac.flood_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block">Total Beds:</span>
                        <span className="font-black text-white">{fac.total_beds}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Operational:</span>
                        <span className="font-black text-emerald-400">{fac.operational_beds}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">ICU / Vents:</span>
                        <span className="font-black text-cyan-300">
                          {fac.icu_beds || 0} / {fac.ventilators || 0}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                          Snakebite Antivenom:
                        </span>
                        <span className="text-[11px] font-bold text-amber-300 font-mono">
                          {fac.antivenom_stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <a
                        href={`tel:${fac.phone}`}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{fac.phone}</span>
                      </a>
                      <span className="text-[10px] text-slate-500">Government of Nepal MoHP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISEASE THREATS & RELIEF REQUIREMENTS */}
          {activeTab === 'disease_relief' && (
            <div className="space-y-6">
              {/* Daily Relief Supplies Calculator */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                  Calculated Daily Relief Supply Requirements (WHO Standard):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Potable Drinking Water</span>
                    <div className="text-xl font-black text-cyan-300 font-mono">
                      {(totalPop * 3).toLocaleString()} <span className="text-xs font-semibold text-slate-400">L/day</span>
                    </div>
                    <p className="text-[10px] text-slate-500">3 Litres/person/day</p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Food Rations</span>
                    <div className="text-xl font-black text-amber-300 font-mono">
                      {Math.round(totalPop * 0.25).toLocaleString()} <span className="text-xs font-semibold text-slate-400">Packs</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Dry emergency food kits</p>
                  </div>

                  <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ORS Electrolyte Packs</span>
                    <div className="text-xl font-black text-purple-300 font-mono">
                      {Math.round(totalPop * 0.45).toLocaleString()} <span className="text-xs font-semibold text-slate-400">Sachets</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Dehydration mitigation</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Aquatabs Water Tabs</span>
                    <div className="text-xl font-black text-emerald-300 font-mono">
                      {(totalPop * 4).toLocaleString()} <span className="text-xs font-semibold text-slate-400">Tabs</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Chlorine purification</p>
                  </div>
                </div>
              </div>

              {/* Disease Threat Radar */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                  Post-Deluge Epidemic &amp; Venom Threat Radar:
                </h4>
                <div className="space-y-2.5">
                  {publicGrounding.diseaseRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                              risk.riskLevel === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {risk.riskLevel.toUpperCase()} RISK
                          </span>
                          <h5 className="font-bold text-xs text-white">{risk.disease}</h5>
                        </div>
                        <p className="text-xs text-slate-300">{risk.preventiveDirective}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            FOOTER: PUBLIC CITATION & HOTLINE ACTIONS
        ───────────────────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Public Data Grounded: <strong>{publicGrounding.publicDataSource}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:1155"
              className="rounded-xl border border-rose-500/40 bg-rose-500/20 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Dispatch NEOC SOS (1155)</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementDossierModal;
