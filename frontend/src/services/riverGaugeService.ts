/**
 * riverGaugeService.ts — Nepal DHM River Telemetry & Vernacular SOS Alert Client.
 *
 * Implements Stage 5.9:
 * - Real-time hydration from FastAPI endpoint /api/v1/telemetry/river-gauges with robust fallback.
 * - Multi-channel bilingual SOS alert generator (Nepali + English).
 * - SMS (<=160 char GSM), WhatsApp rich text, and Community FM Radio broadcast script.
 */

import {
  TERAI_RIVER_GAUGES,
  RiverGaugeStation,
  GaugeStatus,
  GaugeTrend,
} from '@/data/teraiRiverGauges';

export interface VernacularAlertChannels {
  smsNepaliCompact: string;
  smsEnglishCompact: string;
  whatsappNepaliRich: string;
  whatsappEnglishRich: string;
  communityRadioScriptNepali: string;
  communityRadioScriptEnglish: string;
  shareableWhatsappUrl: string;
}

export interface VernacularAlertData {
  stationId: string;
  stationName: string;
  nepaliStationName: string;
  river: string;
  nepaliRiver: string;
  district: string;
  currentLevelMeters: number;
  dangerLevelMeters: number;
  severity: GaugeStatus;
  channels: VernacularAlertChannels;
  timestampNst: string;
}

export interface TelemetrySummary {
  totalStationsMonitored: number;
  stationsInDangerOrExtreme: number;
  stationsInWarning: number;
  stationsNormal: number;
  maximumDischargeStation: string;
  maximumDischargeCusecs: number;
  totalDownstreamPopulationAtRisk: number;
  reportingBasinScope: string;
}

