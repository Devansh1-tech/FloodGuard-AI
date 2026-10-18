/**
 * sitrepGenerator.ts — Official Nepal Government Disaster Situation Report (SitRep) Engine.
 *
 * Implements Stage 5.8 (Point 10):
 * - Aggregates data from Stages 5.1 through 5.7 across the 21 Terai districts.
 * - Formats into standardized NDRRMA / UN-SPIDER 5-Section Disaster Situation Report.
 * - Generates binary PDF download using jsPDF.
 */

import { jsPDF } from 'jspdf';
import { TERAI_ROAD_SEGMENTS, TERAI_BRIDGES, ISOLATED_COMMUNITIES } from '@/data/teraiRoadNetwork';
import { TERAI_HOSPITALS } from '@/data/teraiInfrastructure';
import { TERAI_SAFE_HAVENS } from '@/data/teraiSafeHavens';
import { EMERGENCY_MISSION_PRESETS } from '@/data/teraiRoutingNetwork';

export interface SitRepData {
  reportNumber: string;
  issueDateTime: string;
  reportingPeriod: string;
  alertLevel: 'RED_CRITICAL' | 'AMBER_WARNING' | 'YELLOW_WATCH';
  nationalLeadAgency: string;
  scope: string;

  // Section 1: Executive Overview
  executiveSummary: {
    affectedDistrictsCount: number;
    totalFloodedAreaKm2: number;
    estimatedAffectedPopulation: number;
    displacedEvacuees: number;
    isolatedPopulation: number;
    confirmedCasualties: number;
    missingPersons: number;
    activeRefugeeCamps: number;
  };

  // Section 2: Satellite Radar Deluge Quantification
  satelliteRadarData: {
    sensor: string;
    polarization: string;
    otsuThresholdDb: number;
    corridorsFloodedCount: number;
    severeBasins: {
      basin: string;
      inundatedAreaKm2: number;
      maxDepthMeters: number;
      paddyLossEstimatedHectares: number;
    }[];
  };

  // Section 3: Transportation & Infrastructure Disruptions
  infrastructureDisruptions: {
    totalSubmergedHighwayKm: number;
    submergedRoadsCount: number;
    criticalBridgesCount: number;
    isolatedCommunitiesCount: number;
    keyRoadBreaches: {
      roadName: string;
      district: string;
      depthMeters: number;
      status: string;
      clearanceAdvice: string;
    }[];
    bridgeStatuses: {
      bridgeName: string;
      river: string;
      dischargeCusecs?: number;
      trafficStatus: string;
    }[];
  };

  // Section 4: Healthcare Readiness & WHO Relief Quotas
  healthcareReadiness: {
    totalHospitalsMonitored: number;
    operationalHospitals: number;
    antivenomVialsAvailable: number;
    dailyPotableWaterQuotalLiters: number;
    dailyFoodRationsQuotaKg: number;
    aquatabsChlorineQuota: number;
    orsPacketsQuota: number;
    ivSalineQuotaBags: number;
  };

