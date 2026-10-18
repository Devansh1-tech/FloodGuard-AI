/**
 * SitRepDocument.tsx — Standardized Nepal Government Disaster Situation Report (SitRep).
 *
 * Implements Stage 5.8:
 * - Formatted for print/export to standard A4 page layouts with official seal styling.
 * - Follows NDRRMA / UN-SPIDER 5-Section Disaster Management reporting structure.
 * - Aggregates live telemetry from Sentinel-1 SAR, Google Maps layers, MoHP hospitals, and routing engines.
 */

import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Cross,
  Droplet,
  FileText,
  HeartPulse,
  Layers,
  MapPin,
  Phone,
  Plane,
  Radio,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tent,
  Truck,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import { SitRepData } from '@/services/sitrepGenerator';

interface SitRepDocumentProps {
  sitrep: SitRepData;
}

export const SitRepDocument: React.FC<SitRepDocumentProps> = ({ sitrep }) => {
  const exec = sitrep.executiveSummary;
  const sat = sitrep.satelliteRadarData;
  const infra = sitrep.infrastructureDisruptions;
  const med = sitrep.healthcareReadiness;
  const act = sitrep.actionDirectives;

  return (
    <div className="sitrep-paper bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto border border-slate-200 font-sans print:p-0 print:border-none print:shadow-none print:max-w-none">
      {/* ─────────────────────────────────────────────────────────────────────
          OFFICIAL NEPAL GOVERNMENT HEADER
      ─────────────────────────────────────────────────────────────────────── */}
      <header className="border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Government Crest Badge */}
            <div className="h-14 w-14 rounded-full bg-rose-700 text-white flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-md">
              <Shield className="h-6 w-6 text-amber-300" />
              <span className="text-[8px] font-black tracking-widest mt-0.5">NEPAL</span>
            </div>

            <div>
              <div className="text-[11px] font-black tracking-wider text-rose-700 uppercase">
                Government of Nepal &bull; Ministry of Home Affairs (MoHA)
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                National Disaster Risk Reduction &amp; Management Authority (NDRRMA)
              </h1>
              <div className="text-xs text-slate-600 font-medium">
                National Emergency Operations Centre (NEOC) &bull; Singha Durbar, Kathmandu
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block rounded bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 tracking-wider uppercase shadow-sm">
              NATIONAL ALERT: {sitrep.alertLevel}
            </span>
            <div className="font-mono text-xs font-bold text-slate-900 mt-1">
              {sitrep.reportNumber}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {sitrep.issueDateTime}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
          <div>
            <strong>Reporting Window:</strong> {sitrep.reportingPeriod}
          </div>
          <div>
            <strong>Geographic Operational Scope:</strong> {sitrep.scope}
          </div>
        </div>
      </header>

      <div className="space-y-6 text-xs leading-relaxed text-slate-800">
        {/* ───────────────────────────────────────────────────────────────────
            SECTION 1: EXECUTIVE OVERVIEW
        ───────────────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center justify-between">
            <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>1.0</span> Executive Disaster Summary &amp; Human Toll
            </h2>
            <span className="text-[10px] text-cyan-300 font-mono">
              21 Districts &bull; 642.8 km² Inundated
            </span>
          </div>

          <p className="text-slate-700 text-justify">
            Over the preceding 72 hours, unprecedented monsoonal precipitation across the Chure and Mahabharat ranges has triggered severe hydrological overflow and flash flooding throughout the 21 districts of the southern Nepal Terai plain. Saptakoshi river discharge peaked past 462,000 cusecs, forcing all 56 barrage sluices open. Raging waters breached the Lalbakeya and Bakraha river dykes, severely cutting off Gaur and rural border settlements.
          </p>

          {/* Stat Capsules */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Flooded Area</span>
              <span className="text-xl font-black text-cyan-700 font-mono">{exec.totalFloodedAreaKm2} km²</span>
              <span className="text-[9px] text-slate-500 block">Otsu SAR Threshold</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Population Affected</span>
              <span className="text-xl font-black text-purple-700 font-mono">{(exec.estimatedAffectedPopulation / 1000000).toFixed(2)}M</span>
              <span className="text-[9px] text-slate-500 block">Census 2021 Grounded</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Displaced Evacuees</span>
              <span className="text-xl font-black text-rose-700 font-mono">{exec.displacedEvacuees.toLocaleString()}</span>
              <span className="text-[9px] text-slate-500 block">Requiring Relief Quota</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Isolated by Breaches</span>
              <span className="text-xl font-black text-amber-700 font-mono">{exec.isolatedPopulation.toLocaleString()}</span>
              <span className="text-[9px] text-slate-500 block">Zero Road Transit</span>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 2: SATELLITE RADAR DELUGE QUANTIFICATION
        ───────────────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center justify-between">
            <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>2.0</span> Copernicus Sentinel-1 SAR Microwave Radar Inundation Audit
            </h2>
            <span className="text-[10px] text-emerald-300 font-mono">
              Sensor: C-SAR Bimodal Otsu (-15.2 dB)
            </span>
          </div>

          <p className="text-slate-700 text-justify">
            Cloud-penetrating radar backscatter change detection confirms active deluge corridors across 11 major river basins. The VV/VH polarized radar signal indicates catastrophic standing water across agricultural paddy belts.
          </p>

          {/* Basins Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-2 px-3 font-bold">River Basin &amp; Monitored District Hubs</th>
                  <th className="py-2 px-3 font-bold text-right">Inundated Area (km²)</th>
                  <th className="py-2 px-3 font-bold text-right">Peak Water Depth (m)</th>
                  <th className="py-2 px-3 font-bold text-right">Paddy Crop Loss (Ha)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sat.severeBasins.map((basin, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{basin.basin}</td>
                    <td className="py-2 px-3 font-mono font-bold text-cyan-700 text-right">{basin.inundatedAreaKm2}</td>
                    <td className="py-2 px-3 font-mono font-bold text-rose-600 text-right">{basin.maxDepthMeters}m</td>
                    <td className="py-2 px-3 font-mono text-slate-700 text-right">{basin.paddyLossEstimatedHectares.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 3: TRANSPORTATION & BRIDGE VULNERABILITY AUDIT
        ───────────────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center justify-between">
            <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>3.0</span> Transportation Highway Network Cut-Offs &amp; River Barrages
            </h2>
            <span className="text-[10px] text-amber-300 font-mono">
              {infra.totalSubmergedHighwayKm} km Submerged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Cut-off Highways List */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-2">
              <h3 className="font-bold text-rose-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
                Submerged &amp; Severed Highway Arteries
              </h3>
              <div className="space-y-1.5">
                {infra.keyRoadBreaches.map((road, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-rose-100 shadow-sm">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                      <span>{road.roadName}</span>
                      <span className="text-rose-600 font-mono">{road.depthMeters}m Water</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">{road.clearanceAdvice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Bridges List */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Waves className="h-3.5 w-3.5 text-blue-600" />
                Critical River Barrages &amp; Highway Bridges
              </h3>
              <div className="space-y-1.5">
                {infra.bridgeStatuses.map((bridge, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">{bridge.bridgeName}</div>
                      <div className="text-[10px] text-slate-500">
                        {bridge.river} {bridge.dischargeCusecs ? `&bull; ${bridge.dischargeCusecs.toLocaleString()} cusecs` : ''}
                      </div>
                    </div>
                    <span className="rounded bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 text-[9px] font-black uppercase">
                      {bridge.trafficStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 4: HEALTHCARE READINESS & WHO RELIEF QUOTAS
        ───────────────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center justify-between">
            <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>4.0</span> Healthcare Infrastructure Triage &amp; WHO Relief Mandate
            </h2>
            <span className="text-[10px] text-emerald-300 font-mono">
              MoHP Registry &bull; {med.operationalHospitals}/{med.totalHospitalsMonitored} Hospitals Ready
            </span>
          </div>

          <p className="text-slate-700 text-justify">
            Grounding across the Nepal Census 2021 and Ministry of Health (MoHP) registries establishes emergency daily relief allocations for the 84,500 displaced evacuees in compliance with Sphere and WHO Humanitarian Standards:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono">
            <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-2 text-center">
              <span className="text-[9px] font-bold text-cyan-800 uppercase block font-sans">Potable Water</span>
              <span className="text-sm font-black text-cyan-900">{med.dailyPotableWaterQuotalLiters.toLocaleString()} L/day</span>
              <span className="text-[8px] text-cyan-700 block font-sans">3L / person / day</span>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-center">
              <span className="text-[9px] font-bold text-amber-800 uppercase block font-sans">Food Rations</span>
              <span className="text-sm font-black text-amber-900">{med.dailyFoodRationsQuotaKg.toLocaleString()} kg/day</span>
              <span className="text-[8px] text-amber-700 block font-sans">High-calorie rations</span>
            </div>
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-center">
              <span className="text-[9px] font-bold text-rose-800 uppercase block font-sans">Antivenom Vials</span>
              <span className="text-sm font-black text-rose-900">{med.antivenomVialsAvailable.toLocaleString()} vials</span>
              <span className="text-[8px] text-rose-700 block font-sans">Terai snakebite reserves</span>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-center">
              <span className="text-[9px] font-bold text-blue-800 uppercase block font-sans">Aquatabs Chlorine</span>
              <span className="text-sm font-black text-blue-900">{med.aquatabsChlorineQuota.toLocaleString()} tabs</span>
              <span className="text-[8px] text-blue-700 block font-sans">2 tabs / person / day</span>
            </div>
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-2 text-center">
              <span className="text-[9px] font-bold text-teal-800 uppercase block font-sans">IV Saline Bags</span>
              <span className="text-sm font-black text-teal-900">{med.ivSalineQuotaBags.toLocaleString()} bags</span>
              <span className="text-[8px] text-teal-700 block font-sans">Cholera triage</span>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 5: ACTION DIRECTIVES & COMMAND LOGISTICS
        ───────────────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center justify-between">
            <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>5.0</span> Recommended Action Directives: Convoys, Shelters &amp; HLZ
            </h2>
            <span className="text-[10px] text-purple-300 font-mono">
              Operations Order &bull; Immediate Execution
            </span>
          </div>

          {/* Designated High-Ground Safe Havens & Refugee Camps */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Tent className="h-3.5 w-3.5 text-blue-600" />
              Designated High-Ground Safe Havens &amp; Evacuation Camps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {act.primaryRefuges.slice(0, 3).map((haven, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                    <span className="truncate">{haven.havenName}</span>
                    <span className="text-emerald-700 font-mono text-[10px] shrink-0 font-bold">{haven.elevationMeters}m ASL</span>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    District: <strong>{haven.district}</strong> &bull; Cap: <strong>{haven.capacity.toLocaleString()}</strong>
                  </div>
                  <div className="text-[9px] text-slate-500 flex items-center justify-between pt-0.5 border-t border-slate-100">
                    <span className={haven.hasHelipad ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {haven.hasHelipad ? '🚁 HLZ Active' : 'No Helipad'}
                    </span>
                    <span className="font-mono text-blue-700 font-semibold">{haven.wardenContact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Priority Relief Convoys */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-emerald-600" />
                Priority Convoy Lifelines (Flood Avoidance Mode)
              </h3>
              <div className="space-y-1.5">
                {act.recommendedConvoys.map((convoy, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="font-bold text-slate-900 text-[11px]">{convoy.mission}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{convoy.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certified Military Helipads */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Plane className="h-3.5 w-3.5 text-purple-600" />
                Nepal Army Certified Rotary Landing Zones (HLZ)
              </h3>
              <div className="space-y-1.5">
                {act.helicopterDropZones.map((hlz, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                      <span>{hlz.name}</span>
                      <span className="text-purple-700 font-mono text-[10px]">{hlz.district}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {hlz.coordinates} &bull; {hlz.aircraftSupported}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SIGN-OFF & OFFICIAL STAMP BLOCK
      ─────────────────────────────────────────────────────────────────────── */}
      <footer className="mt-8 pt-6 border-t-2 border-slate-900 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Prepared &amp; Formatted By</span>
            <div className="font-bold text-slate-900">FloodGuard AI Geospatial Engine</div>
            <div className="text-[10px] text-slate-500">Copernicus Sentinel-1 SAR &bull; Google Maps Platform v3</div>
          </div>

          <div className="space-y-1 text-center">
            <div className="h-16 w-16 mx-auto border-2 border-dashed border-rose-400 rounded-full flex items-center justify-center text-[9px] text-rose-600 font-black uppercase text-center p-1 leading-tight">
              NEOC OFFICIAL SEAL
            </div>
            <span className="text-[9px] text-slate-400 block">Singha Durbar Disaster Command</span>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Approved For Dispatch</span>
            <div className="font-bold text-slate-900">National Disaster Executive Coordinator</div>
            <div className="text-[10px] text-slate-500">Ministry of Home Affairs (MoHA), Nepal</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
          <div>Emergency Hotlines: NEOC <strong>1155</strong> | Nepal Red Cross <strong>1130</strong> | APF <strong>1114</strong></div>
          <div>Strictly Localized: Nepal Terai Lowlands (Lat 26.20°N – 28.35°N)</div>
        </div>
      </footer>
    </div>
  );
};
