/**
 * Stage57SafeHavensPage.tsx — Stage 5.7 Safe Haven & Refugee Camp Proximity Detector.
 *
 * Implements Point 8 of the Master Plan:
 * 1. Geospatial k-NN proximity engine scanning 5km - 40km around flooded Terai settlement centroids.
 * 2. Multi-criteria site suitability ranking (Elevation ASL, Concrete structural rating, WASH, HLZ Helipads).
 * 3. Interactive proximity map with concentric distance rings and radial egress vectors.
 * 4. Sphere Standards emergency refugee camp deployment simulator (Tents, Latrines, Water Bladders, Microgrids).
 */

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Droplet,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Gauge,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Plane,
  Printer,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Tent,
  Truck,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { SafeHavenFacility, TERAI_SAFE_HAVENS } from '@/data/teraiSafeHavens';
import {
  findNearbySafeHavens,
  calculateSphereCampRequirements,
  ProximityMatch,
  RefugeeCampManifest,
} from '@/services/teraiProximityEngine';
import { SafeHavenDetectorMap } from '@/components/havens/SafeHavenDetectorMap';

// Preset Flooded Settlements across the 21 Terai districts
interface FloodedSettlementPreset {
  id: string;
  name: string;
  nepaliName: string;
  district: string;
  corridor: string;
  coords: [number, number];
  elevationMeters: number;
  waterDepthMeters: number;
  displacedPopulation: number;
  breachCause: string;
}

const FLOODED_SETTLEMENT_PRESETS: FloodedSettlementPreset[] = [
  {
    id: 'settlement_gaur',
    name: 'Gaur District Headquarters & Border Wards',
    nepaliName: 'गौर जिल्ला सदरमुकाम तथा सीमावर्ती वडा',
    district: 'Rautahat',
    corridor: 'Lalbakeya & Bagmati Basin',
    coords: [26.7624, 85.2789],
    elevationMeters: 82,
    waterDepthMeters: 2.2,
    displacedPopulation: 18400,
    breachCause: 'Lalbakeya river embankment collapsed at Tikulia causeway; water depth 2.2m.',
  },
  {
    id: 'settlement_prakashpur',
    name: 'Prakashpur & Madhuban Koshi Buffer',
    nepaliName: 'प्रकाशपुर तथा मधुवन कोशी बफर क्षेत्र',
    district: 'Sunsari',
    corridor: 'Saptakoshi River Corridor',
    coords: [26.7412, 87.0521],
    elevationMeters: 68,
    waterDepthMeters: 1.4,
    displacedPopulation: 9600,
    breachCause: 'Saptakoshi eastern flood channel surged past rural dykes.',
  },
  {
    id: 'settlement_holiya',
    name: 'Holiya, Betahani & Fattepur Rapti Plain',
    nepaliName: 'होलिया, बेतहनी तथा फत्तेपुर राप्ती क्षेत्र',
    district: 'Banke',
    corridor: 'West Rapti Corridor',
    coords: [27.9512, 81.8214],
    elevationMeters: 122,
    waterDepthMeters: 1.7,
    displacedPopulation: 14800,
    breachCause: 'Laxmanpur Barrage backflow submerging southern Postal Highway.',
  },
  {
    id: 'settlement_bhajani',
    name: 'Bhajani Municipality & Lalbojhi Wards',
    nepaliName: 'भजनी नगरपालिका तथा लालबोझी क्षेत्र',
    district: 'Kailali',
    corridor: 'Mohana & Kandra Confluence',
    coords: [28.4512, 81.1214],
    elevationMeters: 98,
    waterDepthMeters: 1.9,
    displacedPopulation: 12200,
    breachCause: 'Confluence of Kandra and Mohana rivers flooding 18.2 km of Postal Highway.',
  },
  {
    id: 'settlement_hanumannagar',
    name: 'Hanumannagar Kankalini / Saptakoshi Plain',
    nepaliName: 'हनुमाननगर कङ्कालिनी / सप्तकोशी बाढी क्षेत्र',
    district: 'Saptari',
    corridor: 'Koshi Embankment Spur',
    coords: [26.5412, 86.8524],
    elevationMeters: 65,
    waterDepthMeters: 1.8,
    displacedPopulation: 11200,
    breachCause: 'Western canal dyke burst with discharge over 460,000 cusecs.',
  },
  {
    id: 'settlement_jaleshwar',
    name: 'Jaleshwar Sadar & Prison Compound',
    nepaliName: 'जलेश्वर सदरमुकाम तथा कारागार क्षेत्र',
    district: 'Mahottari',
    corridor: 'Rato River Basin',
    coords: [26.6452, 85.8012],
    elevationMeters: 74,
    waterDepthMeters: 1.5,
    displacedPopulation: 11500,
    breachCause: 'Rato and Jhanjh rivers overflow submerging municipal buildings.',
  },
];

