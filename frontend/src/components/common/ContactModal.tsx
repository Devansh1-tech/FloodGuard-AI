import React, { useState } from 'react';
import {
  PhoneCall,
  X,
  Phone,
  ShieldAlert,
  Send,
  Building,
  Radio,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

const TERAI_DISTRICTS = [
  'Jhapa', 'Morang', 'Sunsari', 'Saptari', 'Siraha', 'Dhanusha', 'Mahottari',
  'Sarlahi', 'Rautahat', 'Bara', 'Parsa', 'Chitwan', 'Nawalpur', 'Parasi',
  'Rupandehi', 'Kapilvastu', 'Dang', 'Banke', 'Bardiya', 'Kailali', 'Kanchanpur'
];

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    district: 'Rautahat',
    incidentType: 'Flash Flood / River Breach',
    details: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-500/20">
              <PhoneCall className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="contact-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                Emergency Contacts & Hotline
                <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
                  NEOC 1155
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                National Disaster Hotlines & Field Operational Command
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

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Official Hotlines Grid */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 font-bold">
              Immediate Disaster Response Hotlines (Toll-Free)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <a
                href="tel:1155"
                className="flex items-center justify-between p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/30 transition-all text-slate-200 group"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                    NEOC Central Hotline
                  </div>
                  <div className="text-base font-extrabold text-white">1155</div>
                  <div className="text-[10px] text-slate-400">24/7 Operations Room</div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
              </a>

              <a
                href="tel:1114"
                className="flex items-center justify-between p-3 rounded-xl border border-blue-500/40 bg-blue-950/20 hover:bg-blue-900/30 transition-all text-slate-200 group"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                    Armed Police Force (APF)
                  </div>
                  <div className="text-base font-extrabold text-white">1114</div>
                  <div className="text-[10px] text-slate-400">Water Rescue & Logistics</div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </a>

              <a
                href="tel:102"
                className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/30 transition-all text-slate-200 group"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Red Cross Ambulance
                  </div>
                  <div className="text-base font-extrabold text-white">102</div>
                  <div className="text-[10px] text-slate-400">Medical Evacuation</div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Radio className="h-4 w-4" />
                </div>
              </a>
            </div>
          </div>

          {/* Department Directory */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2.5 text-xs text-slate-300">
            <h3 className="font-mono uppercase tracking-wider text-slate-400 text-[11px] font-bold">
              Institutional Contact Directory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <strong className="text-white">Dept of Hydrology & Meteorology (DHM):</strong>
                <p className="text-slate-400">Babarmahal, Kathmandu &bull; +977-1-4259833 / 1155</p>
              </div>
              <div>
                <strong className="text-white">MoHP Health Emergency Desk (HEOC):</strong>
                <p className="text-slate-400">Ramshahpath, Kathmandu &bull; +977-1-4262590</p>
              </div>
              <div>
                <strong className="text-white">Nepal Police Emergency Dispatch:</strong>
                <p className="text-slate-400">Control Room &bull; Dial 100</p>
              </div>
              <div>
                <strong className="text-white">Nepal Red Cross Society Headquarters:</strong>
                <p className="text-slate-400">Red Cross Marga, Tahachal &bull; +977-1-4270650</p>
              </div>
            </div>
          </div>

          {/* Field Incident Signal Dispatch Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-2">
              <Send className="h-3.5 w-3.5" />
              Dispatch Incident / SOS Signal to Command Room
            </h3>

            {submitted ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Emergency Signal Logged</h4>
                <p className="text-xs text-slate-300">
                  Your incident alert for {formData.district} ({formData.incidentType}) has been dispatched to NEOC and local district authorities.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Reporting Officer / Citizen Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Thapa (Local Volunteer)"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Contact Phone / Radio
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +977-984XXXXXXX"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Terai District
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {TERAI_DISTRICTS.map((name) => (
                        <option key={name} value={name}>
                          {name} District
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Incident Category
                    </label>
                    <select
                      value={formData.incidentType}
                      onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="Flash Flood / River Breach">Flash Flood / River Breach</option>
                      <option value="Road Cutoff / Bridge Inundated">Road Cutoff / Bridge Inundated</option>
                      <option value="Snakebite Emergency / Antivenom Shortage">Snakebite Emergency / Antivenom Shortage</option>
                      <option value="Refugee Shelter Surge">Refugee Shelter Surge</option>
                      <option value="Medical Air-Lift Required">Medical Air-Lift Required</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Specific Location & Situation Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Enter village/ward name, water depth, stranded persons count, or hospital status..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-4 py-2 flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Dispatch Emergency Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>National Emergency Operation Centre &bull; Singha Durbar, Kathmandu</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-1.5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