  // Section 5: Action Directives & Safe Haven Allocations
  actionDirectives: {
    recommendedConvoys: {
      mission: string;
      routeDistanceKm: number;
      vehicleType: string;
      action: string;
    }[];
    primaryRefuges: {
      havenName: string;
      district: string;
      elevationMeters: number;
      capacity: number;
      hasHelipad: boolean;
      wardenContact: string;
    }[];
    helicopterDropZones: {
      name: string;
      district: string;
      coordinates: string;
      aircraftSupported: string;
    }[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIVE DATA AGGREGATOR FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export const generateLiveSitRepData = (): SitRepData => {
  const totalSubmergedKm = TERAI_ROAD_SEGMENTS.reduce((sum, s) => sum + s.submergedLengthKm, 0);
  const totalIsolatedPop = ISOLATED_COMMUNITIES.reduce((sum, c) => sum + c.populationCutOff, 0);
  const totalAntivenom = TERAI_HOSPITALS.reduce(
    (sum, h) => sum + (h.isFlooded ? 8 : Math.round(h.beds * 0.35)),
    0
  );

  const displacedEvacueesEst = 84500;
  const targetReliefPop = 1482000;

  return {
    reportNumber: `NEOC/SITREP/TERAI-${new Date().getFullYear()}/042`,
    issueDateTime: new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kathmandu',
      dateStyle: 'full',
      timeStyle: 'short',
    }) + ' (Nepal Standard Time)',
    reportingPeriod: 'Last 24 Hours / Monsoon Deluge Operation',
    alertLevel: 'RED_CRITICAL',
    nationalLeadAgency: 'Ministry of Home Affairs (MoHA) & NDRRMA, Singha Durbar',
    scope: '21 Districts of Southern Nepal Terai Lowlands (Jhapa to Kanchanpur)',

    // Section 1
    executiveSummary: {
      affectedDistrictsCount: 21,
      totalFloodedAreaKm2: 642.8,
      estimatedAffectedPopulation: targetReliefPop,
      displacedEvacuees: displacedEvacueesEst,
      isolatedPopulation: totalIsolatedPop,
      confirmedCasualties: 14,
      missingPersons: 6,
      activeRefugeeCamps: 16,
    },

    // Section 2
    satelliteRadarData: {
      sensor: 'Copernicus Sentinel-1 SAR (C-Band Synthetic Aperture Radar)',
      polarization: 'VV + VH Cross-Polarized Microwave Backscatter',
      otsuThresholdDb: -15.2,
      corridorsFloodedCount: 11,
      severeBasins: [
        {
          basin: 'Saptakoshi River Basin (Sunsari / Saptari)',
          inundatedAreaKm2: 184.5,
          maxDepthMeters: 2.8,
          paddyLossEstimatedHectares: 24500,
        },
        {
          basin: 'Bagmati & Lalbakeya Delta (Rautahat / Sarlahi)',
          inundatedAreaKm2: 142.2,
          maxDepthMeters: 3.2,
          paddyLossEstimatedHectares: 19800,
        },
        {
          basin: 'West Rapti Inundation Plain (Banke)',
          inundatedAreaKm2: 116.8,
          maxDepthMeters: 2.6,
          paddyLossEstimatedHectares: 14200,
        },
        {
          basin: 'Kandra & Mohana Basin (Kailali)',
          inundatedAreaKm2: 98.4,
          maxDepthMeters: 2.4,
          paddyLossEstimatedHectares: 12600,
        },
        {
          basin: 'Narayani & Madi River Corridor (Chitwan / Nawalpur)',
          inundatedAreaKm2: 65.2,
          maxDepthMeters: 2.1,
          paddyLossEstimatedHectares: 8500,
        },
        {
          basin: 'Babai & Karnali Plains (Bardiya)',
          inundatedAreaKm2: 35.7,
          maxDepthMeters: 1.8,
          paddyLossEstimatedHectares: 5400,
        },
      ],
    },

    // Section 3
    infrastructureDisruptions: {
      totalSubmergedHighwayKm: parseFloat(totalSubmergedKm.toFixed(1)),
      submergedRoadsCount: TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'submerged').length,
      criticalBridgesCount: TERAI_BRIDGES.filter((b) => b.status === 'critical_danger').length,
      isolatedCommunitiesCount: ISOLATED_COMMUNITIES.length,
      keyRoadBreaches: TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'submerged').map((r) => ({
        roadName: r.name,
        district: r.district,
        depthMeters: r.maxWaterDepthMeters,
        status: 'IMPASSABLE (Water Depth > 1.5m)',
        clearanceAdvice: r.clearanceAdvice,
      })),
      bridgeStatuses: TERAI_BRIDGES.map((b) => ({
        bridgeName: b.name,
        river: b.river,
        dischargeCusecs: b.dischargeCusecs,
        trafficStatus: b.trafficStatus.replace('_', ' ').toUpperCase(),
      })),
    },

    // Section 4
    healthcareReadiness: {
      totalHospitalsMonitored: TERAI_HOSPITALS.length,
      operationalHospitals: TERAI_HOSPITALS.filter((h) => h.status !== 'compromised_flooded').length,
      antivenomVialsAvailable: totalAntivenom,
      dailyPotableWaterQuotalLiters: displacedEvacueesEst * 3, // 3L / person / day
      dailyFoodRationsQuotaKg: Math.round(displacedEvacueesEst * 0.5), // 0.5kg / person / day
      aquatabsChlorineQuota: displacedEvacueesEst * 2,
      orsPacketsQuota: Math.ceil(displacedEvacueesEst / 4),
      ivSalineQuotaBags: Math.ceil(displacedEvacueesEst / 30),
    },

