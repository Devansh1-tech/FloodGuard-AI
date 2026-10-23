/**
 * Stage57SafeHavensPage.tsx — Stage 5.7 Safe Haven & Refugee Camp Proximity Detector.
 *
 * Overhauled to "Tactical Dispatch & Evacuation Command View" (VISUAL_DENSITY: 8, SKILL.md):
 * 1. Information Pruned: Abolished debug badges, redundant hotlines, and long descriptions.
 * 2. Full-Viewport Hero Map Canvas: <div id="map"></div> primary focus with edge-to-edge layout.
 * 3. Floating Glass Proximity Toolbar: Origin centroid, radius slider, capacity, and HLZ toggle.
 * 4. Floating Monospace KPI Strip: Detected Havens, Nearest High Ground, Remaining Capacity, Rotary Pads.
 * 5. Sliding Right Humanitarian Inspector Drawer: Tab 1 (Site Suitability & Ranking) & Tab 2 (UN Sphere Camp Planner).
 * 6. Consolidated Action: "Export Official Sphere Camp Layout (PDF)" with jsPDF binary generation & print directive.
 * 7. Standardized WCAG AA Palette: Deep Slate (#0F172A), Dark Slate (#1E293B), Off-White (#F8FAFC).
 * 8. Anti-Emoji Policy: Exclusively @phosphor-icons/react SVGs.
 */

import React, { useMemo, useState } from 'react';
import {
  Tent,
  Mountains,
  Bed,
  AirplaneTilt,
  NavigationArrow,
  PhoneCall,
  ShieldCheck,
  Shield,
  Waves,
  Drop,
  Compass,
  SlidersHorizontal,
  Users,
  FilePdf,
  Printer,
  X,
  CheckCircle,
  Clock,
  Truck,
  Tractor,
  Heartbeat,
  FirstAidKit,
  Lightning,
  Toilet,
  Buildings,
  ListBullets,
  CaretRight,
  ArrowsClockwise,
  Eye,
  Info,
} from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';

import { SafeHavenFacility, TERAI_SAFE_HAVENS } from '@/data/teraiSafeHavens';
import {
  findNearbySafeHavens,
  calculateSphereCampRequirements,
  ProximityMatch,
  RefugeeCampManifest,
} from '@/services/teraiProximityEngine';
import { SafeHavenDetectorMap } from '@/components/havens/SafeHavenDetectorMap';

