import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  ChevronDown,
  Search,
  Satellite,
  Waves,
  Route,
  ShieldAlert,
  FileDown,
  HeartPulse,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FAQ_LIST: FaqItem[] = [
  {
    id: 'sar-radar',
    category: 'Radar & Satellites',
    question: 'How does FloodGuard AI detect floods through heavy monsoon clouds?',
    answer:
      'Optical satellites like Sentinel-2 cannot see through dense monsoon rain and cloud cover. FloodGuard AI utilizes Sentinel-1 Synthetic Aperture Radar (SAR), which emits microwave pulses at 5.405 GHz (C-band). Microwaves pierce clouds, heavy precipitation, and nighttime darkness. Smooth standing floodwaters reflect the radar pulse away from the sensor (specular reflection), appearing dark/black, which our dual-polarization (VV/VH) algorithms contrast against pre-flood terrain.',
    icon: Satellite,
  },
  {
    id: 'districts-scope',
    category: 'Coverage',
    question: 'Which districts in Nepal are covered by the system?',
    answer:
      'The platform specifically monitors the 21 Southern Nepal Terai lowland districts across all 5 Terai provinces: Jhapa, Morang, Sunsari, Saptari, Siraha, Dhanusha, Mahottari, Sarlahi, Rautahat, Bara, Parsa, Chitwan, Nawalpur, Parasi, Rupandehi, Kapilvastu, Dang, Banke, Bardiya, Kailali, and Kanchanpur.',
    icon: ShieldAlert,
  },
  {
    id: 'river-gauges',
    category: 'Early Warning',
    question: 'How are river danger thresholds and vernacular alerts triggered?',
    answer:
      'FloodGuard AI connects to Department of Hydrology & Meteorology (DHM) river gauge telemetry. Each station tracks water levels against Warning Level (Pahilo Chetavani) and Danger Level (Khatara Taha). When a gauge crosses the Danger Level, the system immediately compiles and broadcasts localized emergency alerts in both Nepali and Maithili for local radio and SMS distribution.',
    icon: Waves,
  },
  {
    id: 'routing-detours',
    category: 'Evacuation & Routing',
    question: 'How does the routing engine avoid submerged highways and washed-out bridges?',
    answer:
      'The engine models the Nepal highway graph (Mahendra Highway, Postal Highway, and key feeder corridors). When flood detection detects surface inundation over road segments or bridge coordinates, dynamic resistance penalties are assigned to those edges in the Dijkstra routing graph, forcing convoy routers to route exclusively through safe, elevated detour corridors.',
    icon: Route,
  },
  {
    id: 'hospitals-antivenom',
    category: 'Healthcare',
    question: 'Why is snakebite antivenom tracked alongside flood levels?',
    answer:
      'During monsoon inundations in the Terai, venomous snakes (Kraits, Cobras, and Vipers) seek high ground inside villages and refugee camps, creating a severe secondary disaster emergency. FloodGuard AI actively catalogs anti-snake venom vial stocks, ICU beds, and ventilator availability at district referral hospitals (e.g. Gaur Hospital, Narayani Hospital, Bheri Hospital).',
    icon: HeartPulse,
  },
  {
    id: 'sitrep-pdf',
    category: 'Reports & Export',
    question: 'Can emergency responders generate official situation reports (SitRep) for offline use?',
    answer:
      'Yes. Responders can click "Govt SitRep (PDF)" or use the SitRep Export tool (Stage 5.8) to compile an official UN-SPIDER standard Situation Report including flood coverage hectares, isolated towns, damaged roads, refugee camp deployments, and hospital bed statuses in a print-ready vector PDF.',
    icon: FileDown,
  },
];

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('sar-radar');

  if (!isOpen) return null;

  const filteredFaqs = FAQ_LIST.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-md shadow-cyan-500/20">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="faq-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                Frequently Asked Questions
                <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                  Knowledge Base
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Guidance on Satellite Radar, River Telemetry & Emergency Detours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-slate-800 px-6 py-3 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flood radar, river telemetry, emergency routing, hospital stock..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* FAQ List */}
        <div className="overflow-y-auto p-6 space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching answers found for &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const Icon = faq.icon;
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? 'border-cyan-500/40 bg-slate-800/60 shadow-md'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isExpanded ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 font-bold">
                          {faq.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-white">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Need live field assistance? Call NEOC 1155</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-1.5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
