/**
 * MapLegend.tsx — GIS cartographic legend overlay.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface LegendItem {
  label: string;
  color: string;
  type: 'polygon' | 'line' | 'point';
  description?: string;
}

export const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems: LegendItem[] = [
    { label: 'Delineated Inundation', color: '#2563EB', type: 'polygon', description: 'Sentinel-1 SAR thresholded water extent' },
    { label: 'Submerged Road Segments', color: '#EF4444', type: 'line', description: 'OSM severed transport arteries' },
    { label: 'Hospital / Clinic', color: '#EF4444', type: 'point', description: 'Critical health lifeline' },
    { label: 'School / Academic', color: '#3B82F6', type: 'point', description: 'Emergency evacuation shelter candidate' },
    { label: 'Police / Law Enforcement', color: '#10B981', type: 'point', description: 'First responder post' },
    { label: 'Basin AOI Boundary', color: '#06B6D4', type: 'polygon', description: 'Study catchment perimeter' },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-[1000] w-64 rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden text-xs">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700/50 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 font-bold text-white">
          <Layers className="h-4 w-4 text-blue-400" />
          <span>Cartographic Legend</span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5 max-h-56 overflow-y-auto">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {item.type === 'polygon' && (
                  <span
                    className="inline-block h-3.5 w-5 rounded border border-white/20 opacity-80"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {item.type === 'line' && (
                  <span
                    className="inline-block h-1 w-5 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {item.type === 'point' && (
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">{item.label}</span>
                {item.description && (
                  <span className="text-[10px] text-slate-400 leading-tight">{item.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