// Preset Flooded Settlements across the 21 Terai districts
export interface FloodedSettlementPreset {
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

export const FLOODED_SETTLEMENT_PRESETS: FloodedSettlementPreset[] = [
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
  // Selected Flooded Settlement & Proximity State
  const [selectedSettlementId, setSelectedSettlementId] = useState<string>('settlement_gaur');
  const [scanRadiusKm, setScanRadiusKm] = useState<number>(30);
  const [minCapacityFilter, setMinCapacityFilter] = useState<number>(0);
  const [requiresHelipad, setRequiresHelipad] = useState<boolean>(false);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>('haven_rautahat_pipra_terrace');

  // Refugee Camp Deployment Simulator State
  const [targetEvacuees, setTargetEvacuees] = useState<number>(5000);
  const [showDeploymentModal, setShowDeploymentModal] = useState<boolean>(false);

  // Inspector Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'suitability' | 'sphere'>('suitability');

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

  // Selected match object
  const selectedMatch: ProximityMatch | undefined = useMemo(() => {
    return (
      proximityMatches.find((m) => m.haven.id === selectedHaven.id) ||
      proximityMatches[0]
    );
  }, [proximityMatches, selectedHaven]);

  // Compute Sphere Camp Manifest
  const campManifest: RefugeeCampManifest = useMemo(() => {
    return calculateSphereCampRequirements(targetEvacuees);
  }, [targetEvacuees]);

  // Handle selecting a safe haven
  const handleSelectHaven = (haven: SafeHavenFacility) => {
    setSelectedHavenId(haven.id);
    setIsDrawerOpen(true);
    setActiveDrawerTab('suitability');
  };

  // Quick stats across proximity matches
  const totalRemainingCapacity = useMemo(() => {
    return proximityMatches.reduce((sum, m) => sum + m.remainingCapacity, 0);
  }, [proximityMatches]);

  const helipadsCount = useMemo(() => {
    return proximityMatches.filter((m) => m.haven.hasHelipad).length;
  }, [proximityMatches]);

  const nearestMatch = proximityMatches[0];

  // Binary PDF Generation using jsPDF
  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 14;

    // Header Band
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(16, 185, 129); // #10B981 Emerald Top Accent
    doc.rect(0, 0, pageWidth, 3, 'F');

    doc.setTextColor(248, 250, 252);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GOVERNMENT OF NEPAL | MINISTRY OF HOME AFFAIRS (MoHA)', margin, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(
      'National Emergency Operations Centre (NEOC) & UN-SPIDER Humanitarian Shelter Coordination',
      margin,
      17
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    const directiveNo = `RCAMP-${Date.now().toString().slice(-6)}`;
    doc.text(`DIRECTIVE REF: ${directiveNo} | SPHERE HUMANITARIAN CAMP BLUEPRINT`, margin, 23);

    doc.setTextColor(148, 163, 184);
    doc.text(new Date().toISOString().slice(0, 10), pageWidth - margin, 23, { align: 'right' });

    y = 36;

    // Section 1: Strategic Deployment Directive
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. TACTICAL REFUGE ASSIGNMENT & ELEVATION PROFILE', margin + 4, y + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    doc.text(`Origin Inundated Centroid: ${activeSettlement.name} (${activeSettlement.district})`, margin + 4, y + 14);
    doc.text(`Centroid Water Depth: ${activeSettlement.waterDepthMeters}m | Elevation: ${activeSettlement.elevationMeters}m ASL`, margin + 4, y + 20);
    doc.text(`Assigned Safe Haven: ${selectedHaven.name} (Grade: ${selectedHaven.suitabilityGrade})`, margin + 4, y + 26);
    doc.text(
      `Site Elevation: ${selectedHaven.elevationMeters}m ASL (+${selectedMatch?.elevationGainMeters || 0}m gain) | Radial Distance: ${selectedMatch?.distanceKm || 0} km (${selectedMatch?.compassDirection || 'N'})`,
      margin + 4,
      y + 32
    );

    y += 45;

    // Section 2: Command & Rotary Access
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. SITE MARSHAL & MILITARY ROTARY ACCESS (HLZ)', margin + 4, y + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Lead Coordination Agency: ${selectedHaven.wardenAgency}`, margin + 4, y + 14);
    doc.text(`Station Marshal: ${selectedHaven.wardenName} | 24/7 Hotline: ${selectedHaven.wardenPhone}`, margin + 4, y + 20);
    doc.text(
      `Helicopter Landing Zone (HLZ): ${selectedHaven.hasHelipad ? 'Mi-17 Certified Concrete Pad Active' : 'Ground Logistics Only (Paved Highway / Levee)'}`,
      margin + 4,
      y + 26
    );

    y += 35;

    // Section 3: Sphere Standards Logistics Requisition
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 70, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`3. UN SPHERE HUMANITARIAN LOGISTICS REQUISITION (TARGET: ${targetEvacuees.toLocaleString()} EVACUEES)`, margin + 4, y + 7);

    const items = [
      ['Standard Family Tents (16m² unit / family of 5)', `${campManifest.familyTentsCount.toLocaleString()} units`],
      ['Emergency Sanitation Latrines (1:20 gender-separated ratio)', `${campManifest.latrinesRequired.toLocaleString()} pits`],
      ['Daily Potable Water Supply (Sphere 15 L / person / day)', `${campManifest.waterDailyLiters.toLocaleString()} Liters/day`],
      ['T-11 Water Bladders (11,000L flexible pillow tanks)', `${campManifest.waterBladdersT11Count} tanks`],
      ['Communal Handwash Taps (1 tap per 100 evacuees)', `${campManifest.communalHandwashTaps} points`],
      ['Mobile Medical Triage Clinics (1 clinic per 1,500 people)', `${campManifest.medicalTriageTents} clinics`],
      ['Emergency Power Generators (Water pumps & vaccine cold chain)', `${campManifest.powerMicrogridsKva} kVA`],
      ['Required Camp Land Footprint (45 m² / person total area)', `${(campManifest.requiredLandAreaSqMeters / 1000).toFixed(1)}k m²`],
    ];