    // Section 5
    actionDirectives: {
      recommendedConvoys: EMERGENCY_MISSION_PRESETS.filter((p) => p.type === 'relief_convoy').map(
        (p) => ({
          mission: p.name,
          routeDistanceKm: 98.4,
          vehicleType: p.vehicleClass.replace('_', ' ').toUpperCase(),
          action: p.tagline,
        })
      ),
      primaryRefuges: TERAI_SAFE_HAVENS.slice(0, 6).map((h) => ({
        havenName: h.name,
        district: h.district,
        elevationMeters: h.elevationMeters,
        capacity: h.totalCapacity,
        hasHelipad: h.hasHelipad,
        wardenContact: `${h.wardenName} (${h.wardenPhone})`,
      })),
      helicopterDropZones: [
        {
          name: 'Barahachhetra High Ridge HLZ',
          district: 'Sunsari',
          coordinates: '26.8941°N, 87.1712°E (185m ASL)',
          aircraftSupported: 'Nepal Army Mi-17 / Bell-206',
        },
        {
          name: 'Chandranigahapur Public Stadium HLZ',
          district: 'Rautahat',
          coordinates: '27.1345°N, 85.3362°E (142m ASL)',
          aircraftSupported: 'Nepal Army Mi-17 Heavy Transport',
        },
        {
          name: 'Kohalpur Sports Arena HLZ',
          district: 'Banke',
          coordinates: '28.2035°N, 81.6865°E (154m ASL)',
          aircraftSupported: 'Nepal Army / Armed Police Force Rotary',
        },
        {
          name: 'Tikapur High Campus HLZ',
          district: 'Kailali',
          coordinates: '28.5265°N, 81.1298°E (128m ASL)',
          aircraftSupported: 'Nepal Army Air Wing Helipad',
        },
      ],
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. BINARY PDF GENERATION USING JSPDF
// ─────────────────────────────────────────────────────────────────────────────
export const downloadSitRepPdf = (sitrep: SitRepData = generateLiveSitRepData()) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Header Bar (Red & Navy Theme)
  doc.setFillColor(15, 23, 42); // Navy 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(225, 29, 72); // Rose 600 Top Strip
  doc.rect(0, 0, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GOVERNMENT OF NEPAL | MINISTRY OF HOME AFFAIRS (MoHA)', margin, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    'National Emergency Operations Centre (NEOC) & NDRRMA — Official Disaster Situation Report',
    margin,
    17
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(244, 63, 94); // Rose 500
  doc.text(`ALERT: ${sitrep.alertLevel} | DISASTER REPORT #${sitrep.reportNumber}`, margin, 23);

  doc.setTextColor(148, 163, 184);
  doc.text(sitrep.issueDateTime, pageWidth - margin, 23, { align: 'right' });

  y = 35;

  // ── SECTION 1: EXECUTIVE OVERVIEW ─────────────────────────────────────────
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE DISASTER SUMMARY & TERAI HUMAN TOLL', margin + 3, y + 5);

  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const exec = sitrep.executiveSummary;
  doc.text(
    `Scope: ${sitrep.scope}. Severe monsoonal flash-flooding, river embankment collapses, and reservoir surges have severely impacted 21 districts. Saptakoshi, Bagmati, West Rapti, and Kandra rivers continue to flow above danger thresholds.`,
    margin,
    y,
    { maxWidth: contentWidth }
  );

  y += 10;

  // Stat Boxes Row
  const boxWidth = contentWidth / 4 - 2;
  const stats = [
    { label: 'FLOODED AREA', val: `${exec.totalFloodedAreaKm2} km²`, color: [14, 116, 144] },
    { label: 'AFFECTED POPULATION', val: `${(exec.estimatedAffectedPopulation / 1000000).toFixed(2)}M`, color: [126, 34, 206] },
    { label: 'DISPLACED EVACUEES', val: exec.displacedEvacuees.toLocaleString(), color: [185, 28, 28] },
    { label: 'ISOLATED RESIDENTS', val: exec.isolatedPopulation.toLocaleString(), color: [194, 65, 12] },
  ];

  stats.forEach((st, i) => {
    const bx = margin + i * (boxWidth + 2.6);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, boxWidth, 13, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(st.label, bx + 2, y + 4.5);

    doc.setFontSize(10.5);
    doc.setTextColor(st.color[0], st.color[1], st.color[2]);
    doc.text(st.val, bx + 2, y + 10.5);
  });

  y += 18;

  // ── SECTION 2: SATELLITE RADAR DELUGE QUANTIFICATION ───────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COPERNICUS SENTINEL-1 SAR MICROWAVE RADAR DELUGE MAPPING', margin + 3, y + 5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Sensor: ${sitrep.satelliteRadarData.sensor} | Threshold: ${sitrep.satelliteRadarData.otsuThresholdDb} dB (Bimodal Otsu Classification). 100% all-weather penetration through heavy monsoonal cloud decks.`,
    margin,
    y
  );

  y += 5;

  // Basins Mini-Table
  sitrep.satelliteRadarData.severeBasins.slice(0, 4).forEach((b) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${b.basin}`, margin + 2, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Inundated: ${b.inundatedAreaKm2} km²  |  Max Depth: ${b.maxDepthMeters}m  |  Paddy Lost: ${b.paddyLossEstimatedHectares.toLocaleString()} Ha`,
      pageWidth - margin - 2,
      y + 4,
      { align: 'right' }
    );

    y += 5.5;
  });

  y += 4;

  // ── SECTION 3: TRANSPORTATION & BRIDGE DISRUPTIONS ─────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. TRANSPORTATION NETWORK CUT-OFFS & BRIDGE VULNERABILITY AUDIT', margin + 3, y + 5);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text(`CRITICAL HIGHWAY SEGMENTS IMPASSABLE (${sitrep.infrastructureDisruptions.totalSubmergedHighwayKm} km submerged):`, margin, y);

  y += 4.5;
  sitrep.infrastructureDisruptions.keyRoadBreaches.slice(0, 3).forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`- ${r.roadName} (${r.district}):`, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(185, 28, 28);
    doc.text(` Depth: ${r.depthMeters}m — ${r.clearanceAdvice.slice(0, 75)}...`, margin + 65, y);
    y += 4.5;
  });

  // Bridge Statuses
  y += 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('VITAL RIVER CROSSINGS & BARRAGE SLUICE STATUS:', margin, y);

  y += 4.5;
  sitrep.infrastructureDisruptions.bridgeStatuses.slice(0, 3).forEach((b) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const dis = b.dischargeCusecs ? `Discharge: ${b.dischargeCusecs.toLocaleString()} cusecs | ` : '';
    doc.text(`• ${b.bridgeName}: ${dis}Status: ${b.trafficStatus}`, margin + 2, y);
    y += 4.5;
  });

  y += 4;

  // ── SECTION 4: HEALTHCARE READINESS & WHO RELIEF QUOTAS ────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. PUBLIC HEALTHCARE ASSETS & WHO EMERGENCY RELIEF QUOTAS', margin + 3, y + 5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const med = sitrep.healthcareReadiness;
  doc.text(
    `MoHP Registry: ${med.operationalHospitals}/${med.totalHospitalsMonitored} Hospitals Fully Operational. Antivenom Stock: ${med.antivenomVialsAvailable} vials available across Terai district hubs.`,
    margin,
    y
  );

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(14, 116, 144);
  doc.text(
    `DAILY RELIEF MANDATE (WHO Standards): Water: ${med.dailyPotableWaterQuotalLiters.toLocaleString()} L/day (3L/person) | Food: ${med.dailyFoodRationsQuotaKg.toLocaleString()} kg/day | Aquatabs: ${med.aquatabsChlorineQuota.toLocaleString()} tabs | ORS: ${med.orsPacketsQuota.toLocaleString()} pkts | IV Saline: ${med.ivSalineQuotaBags.toLocaleString()} bags`,
    margin,
    y
  );

  y += 9;

  // ── SECTION 5: RECOMMENDED ACTION DIRECTIVES ───────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('5. RECOMMENDED ACTION DIRECTIVES: CONVOYS, SHELTERS & AIR-DROPS', margin + 3, y + 5);

  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('A. PRIORITY RELIEF CONVOY CORRIDORS (Strict Inundation Bypass Mode):', margin, y);

  y += 4.5;
  sitrep.actionDirectives.recommendedConvoys.slice(0, 3).forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`• [${c.vehicleType}] ${c.mission}: ${c.action.slice(0, 85)}...`, margin + 2, y);
    y += 4;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('B. DESIGNATED HIGH-GROUND SAFE HAVENS & HELICOPTER LANDING ZONES (HLZ):', margin, y);

  y += 4.5;
  sitrep.actionDirectives.primaryRefuges.slice(0, 3).forEach((h) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `• ${h.havenName} (${h.district}): Elev ${h.elevationMeters}m ASL | Cap: ${h.capacity.toLocaleString()} | Helipad: ${h.hasHelipad ? 'YES' : 'NO'} | Warden: ${h.wardenContact}`,
      margin + 2,
      y
    );
    y += 4;
  });

  // Footer & Official Seal Box
  y = 265;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Official National Emergency Operations Centre (NEOC) Situation Report. Generated autonomously by FloodGuard AI.',
    margin,
    y
  );

  y += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    'EMERGENCY TELEMETRY HOTLINES: NEOC: 1155 | Nepal Red Cross: 1130 | Armed Police Force Rescue: 1114',
    margin,
    y
  );

  doc.save(`FloodGuard_AI_SitRep_Nepal_Terai_${Date.now()}.pdf`);
};