const BACKEND_BASE_URL = 'http://127.0.0.1:8000/api/v1/telemetry';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLIENT-SIDE FALLBACK ALERT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export const generateClientVernacularAlert = (gauge: RiverGaugeStation): VernacularAlertData => {
  const riverNe = gauge.nepaliRiver;
  const stationNe = gauge.nepaliName;
  const level = gauge.currentLevelMeters;
  const danger = gauge.dangerLevelMeters;
  const district = gauge.district;
  const downstream = gauge.downstreamSettlements || [];
  const primarySettlementNe = downstream[0]?.nepaliName || district;
  const primarySettlementEn = downstream[0]?.settlementName || district;

  // 1. Compact GSM SMS (160 characters max)
  const smsNe = (
    `🚨बाढी संकटकालीन चेतावनी: ${riverNe}(${level}m) खतरा विन्दु(${danger}m) पार! ` +
    `${primarySettlementNe.slice(0, 25)} सुरक्षित जानुहोस्। हटलाइन:1155/1114`
  );
  const smsEn = (
    `🚨FLOOD ALERT: ${gauge.river} (${level}m) breached DANGER (${danger}m)! ` +
    `${primarySettlementEn.slice(0, 35)} evacuate now. Helpline: 1155/1114`
  );

  // 2. Rich WhatsApp
  const waNe = (
    `*🚨 बाढी संकटकालीन पूर्वसूचना (बाढी गार्ड एआई)*\n\n` +
    `📍 *नदी / केन्द्र:* ${riverNe} (${stationNe})\n` +
    `🌊 *हालको जलसतह:* *${level} मिटर* (खतरा विन्दु: ${danger} मिटर)\n` +
    `📈 *प्रवृत्ति:* ${gauge.rateOfRiseCmPerHour} से.मी./घण्टाले वृद्धि हुँदै\n` +
    `⚠️ *प्रभावित तटीय क्षेत्र:* ${primarySettlementNe} तथा आसपासका बस्तीहरू\n` +
    `🛡️ *कारबाही निर्देशन:* तल्लो तटीय क्षेत्र तुरुन्त खाली गरी नजिकैको उच्च आश्रयस्थल वा पक्की भवनतर्फ जानुहोस्।\n\n` +
    `📞 *राष्ट्रिय आपतकालीन हटलाइन:* ११५५\n` +
    `🚨 *सशस्त्र प्रहरी बल उद्धार:* १११४ | *नेपाल रेडक्रस:* ११३०\n` +
    `🌐 *प्रत्यक्ष स्याटेलाइट नक्सा:* FloodGuard AI Terai Corridor`
  );

  const waEn = (
    `*🚨 FLOOD EMERGENCY DIRECTIVE (FloodGuard AI)*\n\n` +
    `📍 *River / Gauge:* ${gauge.river} (${gauge.name})\n` +
    `🌊 *Current Water Height:* *${level}m* (Danger Threshold: ${danger}m)\n` +
    `📈 *Rise Rate:* Rising at +${gauge.rateOfRiseCmPerHour} cm/hour\n` +
    `⚠️ *At-Risk Settlements:* ${primarySettlementEn} and surrounding wards\n` +
    `🛡️ *Directive:* Immediate mandatory evacuation to certified high-ground safe havens and concrete structures.\n\n` +
    `📞 *NEOC Emergency Hotline:* 1155\n` +
    `🚨 *Armed Police Force Rescue:* 1114 | *Red Cross:* 1130\n` +
    `🌐 *Live Satellite Monitor:* FloodGuard AI Nepal Terai Command`
  );

  // 3. Community FM Radio broadcast script (सामुदायिक रेडियो प्रत्यक्ष प्रसारण सूचना)
  const radioNe = (
    `नमस्कार, यो बाढी गार्ड एआई र नेपाल सरकार गृह मन्त्रालयको बाढी संकटकालीन विशेष सूचना हो। ` +
    `${stationNe}मा ${riverNe}को बहाव तीव्र गतिमा बढेर हाल ${level} मिटर पुगेको छ, जसले खतराको विन्दु ${danger} मिटर पार गरेको छ। ` +
    `यस केन्द्रबाट तल्लो भेगमा रहेका ${primarySettlementNe}का सबै दाजुभाइ तथा दिदीबहिनीहरूले नदी किनार तत्काल छोडी सुरक्षित ` +
    `उच्च आश्रयस्थलतर्फ लाग्न अनुरोध गरिन्छ। बालबालिका, गर्भवती महिला र जेष्ठ नागरिकलाई प्राथमिकता दिनुहोला। ` +
    `उद्धार तथा थप जानकारीका लागि राष्ट्रिय आपतकालीन कार्यसञ्चालन केन्द्रको निःशुल्क नम्बर ११५५ मा सम्पर्क गर्नुहोस्।`
  );

  const radioEn = (
    `This is an urgent flood bulletin broadcast from FloodGuard AI and the Ministry of Home Affairs. ` +
    `The ${gauge.river} monitored at ${gauge.name} has surged past the critical danger threshold of ${danger} meters, ` +
    `currently measuring ${level} meters and rising rapidly. Residents of downstream riparian communities including ` +
    `${primarySettlementEn} must evacuate immediately to designated high-ground refuges. Prioritize elders and children. ` +
    `For Armed Police Force rescue or relief logistics, dial toll-free 1155 or 1114 immediately.`
  );

  const shareableUrl = `https://wa.me/?text=${encodeURIComponent(waNe)}`;

  return {
    stationId: gauge.id,
    stationName: gauge.name,
    nepaliStationName: gauge.nepaliName,
    river: gauge.river,
    nepaliRiver: gauge.nepaliRiver,
    district: gauge.district,
    currentLevelMeters: gauge.currentLevelMeters,
    dangerLevelMeters: gauge.dangerLevelMeters,
    severity: gauge.status,
    channels: {
      smsNepaliCompact: smsNe,
      smsEnglishCompact: smsEn,
      whatsappNepaliRich: waNe,
      whatsappEnglishRich: waEn,
      communityRadioScriptNepali: radioNe,
      communityRadioScriptEnglish: radioEn,
      shareableWhatsappUrl: shareableUrl,
    },
    timestampNst: gauge.lastUpdatedNst,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. FETCH STATIONS (API WITH FALLBACK)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchRiverGauges = async (filters?: {
  basin?: string;
  district?: string;
  status?: string;
}): Promise<RiverGaugeStation[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.basin && filters.basin !== 'all') params.append('basin', filters.basin);
    if (filters?.district && filters.district !== 'all') params.append('district', filters.district);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

    const url = `${BACKEND_BASE_URL}/river-gauges${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((item: any) => ({
          id: item.id,
          dhmStationNumber: item.dhm_station_number,
          name: item.name,
          nepaliName: item.nepali_name,
          river: item.river,
          nepaliRiver: item.nepali_river,
          basin: item.basin,
          district: item.district,
          coords: item.coords,
          currentLevelMeters: item.current_level_meters,
          warningLevelMeters: item.warning_level_meters,
          dangerLevelMeters: item.danger_level_meters,
          highestHistoricalLevelMeters: item.highest_historical_level_meters,
          historicalRecordYear: item.historical_record_year,
          dischargeCusecs: item.discharge_cusecs,
          status: item.status,
          trend: item.trend,
          rateOfRiseCmPerHour: item.rate_of_rise_cm_per_hour,
          isBarrageControlled: item.is_barrage_controlled,
          totalSluiceGates: item.total_sluice_gates,
          sluiceGatesOpen: item.sluice_gates_open,
          stationOfficer: item.station_officer,
          contactNumber: item.contact_number,
          lastUpdatedNst: item.last_updated_nst,
          hourlyHistory: (item.hourly_history || []).map((h: any) => ({
            time: h.time,
            levelMeters: h.level_meters,
            dischargeCusecs: h.discharge_cusecs,
          })),
          downstreamSettlements: (item.downstream_settlements || []).map((s: any) => ({
            settlementName: s.settlement_name,
            nepaliName: s.nepali_name,
            district: s.district,
            estimatedLeadTimeHours: s.estimated_lead_time_hours,
            populationAtRisk: s.population_at_risk,
            recommendedSafeHavenId: s.recommended_safe_haven_id,
            evacuationRouteHint: s.evacuation_route_hint,
          })),
        }));
      }
    }
  } catch {
    // Backend offline; use local empirical dataset
  }

  // Client-side fallback filter
  let results = TERAI_RIVER_GAUGES;
  if (filters?.basin && filters.basin !== 'all') {
    results = results.filter((g) => g.basin.toLowerCase().includes(filters.basin!.toLowerCase()));
  }
  if (filters?.district && filters.district !== 'all') {
    results = results.filter((g) => g.district.toLowerCase().includes(filters.district!.toLowerCase()));
  }
  if (filters?.status && filters.status !== 'all') {
    results = results.filter((g) => g.status.toLowerCase() === filters.status!.toLowerCase());
  }
  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FETCH VERNACULAR ALERT (API WITH FALLBACK)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchVernacularAlert = async (stationId: string): Promise<VernacularAlertData> => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/vernacular-alert?station_id=${stationId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        return {
          stationId: d.station_id,
          stationName: d.station_name,
          nepaliStationName: d.nepali_station_name,
          river: d.river,
          nepaliRiver: d.nepali_river,
          district: d.district,
          currentLevelMeters: d.current_level_meters,
          dangerLevelMeters: d.danger_level_meters,
          severity: d.severity,
          channels: {
            smsNepaliCompact: d.channels.sms_nepali_compact,
            smsEnglishCompact: d.channels.sms_english_compact,
            whatsappNepaliRich: d.channels.whatsapp_nepali_rich,
            whatsappEnglishRich: d.channels.whatsapp_english_rich,
            communityRadioScriptNepali: d.channels.community_radio_script_nepali,
            communityRadioScriptEnglish: d.channels.community_radio_script_english,
            shareableWhatsappUrl: d.channels.shareable_whatsapp_url,
          },
          timestampNst: d.timestamp_nst,
        };
      }
    }
  } catch {
    // Backend offline; generate client-side
  }

  const station = TERAI_RIVER_GAUGES.find((g) => g.id === stationId) || TERAI_RIVER_GAUGES[0];
  return generateClientVernacularAlert(station);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. TELEMETRY SUMMARY COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
export const computeTelemetrySummary = (gauges: RiverGaugeStation[]): TelemetrySummary => {
  const total = gauges.length;
  const danger = gauges.filter((g) => g.status === 'danger' || g.status === 'extreme_flood').length;
  const warning = gauges.filter((g) => g.status === 'warning').length;
  const normal = gauges.filter((g) => g.status === 'normal').length;

  const maxStation = [...gauges].sort((a, b) => b.dischargeCusecs - a.dischargeCusecs)[0] || gauges[0];
  const totalPop = gauges.reduce(
    (sum, g) => sum + g.downstreamSettlements.reduce((sSum, s) => sSum + s.populationAtRisk, 0),
    0
  );

  return {
    totalStationsMonitored: total,
    stationsInDangerOrExtreme: danger,
    stationsInWarning: warning,
    stationsNormal: normal,
    maximumDischargeStation: `${maxStation?.name || 'Saptakoshi'} (${maxStation?.river || 'Saptakoshi'})`,
    maximumDischargeCusecs: maxStation?.dischargeCusecs || 462000,
    totalDownstreamPopulationAtRisk: totalPop,
    reportingBasinScope: '21 Districts of Southern Nepal Terai Lowlands (Jhapa to Kanchanpur)',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. BILINGUAL LABELS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const BILINGUAL_GAUGE_LABELS = {
  status: {
    extreme_flood: { en: 'Level 4 Extreme Flood', ne: 'अत्यन्त उच्च बाढी (खतरा)' },
    danger: { en: 'Danger Level Breached', ne: 'खतराको विन्दु पार' },
    warning: { en: 'Warning Watch', ne: 'सतर्कता तह' },
    normal: { en: 'Normal Flow', ne: 'सामान्य बहाव' },
  },
  trend: {
    rising_rapidly: { en: 'Surging Rapidly', ne: 'तीव्र गतिमा बढ्दो' },
    rising: { en: 'Rising', ne: 'बढ्दो क्रममा' },
    steady: { en: 'Steady', ne: 'स्थिर' },
    receding: { en: 'Receding', ne: 'घट्दो क्रममा' },
  },
};
