import { RiverGaugeStation } from '@/data/teraiRiverGauges';

export type AlertLanguage = 'ne' | 'mai' | 'bho' | 'en';

export interface LocalizedAlertCopy {
  label: string;
  sms: string;
  whatsapp: string;
  radio: string;
}

const limitSms = (text: string) => Array.from(text).slice(0, 160).join('');

export function buildLocalizedAlert(gauge: RiverGaugeStation, language: AlertLanguage): LocalizedAlertCopy {
  const settlement = gauge.downstreamSettlements[0]?.settlementName || gauge.district;
  const settlementNe = gauge.downstreamSettlements[0]?.nepaliName || gauge.district;
  const level = gauge.currentLevelMeters.toFixed(2);
  const danger = gauge.dangerLevelMeters.toFixed(2);
  const rise = Math.max(0, gauge.rateOfRiseCmPerHour);

  if (language === 'ne') return {
    label: 'नेपाली',
    sms: limitSms(`बाढी चेतावनी: ${gauge.nepaliRiver} जलस्तर ${level}m, खतरा ${danger}m। ${settlementNe} सुरक्षित स्थानतर्फ जानुहोस्। हेल्पलाइन ११५५/१११४।`),
    whatsapp: `*बाढी पूर्वसूचना*\nनदी/केन्द्र: ${gauge.nepaliRiver} / ${gauge.nepaliName}\nहालको जलस्तर: ${level} मिटर (खतरा: ${danger} मिटर)\nवृद्धिदर: ${rise} से.मी./घण्टा\nप्रभावित क्षेत्र: ${settlementNe}, ${gauge.district}\nसुरक्षित उच्च स्थानतर्फ जानुहोस्।\nआपतकालीन: ११५५ | उद्धार: १११४`,
    radio: `सामुदायिक सूचना। ${gauge.nepaliRiver} मा जलस्तर ${level} मिटर पुगेको छ। ${settlementNe} का नदी किनारका बासिन्दा सुरक्षित उच्च स्थानतर्फ जानुहोस्। थप सहयोगका लागि ११५५ वा १११४ मा सम्पर्क गर्नुहोस्।`,
  };
  if (language === 'mai') return {
    label: 'मैथिली',
    sms: limitSms(`बाढ़ि चेतावनी: ${gauge.river} मे जलस्तर ${level}m, खतरा ${danger}m। ${settlement} सुरक्षित स्थान पर जाउ। हेल्पलाइन 1155/1114।`),
    whatsapp: `*बाढ़ि पूर्वसूचना*\nनदी/केन्द्र: ${gauge.river} / ${gauge.name}\nअखन जलस्तर: ${level} मीटर (खतरा: ${danger} मीटर)\nबढ़बाक दर: ${rise} से.मी./घंटा\nप्रभावित क्षेत्र: ${settlement}, ${gauge.district}\nनदीक कात छोड़ि सुरक्षित ऊँच स्थान पर जाउ।\nआपातकाल: 1155 | बचाव: 1114`,
    radio: `समुदाय लेल जरूरी सूचना। ${gauge.river} मे जलस्तर ${level} मीटर अछि। ${settlement} मे नदीक कात रहनिहार लोक सुरक्षित ऊँच स्थान पर जाउ। मदतिक लेल 1155 अथवा 1114 पर फोन करू।`,
  };
  if (language === 'bho') return {
    label: 'भोजपुरी',
    sms: limitSms(`बाढ़ चेतावनी: ${gauge.river} में पानी ${level}m, खतरा ${danger}m। ${settlement} सुरक्षित जगह पर जाईं। हेल्पलाइन 1155/1114।`),
    whatsapp: `*बाढ़ के पहिले चेतावनी*\nनदी/केन्द्र: ${gauge.river} / ${gauge.name}\nअभी पानी: ${level} मीटर (खतरा: ${danger} मीटर)\nबढ़े के रफ्तार: ${rise} से.मी./घंटा\nप्रभावित इलाका: ${settlement}, ${gauge.district}\nनदी किनारा छोड़ के ऊँच सुरक्षित जगह पर जाईं।\nआपातकाल: 1155 | बचाव: 1114`,
    radio: `समुदाय खातिर जरूरी खबर। ${gauge.river} में पानी ${level} मीटर पर पहुँच गइल बा। ${settlement} के नदी किनारे रहे वाला लोग सुरक्षित ऊँच जगह पर चलीं। मदद खातिर 1155 या 1114 पर फोन करीं।`,
  };
  return {
    label: 'English',
    sms: limitSms(`FLOOD ALERT: ${gauge.river} at ${level}m (danger ${danger}m). ${settlement}: move to high ground. Help 1155/1114.`),
    whatsapp: `*Flood Early Warning*\nRiver / gauge: ${gauge.river} / ${gauge.name}\nCurrent stage: ${level} m (danger: ${danger} m)\nRise rate: ${rise} cm/hour\nAt-risk area: ${settlement}, ${gauge.district}\nLeave riverbanks and move to higher ground.\nEmergency: 1155 | Rescue: 1114`,
    radio: `Community alert. The ${gauge.river} is at ${level} metres. Residents near the river in ${settlement} should move to higher ground. Call 1155 or 1114 for assistance.`,
  };
}
