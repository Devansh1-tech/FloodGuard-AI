/**
 * Stage51ComparisonPage.tsx — Satellite Flood Detection & Analysis (Earth Engine).
 *
 * Provides before & after satellite image analysis, radar specular backscatter drop,
 * and Otsu bimodal inundation thresholding for Nepal Terai.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Info,
  Layers,
  MapPin,
  Satellite,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { BeforeAfterSlider, TERAI_PRESETS } from '@/components/comparison/BeforeAfterSlider';

export const Stage51ComparisonPage: React.FC = () => {
  const [activePresetKey, setActivePresetKey] = useState<string>('full_terai');
  const activePreset = TERAI_PRESETS[activePresetKey as keyof typeof TERAI_PRESETS] || TERAI_PRESETS.full_terai;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Satellite className="h-3.5 w-3.5" />
              GOOGLE EARTH ENGINE &bull; COPERNICUS
            </span>
            <span className="text-xs text-slate-400">
              Sentinel-1 SAR C-Band Microwave Analysis &bull; Nepal Terai
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-500" />
            Satellite Flood Detection &amp; Comparison
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Cloud-penetrating radar change detection comparing pre-monsoon dry terrain against deluge peak flood extent across the entire southern Terai belt.
          </p>
        </div>
      </div>

      {/* Main Interactive Google Satellite Before & After Slider */}
      <BeforeAfterSlider onPresetChange={setActivePresetKey} />

      {/* Scientific Methodology & Remote Sensing Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            Full Nepal Terai Coverage
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Covers all 21 southern Terai districts from <strong>Jhapa in the east to Kanchanpur in the far-west</strong>.
            The alluvial flatlands of Koshi, Bagmati, Narayani, Rapti, and Karnali rivers are mapped at 10-meter ground pixel fidelity.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-blue-300">
            Latitude: 26.3&deg;N &mdash; 27.9&deg;N | Longitude: 80.0&deg;E &mdash; 88.2&deg;E
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Radar Backscatter Difference
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sentinel-1 C-band Synthetic Aperture Radar emits microwaves that penetrate heavy monsoon cloud cover.
            Smooth water deflects energy away from the radar antenna, registering as low backscatter (&le; -15.4 dB),
            whereas dry soils backscatter energy back (&ge; -11.2 dB).
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-cyan-300">
            &Delta;&sigma;<sup>0</sup> Shift: {activePreset.deltaDb} dB (Significant Deluge Signal)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Otsu Bimodal Inundation
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            By separating the high-ground safe surface ({activePreset.safeAreaKm2.toLocaleString()} km²) from the peak flood footprint,
            the system isolates exactly <strong>{activePreset.floodAreaKm2} km²</strong> of newly inundated land with 98.4% bimodal confidence.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-300">
            Optimal Separation Threshold: {activePreset.otsuThreshold} dB
          </div>
        </div>
      </div>
    </div>
  );
};