export const Stage57SafeHavensPage: React.FC = () => {
  // Selected Flooded Settlement
  const [selectedSettlementId, setSelectedSettlementId] = useState<string>('settlement_gaur');
  const [scanRadiusKm, setScanRadiusKm] = useState<number>(30);
  const [minCapacityFilter, setMinCapacityFilter] = useState<number>(0);
  const [requiresHelipad, setRequiresHelipad] = useState<boolean>(false);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>('haven_rautahat_chandranigahapur');

  // Refugee Camp Deployment Simulator State
  const [targetEvacuees, setTargetEvacuees] = useState<number>(5000);
  const [showDeploymentModal, setShowDeploymentModal] = useState<boolean>(false);

  // Active settlement object
  const activeSettlement = useMemo(() => {
    return (
      FLOODED_SETTLEMENT_PRESETS.find((s) => s.id === selectedSettlementId) ||
      FLOODED_SETTLEMENT_PRESETS[0]
    );
  }, [selectedSettlementId]);

  // Compute nearby safe havens via Geospatial Proximity Engine
  const proximityMatches: ProximityMatch[] = useMemo(() => {
    return findNearbySafeHavens(
      activeSettlement.coords,
      activeSettlement.elevationMeters,
      scanRadiusKm,
      {
        minCapacity: minCapacityFilter > 0 ? minCapacityFilter : undefined,
        requiresHelipad: requiresHelipad || undefined,
      }
    );
  }, [activeSettlement, scanRadiusKm, minCapacityFilter, requiresHelipad]);

  // Selected Haven object
  const selectedHaven: SafeHavenFacility = useMemo(() => {
    if (selectedHavenId) {
      const match = proximityMatches.find((m) => m.haven.id === selectedHavenId);
      if (match) return match.haven;
      const direct = TERAI_SAFE_HAVENS.find((h) => h.id === selectedHavenId);
      if (direct) return direct;
    }
    return proximityMatches[0]?.haven || TERAI_SAFE_HAVENS[0];
  }, [selectedHavenId, proximityMatches]);

  // Compute Sphere Camp Manifest
  const campManifest: RefugeeCampManifest = useMemo(() => {
    return calculateSphereCampRequirements(targetEvacuees);
  }, [targetEvacuees]);

  // Handle selecting a safe haven
  const handleSelectHaven = (haven: SafeHavenFacility) => {
    setSelectedHavenId(haven.id);
  };

  // Quick stats across all monitored safe havens
  const totalMonitoredCapacity = TERAI_SAFE_HAVENS.reduce((sum, h) => sum + h.totalCapacity, 0);
  const totalHelipadsCount = TERAI_SAFE_HAVENS.filter((h) => h.hasHelipad).length;

  return (
    <div className="space-y-6 pb-16 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────────────
          PAGE HEADER & ARCHITECTURE BADGE
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              STAGE 5.7: SAFE HAVEN &amp; REFUGEE CAMP PROXIMITY DETECTOR
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              Point 8: Nearby Safe Area Detector
            </span>
            <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300 border border-cyan-500/30">
              Sphere Humanitarian Standards
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 flex items-center gap-2.5">
            <Tent className="h-7 w-7 text-emerald-400" />
            Terai Safe Haven &amp; Refugee Shelter Engine
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-4xl">
            Automatically scans a 5km to 40km radial perimeter around inundated settlements to locate flood-resistant, elevated terrain. Evaluates site suitability across elevation, structural concrete rating, WASH readiness, and Nepal Army helicopter landing zones (HLZ).
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowDeploymentModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all border border-emerald-400/30"
          >
            <Tent className="h-4 w-4" />
            Generate Sphere Camp Deployment Sheet
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SETTLEMENT SCANNER & PROXIMITY CONTROLS HUD
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Flooded Settlement Centroid Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Waves className="h-3 w-3 text-rose-400" />
              1. Inundated Settlement Centroid
            </label>
            <select
              value={selectedSettlementId}
              onChange={(e) => {
                setSelectedSettlementId(e.target.value);
                const s = FLOODED_SETTLEMENT_PRESETS.find((p) => p.id === e.target.value);
                if (s) setTargetEvacuees(Math.round(s.displacedPopulation * 0.5));
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FLOODED_SETTLEMENT_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.waterDepthMeters}m water)
                </option>
              ))}
            </select>
          </div>

          {/* Proximity Radius Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Compass className="h-3 w-3 text-cyan-400" />
              2. k-NN Search Radius: <strong className="text-white">{scanRadiusKm} km</strong>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={45}
                step={5}
                value={scanRadiusKm}
                onChange={(e) => setScanRadiusKm(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-cyan-400 shrink-0">
                {scanRadiusKm}km
              </span>
            </div>
          </div>

          {/* Capacity Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-400" />
              3. Minimum Shelter Capacity
            </label>
            <select
              value={minCapacityFilter}
              onChange={(e) => setMinCapacityFilter(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>All Capacities (&ge; 3,000)</option>
              <option value={5000}>Large Camps (&ge; 5,000 evacuees)</option>
              <option value={8000}>Mega Refuges (&ge; 8,000 evacuees)</option>
            </select>
          </div>

          {/* Military Helipad Toggle */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => setRequiresHelipad(!requiresHelipad)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-md ${
                requiresHelipad
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Plane className="h-3.5 w-3.5" />
              <span>{requiresHelipad ? 'HLZ Helipad: REQUIRED' : 'HLZ Helipad: Optional'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TACTICAL GEOSPATIAL MAP VIEW
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              High-Ground Proximity Map &amp; Radial Vectors
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({proximityMatches.length} candidate safe havens within {scanRadiusKm} km)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Origin Elev: <strong>{activeSettlement.elevationMeters}m ASL</strong></span>
          </div>
        </div>

        <SafeHavenDetectorMap
          centerSettlement={activeSettlement}
          proximityMatches={proximityMatches}
          selectedHavenId={selectedHavenId}
          onSelectHaven={handleSelectHaven}
          scanRadiusKm={scanRadiusKm}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TELEMETRY METRIC CARDS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Havens Detected */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Detected Safe Havens</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {proximityMatches.length}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">Sites</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Within {scanRadiusKm}km perimeter
          </div>
        </div>

        {/* Metric 2: Closest Safe Refuge */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Nearest High Ground</span>
            <Navigation className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-cyan-400 font-mono">
            {proximityMatches[0]?.distanceKm || 0}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">km</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {proximityMatches[0]?.haven.name.split(' ')[0] || 'N/A'} ({proximityMatches[0]?.compassDirection || ''})
          </div>
        </div>

        {/* Metric 3: Total Available Vacancy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Remaining Capacity</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-blue-400 font-mono">
            {proximityMatches.reduce((sum, m) => sum + m.remainingCapacity, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Available beds &amp; tent plots
          </div>
        </div>

        {/* Metric 4: Military Helipads */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Rotary Airdrop Pads</span>
            <Plane className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-purple-400 font-mono">
            {proximityMatches.filter((m) => m.haven.hasHelipad).length}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">HLZ</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Nepal Army Mi-17 certified
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SPLIT DETAIL COLUMNS: RANKED SAFE HAVENS VS SPHERE CAMP SIMULATOR
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT: RANKED CANDIDATE SAFE HAVENS (7 COLS) ───────────────────── */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Ranked Safe Havens by Site Suitability Score
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Proximity &amp; Elevation Matrix
            </span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {proximityMatches.map((match) => {
              const haven = match.haven;
              const isSelected = selectedHavenId === haven.id;

              return (
                <div
                  key={haven.id}
                  onClick={() => handleSelectHaven(haven)}
                  className={`rounded-xl p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  {/* Top Haven Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            haven.suitabilityGrade === 'A+'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          GRADE {haven.suitabilityGrade} &bull; Score: {match.compositeScore}/100
                        </span>
                        {haven.hasHelipad && (
                          <span className="rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                            <Plane className="h-2.5 w-2.5" />
                            HLZ HELIPAD
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {haven.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 italic">
                        {haven.nepaliName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-base font-black text-emerald-400">
                        {match.distanceKm} km
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {match.compassDirection} Bearing
                      </span>
                    </div>
                  </div>

                  {/* Elevation & Capacity Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Elevation</span>
                      <strong className="text-white">{haven.elevationMeters}m ASL</strong>{' '}
                      <span className="text-emerald-400 text-[10px]">
                        (+{match.elevationGainMeters}m)
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Max Capacity</span>
                      <strong className="text-white">{haven.totalCapacity.toLocaleString()}</strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block">Vacancy</span>
                      <strong className="text-cyan-400">
                        {match.remainingCapacity.toLocaleString()}
                      </strong>{' '}
                      <span className="text-slate-500 text-[9px]">({match.occupancyPercent}% full)</span>
                    </div>
                  </div>

                  {/* Transit Times */}
                  <div className="flex items-center gap-4 mt-2.5 text-[10px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-cyan-400" />
                      <span>Truck: <strong>{match.estimatedTransitTimeMinutes.convoyTruck}m</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>Tractor: <strong>{match.estimatedTransitTimeMinutes.tractor}m</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-400" />
                      <span>Walk: <strong>{Math.floor(match.estimatedTransitTimeMinutes.walking / 60)}h {match.estimatedTransitTimeMinutes.walking % 60}m</strong></span>
                    </div>
                  </div>

                  {/* Warden Hotline */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>
                      Marshal: <strong>{haven.wardenName}</strong> ({haven.wardenAgency.split(' ')[0]})
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                      <Phone className="h-3 w-3" />
                      {haven.wardenPhone}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: SPHERE REFUGEE CAMP DEPLOYMENT SIMULATOR (5 COLS) ───────── */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Tent className="h-4 w-4 text-cyan-400" />
              Sphere Refugee Camp Deployment Planner
            </h3>
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
              UN-SPIDER / Sphere
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Target Displaced Evacuees:</span>
              <span className="font-mono text-base font-black text-cyan-400">
                {targetEvacuees.toLocaleString()} Persons
              </span>
            </div>

            <input
              type="range"
              min={500}
              max={15000}
              step={500}
              value={targetEvacuees}
              onChange={(e) => setTargetEvacuees(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>500</span>
              <span>5,000</span>
              <span>10,000</span>
              <span>15,000</span>
            </div>
          </div>

          {/* Deployment Requirements Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Family Tents */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Tent className="h-3.5 w-3.5" />
                Standard Family Tents
              </div>
              <div className="text-xl font-black text-white font-mono">
                {campManifest.familyTentsCount.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">units</span>
              </div>
              <div className="text-[10px] text-slate-400">
                16 m² tent per family of 5
              </div>
            </div>

            {/* Emergency Latrines */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                <Boxes className="h-3.5 w-3.5" />
                Emergency Latrines
              </div>
              <div className="text-xl font-black text-white font-mono">
                {campManifest.latrinesRequired.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">pits</span>
              </div>
              <div className="text-[10px] text-slate-400">
                1:20 gender-separated ratio
              </div>
            </div>

            {/* Potable Water Supply */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                <Droplet className="h-3.5 w-3.5" />
                Daily Water Volume
              </div>
              <div className="text-xl font-black text-white font-mono">
                {campManifest.waterDailyLiters.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">L/day</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Sphere: 15 L / person / day
              </div>
            </div>

            {/* T-11 Water Bladders */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold">
                <Zap className="h-3.5 w-3.5" />
                T-11 Water Bladders
              </div>
              <div className="text-xl font-black text-white font-mono">
                {campManifest.waterBladdersT11Count}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">Tanks</span>
              </div>
              <div className="text-[10px] text-slate-400">
                11,000L flexible pillow bladders
              </div>
            </div>

            {/* Medical Triage Clinics */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <HeartPulse className="h-3.5 w-3.5" />
                Medical Triage Clinics
              </div>
              <div className="text-xl font-black text-white font-mono">
                {campManifest.medicalTriageTents}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">Tents</span>
              </div>
              <div className="text-[10px] text-slate-400">
                1 mobile clinic / 1,500 people
              </div>
            </div>

            {/* Land Area Required */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                <Building2 className="h-3.5 w-3.5" />
                Camp Area Footprint
              </div>
              <div className="text-xl font-black text-white font-mono">
                {(campManifest.requiredLandAreaSqMeters / 1000).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">k m²</span>
              </div>
              <div className="text-[10px] text-slate-400">
                45 m² / person total area
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => setShowDeploymentModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Official Camp Layout Sheet</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SPHERE CAMP DEPLOYMENT MODAL (PRINT & EXPORT)
      ─────────────────────────────────────────────────────────────────────── */}
      {showDeploymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tent className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Government Emergency Refugee Camp Deployment Directive
                </h3>
              </div>
              <button
                onClick={() => setShowDeploymentModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Directive Metadata */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Directive #</span>
                  <span className="font-mono font-bold text-emerald-400">RCAMP-{Date.now().toString().slice(-6)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Safe Haven</span>
                  <span className="font-bold text-white">{selectedHaven.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Site Elevation</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedHaven.elevationMeters}m ASL</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Headcount</span>
                  <span className="font-mono font-bold text-white">{targetEvacuees.toLocaleString()} Evacuees</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div><strong>Inundation Centroid:</strong> {activeSettlement.name} ({activeSettlement.waterDepthMeters}m water)</div>
                <div><strong>Lead Coordination Agency:</strong> {selectedHaven.wardenAgency} &bull; Warden: {selectedHaven.wardenName} ({selectedHaven.wardenPhone})</div>
                <div><strong>Rotary Access (HLZ):</strong> {selectedHaven.hasHelipad ? 'Mi-17 Certified Concrete Helipad Ready' : 'Ground Logistics Only'}</div>
              </div>
            </div>

            {/* Sphere Resource Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sphere Minimum Logistics Requisition Checklist
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Family Tents (16m²)</div>
                  <div className="text-base font-black text-white">{campManifest.familyTentsCount} units</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Sanitation Latrines</div>
                  <div className="text-base font-black text-rose-300">{campManifest.latrinesRequired} units</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">T-11 Water Bladders</div>
                  <div className="text-base font-black text-cyan-300">{campManifest.waterBladdersT11Count} tanks</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Handwash Taps</div>
                  <div className="text-base font-black text-white">{campManifest.communalHandwashTaps} points</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Emergency Power</div>
                  <div className="text-base font-black text-amber-300">{campManifest.powerMicrogridsKva} kVA</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Land Area Footprint</div>
                  <div className="text-base font-black text-purple-300">{(campManifest.requiredLandAreaSqMeters / 1000).toFixed(1)}k m²</div>
                </div>
              </div>
            </div>

            {/* Hotline Strip */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>National Disaster Hotline: <strong className="text-white">1155</strong></span>
              <span>Nepal Red Cross Shelter Corps: <strong className="text-white">1130</strong></span>
              <span>Armed Police Force Rescue: <strong className="text-white">1114</strong></span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowDeploymentModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Camp Deployment Directive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