    doc.setFontSize(8);
    let rowY = y + 15;
    items.forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(label, margin + 4, rowY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(val, pageWidth - margin - 4, rowY, { align: 'right' });
      rowY += 6.5;
    });

    y += 77;

    // Section 4: National Hotlines
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'National Emergency Operations Centre (NEOC): 1155 | Nepal Red Cross Shelter Corps: 1130 | Armed Police Force (APF): 1114',
      margin,
      y
    );

    doc.save(`Sphere_Camp_Deployment_Directive_${directiveNo}.pdf`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F8FAFC] pb-10 space-y-3 px-2 sm:px-4 max-w-[1400px] mx-auto w-full">
      {/* ─────────────────────────────────────────────────────────────────────
          TOP TACTICAL CONTROL BAR: CLEAN CONCISE TITLE + UNIFIED ACTIONS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Tent size={24} weight="bold" className="text-[#10B981]" />
            <span>Terai Safe Haven &amp; Refugee Shelter Command</span>
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Geospatial k-NN Shelter Allocation &bull; UN Sphere Standards &bull; Rotary HLZ Directives
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Drawer Toggle Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
              isDrawerOpen
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                : 'border-white/10 bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC]'
            }`}
            title="Toggle Shelter & Camp Logistics Drawer"
          >
            <ListBullets size={14} weight="bold" />
            <span>Logistics Drawer</span>
            <span className="rounded bg-[#0F172A] px-1.5 py-0.2 font-mono text-[10px] text-cyan-400 border border-white/10">
              {proximityMatches.length}
            </span>
          </button>

          {/* Consolidated Primary CTA */}
          <button
            onClick={() => {
              setShowDeploymentModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-3.5 py-1.5 text-xs font-bold text-white shadow-md border border-emerald-400/30 transition-all cursor-pointer font-sans"
          >
            <FilePdf size={15} weight="bold" />
            <span>Export Official Sphere Camp Layout (PDF)</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN HERO VIEWPORT: MAP CANVAS WITH FLOATING DOCKS & SLIDING DRAWER
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[78dvh] min-h-[580px] rounded-2xl overflow-hidden border border-white/10 bg-[#0F172A] shadow-2xl flex">
        {/* Leaflet Map Hero Container (DOM ID "map" strictly preserved) */}
        <div className="w-full h-full relative">
          <SafeHavenDetectorMap
            centerSettlement={activeSettlement}
            proximityMatches={proximityMatches}
            selectedHavenId={selectedHavenId}
            onSelectHaven={handleSelectHaven}
            scanRadiusKm={scanRadiusKm}
            className="w-full h-full"
          />

          {/* ─────────────────────────────────────────────────────────────────
              TOP PROXIMITY SEARCH BAR (Floating Glass Dock over Map)
          ─────────────────────────────────────────────────────────────────── */}
          <div className="absolute top-3 left-3 z-[400] max-w-[calc(100%-24px)] md:max-w-none pointer-events-auto">
            <div className="rounded-xl border border-white/10 bg-[#1E293B]/90 backdrop-blur-md p-2 sm:p-2.5 shadow-2xl flex flex-wrap items-center gap-2.5 text-xs text-[#F8FAFC]">
              {/* 1. Inundated Settlement Centroid */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold flex items-center gap-1 shrink-0">
                  <Waves size={13} weight="bold" className="text-[#EF4444]" />
                  <span>1. Settlement:</span>
                </span>
                <select
                  aria-label="Inundated Settlement Centroid"
                  value={selectedSettlementId}
                  onChange={(e) => {
                    setSelectedSettlementId(e.target.value);
                    const s = FLOODED_SETTLEMENT_PRESETS.find((p) => p.id === e.target.value);
                    if (s) setTargetEvacuees(Math.round(s.displacedPopulation * 0.5));
                  }}
                  className="rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[200px] sm:max-w-[240px] truncate"
                >
                  {FLOODED_SETTLEMENT_PRESETS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0F172A] text-white">
                      {s.name.split(' ')[0]} ({s.district}) &bull; {s.waterDepthMeters}m deluge
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Radius Slider */}
              <div className="flex items-center gap-2 border-l border-white/10 pl-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold flex items-center gap-1 shrink-0">
                  <Compass size={13} weight="bold" className="text-cyan-400" />
                  <span>2. Radius:</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={45}
                  step={5}
                  value={scanRadiusKm}
                  onChange={(e) => setScanRadiusKm(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-cyan-400 cursor-pointer"
                  title={`k-NN Search Radius: ${scanRadiusKm} km`}
                />
                <span className="font-mono text-xs font-bold text-cyan-400 shrink-0">
                  {scanRadiusKm}km
                </span>
              </div>

              {/* 3. Min Capacity Filter */}
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5 hidden sm:flex">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold flex items-center gap-1 shrink-0">
                  <Users size={13} weight="bold" className="text-blue-400" />
                  <span>3. Capacity:</span>
                </span>
                <select
                  aria-label="Minimum Shelter Capacity"
                  value={minCapacityFilter}
                  onChange={(e) => setMinCapacityFilter(Number(e.target.value))}
                  className="rounded-lg border border-white/10 bg-[#0F172A] px-2 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value={0} className="bg-[#0F172A] text-white">All (&ge; 3,000)</option>
                  <option value={5000} className="bg-[#0F172A] text-white">Large (&ge; 5,000)</option>
                  <option value={8000} className="bg-[#0F172A] text-white">Mega (&ge; 8,000)</option>
                </select>
              </div>

              {/* 4. HLZ Helipad Toggle */}
              <div className="border-l border-white/10 pl-2.5">
                <button
                  onClick={() => setRequiresHelipad(!requiresHelipad)}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    requiresHelipad
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/40'
                      : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:text-white'
                  }`}
                  title="Filter for Nepal Army Mi-17 Certified Rotary Helipads"
                >
                  <AirplaneTilt size={13} weight="bold" className={requiresHelipad ? 'text-[#10B981]' : 'text-[#94A3B8]'} />
                  <span>{requiresHelipad ? 'HLZ: YES' : 'HLZ: ANY'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              FLOATING KPI SUMMARY STRIP (Monospace Metrics Overlaid on Map)
          ─────────────────────────────────────────────────────────────────── */}
          <div className="absolute bottom-3 left-3 z-[400] max-w-[calc(100%-24px)] md:max-w-2xl pointer-events-auto">
            <div className="rounded-xl border border-white/10 bg-[#1E293B]/90 backdrop-blur-md p-2 shadow-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* KPI 1: Detected Safe Havens */}
              <div className="p-2 rounded-lg bg-[#0F172A] border border-white/5 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                  <span>Detected Safe Havens</span>
                  <Tent size={14} weight="bold" className="text-[#10B981]" />
                </div>
                <div className="text-sm sm:text-base font-black text-white font-mono flex items-baseline gap-1">
                  <span>{proximityMatches.length} Sites</span>
                </div>
                <div className="text-[10px] font-mono text-[#10B981] truncate">
                  within {scanRadiusKm}km radius
                </div>
              </div>

              {/* KPI 2: Nearest High Ground */}
              <div className="p-2 rounded-lg bg-[#0F172A] border border-white/5 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                  <span>Nearest High Ground</span>
                  <NavigationArrow size={14} weight="bold" className="text-cyan-400" />
                </div>
                <div className="text-sm sm:text-base font-black text-cyan-400 font-mono truncate">
                  {nearestMatch ? `${nearestMatch.distanceKm} km` : 'N/A'}
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8] truncate">
                  {nearestMatch ? `${nearestMatch.haven.name.split(' ')[0]} (${nearestMatch.compassDirection})` : 'None in range'}
                </div>
              </div>

              {/* KPI 3: Remaining Capacity */}
              <div className="p-2 rounded-lg bg-[#0F172A] border border-white/5 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                  <span>Remaining Capacity</span>
                  <Bed size={14} weight="bold" className="text-blue-400" />
                </div>
                <div className="text-sm sm:text-base font-black text-blue-400 font-mono truncate">
                  {totalRemainingCapacity.toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8] truncate">
                  Beds / Tents Available
                </div>
              </div>

              {/* KPI 4: Rotary Airdrop Pads */}
              <div className="p-2 rounded-lg bg-[#0F172A] border border-white/5 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                  <span>Rotary Airdrop Pads</span>
                  <AirplaneTilt size={14} weight="bold" className="text-purple-400" />
                </div>
                <div className="text-sm sm:text-base font-black text-purple-300 font-mono">
                  {helipadsCount} HLZ
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8] truncate">
                  Mi-17 Certified Pads
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            SLIDING RIGHT HUMANITARIAN INSPECTOR DRAWER (Width: 400px Desktop)
        ─────────────────────────────────────────────────────────────────────── */}
        {isDrawerOpen && (
          <div className="absolute top-0 right-0 bottom-0 z-[500] w-full sm:w-[400px] bg-[#1E293B]/95 backdrop-blur-md border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-[#0F172A]/80">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 flex items-center gap-1">
                    <ShieldCheck size={13} weight="bold" />
                    Tactical Route Brief
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    ({proximityMatches.length} Sites)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                  Shelter &amp; Camp Logistics Drawer
                </h3>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Minimize Logistics Drawer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Tabbed Switcher */}
            <div className="grid grid-cols-2 border-b border-white/10 p-1 bg-[#0F172A] gap-1 shrink-0 text-xs font-bold">
              <button
                onClick={() => setActiveDrawerTab('suitability')}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeDrawerTab === 'suitability'
                    ? 'bg-[#1E293B] text-cyan-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Shield size={13} weight="bold" />
                <span>Site Suitability</span>
              </button>

              <button
                onClick={() => setActiveDrawerTab('sphere')}
                className={`py-1.5 px-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeDrawerTab === 'sphere'
                    ? 'bg-[#1E293B] text-emerald-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Tent size={13} weight="bold" />
                <span>UN Sphere Planner</span>
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {/* ── TAB 1: SITE SUITABILITY & RANKING ───────────────────────── */}
              {activeDrawerTab === 'suitability' && (
                <div className="space-y-3">
                  {/* Selected Haven Detailed Card */}
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 space-y-2.5 shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase font-mono ${
                              selectedHaven.suitabilityGrade === 'A+' || selectedHaven.suitabilityGrade === 'A'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            GRADE {selectedHaven.suitabilityGrade} &bull; Score: {selectedMatch?.compositeScore || selectedHaven.suitabilityScore}/100
                          </span>
                          {selectedHaven.hasHelipad && (
                            <span className="rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 font-mono">
                              <AirplaneTilt size={10} weight="bold" />
                              HLZ HELIPAD
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                          {selectedHaven.name}
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] italic mt-0.5">
                          {selectedHaven.nepaliName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-base font-black text-emerald-400">
                          {selectedMatch?.distanceKm || 0} km
                        </div>
                        <span className="text-[10px] text-[#94A3B8] font-mono">
                          {selectedMatch?.compassDirection || 'N'} Bearing
                        </span>
                      </div>
                    </div>

                    {/* Elevation ASL & Capacity Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                      <div>
                        <span className="text-[9px] text-[#94A3B8] uppercase block">Elevation</span>
                        <strong className="text-white">{selectedHaven.elevationMeters}m ASL</strong>{' '}
                        <span className="text-emerald-400 text-[10px]">
                          (+{selectedMatch?.elevationGainMeters || 0}m)
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#94A3B8] uppercase block">Max Cap</span>
                        <strong className="text-white">{selectedHaven.totalCapacity.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#94A3B8] uppercase block">Vacancy</span>
                        <strong className="text-cyan-400">
                          {selectedMatch?.remainingCapacity.toLocaleString() || 0}
                        </strong>
                      </div>
                    </div>

                    {/* Monospace Transit Times */}
                    <div className="flex items-center justify-between text-[10px] font-mono bg-[#0F172A] p-2 rounded-lg border border-white/10 text-[#F8FAFC]">
                      <div className="flex items-center gap-1">
                        <Truck size={13} weight="bold" className="text-cyan-400" />
                        <span>Truck: <strong>{selectedMatch?.estimatedTransitTimeMinutes.convoyTruck || 15}m</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tractor size={13} weight="bold" className="text-amber-400" />
                        <span>Tractor: <strong>{selectedMatch?.estimatedTransitTimeMinutes.tractor || 34}m</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={13} weight="bold" className="text-emerald-400" />
                        <span>Walk: <strong>{Math.floor((selectedMatch?.estimatedTransitTimeMinutes.walking || 168) / 60)}h {(selectedMatch?.estimatedTransitTimeMinutes.walking || 168) % 60}m</strong></span>
                      </div>
                    </div>

                    {/* Site Marshal & Hotline */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>
                        Marshal: <strong className="text-white">{selectedHaven.wardenName}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                        <PhoneCall size={12} weight="bold" />
                        {selectedHaven.wardenPhone}
                      </span>
                    </div>
                  </div>

                  {/* All Ranked Havens Directory */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] uppercase font-bold px-1">
                      <span>Candidate High Ground Sites</span>
                      <span>Ranked by Score</span>
                    </div>

                    {proximityMatches.map((match) => {
                      const haven = match.haven;
                      const isSelected = selectedHavenId === haven.id;
                      const isHigh = haven.suitabilityGrade === 'A+' || haven.suitabilityGrade === 'A' || haven.suitabilityGrade === 'B+';

                      return (
                        <button
                          key={haven.id}
                          onClick={() => handleSelectHaven(haven)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/40'
                              : 'border-white/10 bg-[#0F172A] hover:bg-[#1E293B] hover:border-white/20'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-black font-mono px-1 rounded ${
                                  isHigh
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {haven.suitabilityGrade}
                              </span>
                              <span className="text-xs font-bold text-white truncate">
                                {haven.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5 flex items-center gap-2">
                              <span>Elev: {haven.elevationMeters}m (+{match.elevationGainMeters}m)</span>
                              <span>&bull;</span>
                              <span>Vac: {match.remainingCapacity.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <div className="text-xs font-bold text-cyan-400">
                              {match.distanceKm}km
                            </div>
                            <div className="text-[9px] text-[#94A3B8]">
                              {match.compassDirection}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TAB 2: UN SPHERE CAMP PLANNER ───────────────────────────── */}
              {activeDrawerTab === 'sphere' && (
                <div className="space-y-3.5">
                  {/* Evacuee Headcount Interactive Slider */}
                  <div className="rounded-xl border border-white/10 bg-[#0F172A] p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#F8FAFC]">Target Displaced Evacuees:</span>
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
                      title="Adjust displaced population headcount"
                    />

                    <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
                      <span>500</span>
                      <span>5,000</span>
                      <span>10,000</span>
                      <span>15,000</span>
                    </div>
                  </div>

                  {/* UN Sphere Resource Requisition Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Family Tents */}
                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
                        <Tent size={14} weight="bold" />
                        <span>Family Tents</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {campManifest.familyTentsCount.toLocaleString()}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">units</span>
                      </div>
                      <div className="text-[9.5px] text-[#94A3B8] truncate">
                        16 m² tent / family of 5
                      </div>
                    </div>

                    {/* Emergency Latrines */}
                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-bold">
                        <Toilet size={14} weight="bold" />
                        <span>Emergency Latrines</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {campManifest.latrinesRequired.toLocaleString()}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">pits</span>
                      </div>
                      <div className="text-[9.5px] text-[#94A3B8] truncate">
                        1:20 gender-separated
                      </div>
                    </div>

                    {/* Daily Water Volume */}
                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-bold">
                        <Drop size={14} weight="bold" />
                        <span>Daily Water Volume</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {campManifest.waterDailyLiters.toLocaleString()}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">L/day</span>
                      </div>
                      <div className="text-[9.5px] text-[#94A3B8] truncate">
                        15 L / person / day
                      </div>
                    </div>

                    {/* T-11 Water Bladders */}
                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-bold">
                        <Lightning size={14} weight="bold" />
                        <span>T-11 Water Bladders</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {campManifest.waterBladdersT11Count}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">Tanks</span>
                      </div>
                      <div className="text-[9.5px] text-[#94A3B8] truncate">
                        11,000L pillow tanks
                      </div>
                    </div>

                    {/* Medical Triage Clinics */}
                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                        <Heartbeat size={14} weight="bold" />
                        <span>Medical Triage Clinics</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {campManifest.medicalTriageTents}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">Clinics</span>
                      </div>
                      <div className="text-[9.5px] text-[#94A3B8] truncate">
                        1 clinic / 1,500 people
                      </div>
                    </div>

                    {/* Camp Area Footprint */}
                    <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-bold">
                        <Buildings size={14} weight="bold" />
                        <span>Camp Area Footprint</span>
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        {(campManifest.requiredLandAreaSqMeters / 1000).toFixed(1)}{' '}
                        <span className="text-[10px] font-normal text-[#94A3B8]">k m²</span>
                      </div>
                      <div className="text-[9.5px] text-[#94A3B8] truncate">
                        45 m² / person total area
                      </div>
                    </div>
                  </div>

                  {/* Secondary Manifest Data (Power & Handwash) */}
                  <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono text-[#94A3B8]">
                    <div>
                      <span>Handwash Taps:</span>{' '}
                      <strong className="text-white">{campManifest.communalHandwashTaps} points</strong>
                    </div>
                    <div>
                      <span>Emergency Power:</span>{' '}
                      <strong className="text-amber-400">{campManifest.powerMicrogridsKva} kVA</strong>
                    </div>
                  </div>

                  {/* Action CTA inside Tab 2 */}
                  <button
                    onClick={() => {
                      setShowDeploymentModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer font-sans"
                  >
                    <FilePdf size={15} weight="bold" />
                    <span>Export Official Sphere Camp Layout (PDF)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          OFFICIAL SPHERE CAMP DEPLOYMENT DIRECTIVE MODAL (PRINT & EXPORT)
      ─────────────────────────────────────────────────────────────────────── */}
      {showDeploymentModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#1E293B] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-[#F8FAFC]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Tent size={20} weight="bold" className="text-[#10B981]" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Government Emergency Refugee Camp Deployment Directive
                </h3>
              </div>
              <button
                aria-label="Close"
                onClick={() => setShowDeploymentModal(false)}
                className="rounded-lg p-1 text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Directive Metadata */}
            <div className="rounded-xl border border-white/10 bg-[#0F172A] p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[#94A3B8]">
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block font-mono">Directive #</span>
                  <span className="font-mono font-bold text-[#10B981]">RCAMP-{Date.now().toString().slice(-6)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block font-mono">Selected Haven</span>
                  <span className="font-bold text-white truncate block">{selectedHaven.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block font-mono">Site Elevation</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedHaven.elevationMeters}m ASL</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block font-mono">Target Headcount</span>
                  <span className="font-mono font-bold text-white">{targetEvacuees.toLocaleString()} Evacuees</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 space-y-1 text-[#94A3B8]">
                <div><strong className="text-white">Inundation Centroid:</strong> {activeSettlement.name} ({activeSettlement.waterDepthMeters}m water)</div>
                <div><strong className="text-white">Lead Coordination Agency:</strong> {selectedHaven.wardenAgency} &bull; Warden: {selectedHaven.wardenName} ({selectedHaven.wardenPhone})</div>
                <div><strong className="text-white">Rotary Access (HLZ):</strong> {selectedHaven.hasHelipad ? 'Mi-17 Certified Concrete Helipad Ready' : 'Ground Logistics Only'}</div>
              </div>
            </div>

            {/* Sphere Resource Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
                Sphere Minimum Logistics Requisition Checklist
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/10">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Family Tents (16m²)</div>
                  <div className="text-base font-black text-white">{campManifest.familyTentsCount} units</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/10">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Sanitation Latrines</div>
                  <div className="text-base font-black text-rose-300">{campManifest.latrinesRequired} pits</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/10">
                  <div className="text-[10px] text-[#94A3B8] uppercase">T-11 Water Bladders</div>
                  <div className="text-base font-black text-cyan-300">{campManifest.waterBladdersT11Count} tanks</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/10">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Handwash Taps</div>
                  <div className="text-base font-black text-white">{campManifest.communalHandwashTaps} points</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/10">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Emergency Power</div>
                  <div className="text-base font-black text-amber-300">{campManifest.powerMicrogridsKva} kVA</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/10">
                  <div className="text-[10px] text-[#94A3B8] uppercase">Land Area Footprint</div>
                  <div className="text-base font-black text-purple-300">{(campManifest.requiredLandAreaSqMeters / 1000).toFixed(1)}k m²</div>
                </div>
              </div>
            </div>

            {/* Directive Footer Strip */}
            <div className="rounded-xl border border-white/10 bg-[#0F172A] p-2.5 text-[11px] font-mono text-[#94A3B8] flex items-center justify-between">
              <span>National Operations Protocol &bull; NDRRMA Emergency Directive</span>
              <span className="text-[#10B981] font-bold">Standard UN-SPIDER / Sphere</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowDeploymentModal(false)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0F172A] hover:bg-white/5 px-3 py-1.5 text-xs font-bold text-[#F8FAFC] shadow-sm transition-all cursor-pointer"
              >
                <Printer size={14} weight="bold" />
                <span>Print Directive</span>
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                <FilePdf size={14} weight="bold" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
