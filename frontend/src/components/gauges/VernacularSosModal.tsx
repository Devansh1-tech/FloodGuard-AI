/**
 * VernacularSosModal.tsx — Multi-Channel Nepali Vernacular Emergency Alert Generator.
 *
 * Implements Stage 5.9 (Point 11 - Innovation):
 * - One-click generation of disaster alerts in pure vernacular Nepali and English.
 * - Multi-Channel support:
 *   1. Compact GSM SMS (160 characters max) for rapid carrier bulk broadcast.
 *   2. WhatsApp / Social Media rich text formatted with emojis and direct wa.me link.
 *   3. Community FM Radio broadcast script (सामुदायिक रेडियो प्रत्यक्ष प्रसारण सूचना).
 * - Instant Copy-to-Clipboard with visual confirmation.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Phone,
  Radio,
  Share2,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { RiverGaugeStation } from '@/data/teraiRiverGauges';
import {
  generateClientVernacularAlert,
  VernacularAlertData,
} from '@/services/riverGaugeService';
import { AlertLanguage, buildLocalizedAlert } from '@/services/vernacularAlertService';

interface VernacularSosModalProps {
  gauge: RiverGaugeStation | null;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ne';
}

export const VernacularSosModal: React.FC<VernacularSosModalProps> = ({
  gauge,
  isOpen,
  onClose,
  language,
}) => {
  const [activeChannel, setActiveChannel] = useState<'sms' | 'whatsapp' | 'radio'>('sms');
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [alertLanguage, setAlertLanguage] = useState<AlertLanguage>(language);

  useEffect(() => setAlertLanguage(language), [language]);

  if (!isOpen || !gauge) return null;

  const alertData: VernacularAlertData = generateClientVernacularAlert(gauge);
  const localized = buildLocalizedAlert(gauge, alertLanguage);
  const ch = {
    ...alertData.channels,
    smsNepaliCompact: localized.sms,
    whatsappNepaliRich: localized.whatsapp,
    communityRadioScriptNepali: localized.radio,
    shareableWhatsappUrl: `https://wa.me/?text=${encodeURIComponent(localized.whatsapp)}`,
  };

  const handleCopy = (text: string, channelKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelKey);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/80">
                  {language === 'ne' ? 'आपतकालीन प्रसारण' : 'EMERGENCY BROADCAST'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {gauge.dhmStationNumber} &bull; {gauge.district}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {alertLanguage === 'ne' ? `${gauge.nepaliRiver} - संकटकालीन सूचना` : `${localized.label} flood alert: ${gauge.river}`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-950 px-6 py-2 border-b border-slate-800/80">
          <label htmlFor="sos-language" className="text-xs font-semibold text-slate-300">
            {language === 'ne' ? 'सूचनाको भाषा' : 'Alert language'}
          </label>
          <select
            id="sos-language"
            value={alertLanguage}
            onChange={(event) => setAlertLanguage(event.target.value as AlertLanguage)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
          >
            <option value="ne">नेपाली</option>
            <option value="mai">मैथिली</option>
            <option value="bho">भोजपुरी</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Telemetry Snapshot Strip */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Station:</span>
            <span className="font-bold text-white">{gauge.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Level:</span>
            <strong className="text-rose-400 font-black">{gauge.currentLevelMeters}m</strong>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Danger:</span>
            <strong className="text-amber-300">{gauge.dangerLevelMeters}m</strong>
          </div>
        </div>

        {/* Channel Selection Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveChannel('sms')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeChannel === 'sms'
                ? 'bg-slate-900 border-slate-700 text-cyan-300 shadow-lg'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>1. SMS Broadcast (160 char)</span>
          </button>

          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeChannel === 'whatsapp'
                ? 'bg-slate-900 border-slate-700 text-emerald-300 shadow-lg'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>2. WhatsApp / Social Media</span>
          </button>

          <button
            onClick={() => setActiveChannel('radio')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeChannel === 'radio'
                ? 'bg-slate-900 border-slate-700 text-amber-300 shadow-lg'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>3. Community Radio FM Script</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-200">
          {/* ── CHANNEL 1: COMPACT GSM SMS ─────────────────────────────────── */}
          {activeChannel === 'sms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                    {language === 'ne' ? `${localized.label} मोबाइल सन्देश (SMS):` : `${localized.label} SMS broadcast:`}
                </span>
                <span className="font-mono text-[11px] text-cyan-400">
                  Length: {Array.from(ch.smsNepaliCompact).length} / 160 characters
                </span>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-sm leading-relaxed text-slate-100 shadow-inner">
                {ch.smsNepaliCompact}
                <button
                  onClick={() => handleCopy(ch.smsNepaliCompact, 'sms_ne')}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-sans font-bold text-slate-200 hover:text-white transition-all shadow cursor-pointer"
                >
                  {copiedChannel === 'sms_ne' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedChannel === 'sms_ne' ? 'Copied' : 'Copy SMS'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span className="font-semibold text-slate-300">English Cellular SMS (Fallback):</span>
                <span className="font-mono text-[11px] text-cyan-400">
                  Length: {ch.smsEnglishCompact.length} / 160 GSM Chars
                </span>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs leading-relaxed text-slate-300 shadow-inner">
                {ch.smsEnglishCompact}
                <button
                  onClick={() => handleCopy(ch.smsEnglishCompact, 'sms_en')}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-sans font-bold text-slate-200 hover:text-white transition-all shadow cursor-pointer"
                >
                  {copiedChannel === 'sms_en' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedChannel === 'sms_en' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── CHANNEL 2: WHATSAPP & SOCIAL MEDIA ─────────────────────────── */}
          {activeChannel === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                    {language === 'ne' ? `${localized.label} व्हाट्सएप विस्तृत सूचना:` : `${localized.label} WhatsApp bulletin:`}
                </span>
                <a
                  href={ch.shareableWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Send via WhatsApp</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-emerald-900/40 p-4 font-sans text-xs leading-relaxed text-slate-100 whitespace-pre-wrap shadow-inner">
                {ch.whatsappNepaliRich}
                <button
                  onClick={() => handleCopy(ch.whatsappNepaliRich, 'wa_ne')}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 hover:text-white transition-all shadow cursor-pointer"
                >
                  {copiedChannel === 'wa_ne' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedChannel === 'wa_ne' ? 'Copied' : 'Copy WhatsApp Text'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── CHANNEL 3: COMMUNITY RADIO FM SCRIPT ───────────────────────── */}
          {activeChannel === 'radio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {language === 'ne'
                    ? `${localized.label} सामुदायिक रेडियो (FM) सूचना:`
                    : `${localized.label} community FM radio script:`}
                </span>
                <span className="font-mono text-[11px] text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                  Est. Spoken Time: ~45 sec
                </span>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-amber-900/40 p-4 font-serif text-sm leading-relaxed text-amber-100/90 shadow-inner">
                &ldquo;{ch.communityRadioScriptNepali}&rdquo;
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleCopy(ch.communityRadioScriptNepali, 'radio_ne')}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-sans font-bold text-white transition-all shadow cursor-pointer"
                  >
                    {copiedChannel === 'radio_ne' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedChannel === 'radio_ne' ? 'Copied Script' : 'Copy Radio Script'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Downstream Riparian Impact Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {language === 'ne' ? 'लक्षित तल्लो तटीय बस्तीहरू तथा आश्रयस्थल' : 'Target Downstream Riparian Municipalities & Havens'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {gauge.downstreamSettlements.map((s, idx) => (
                <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{s.settlementName}</span>
                    <span className="text-rose-400 font-mono text-[10px]">~{s.estimatedLeadTimeHours}h lead</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{s.evacuationRouteHint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Phone className="h-3.5 w-3.5 text-rose-400" />
            <span>NEOC Hotline: <strong>1155</strong> &bull; APF Rescue: <strong>1114</strong></span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            {language === 'ne' ? 'बन्द गर्नुहोस्' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
