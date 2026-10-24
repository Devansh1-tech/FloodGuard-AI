import React from 'react';
import { ClockCounterClockwise } from '@phosphor-icons/react';

const phases = [
  { hour: -24, title: 'Baseline', detail: 'Pre-event river and flood layer reference.' },
  { hour: -12, title: 'Heavy rain', detail: 'Catchment rainfall scenario begins; lowland exposure starts to rise.' },
  { hour: -4, title: 'Gauge warning', detail: 'Upstream rise-rate scenario reaches the evacuation planning window.' },
  { hour: 0, title: 'Flood arrival', detail: 'Peak event view with flooded corridors and exposed settlements.' },
  { hour: 12, title: 'Recession', detail: 'Projected water recession; retain road closures until field checks.' },
  { hour: 24, title: 'Recovery', detail: 'Post-event review and access restoration planning.' },
];

interface DigitalTwinTimelineProps {
  value: number;
  onChange: (hours: number) => void;
}

export const DigitalTwinTimeline: React.FC<DigitalTwinTimelineProps> = ({ value, onChange }) => {
  const index = Math.max(0, phases.findIndex((phase) => phase.hour === value));
  const phase = phases[index];

  return (
    <section className="rounded-xl border border-white/10 bg-[#111C2E] px-4 py-3" aria-label="48-hour flood scenario timeline">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2">
          <ClockCounterClockwise size={18} weight="bold" className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-white">48-hour digital twin</h2>
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono text-amber-200">SCENARIO VIEW</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300"><strong className="text-cyan-200">T {value > 0 ? '+' : ''}{value}h · {phase.title}</strong> — {phase.detail}</p>
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>T−24h</span>
          <input
            aria-label="Flood scenario time"
            type="range"
            min={0}
            max={phases.length - 1}
            step={1}
            value={index}
            onChange={(event) => onChange(phases[Number(event.target.value)].hour)}
            className="w-40 accent-cyan-400 md:w-56"
          />
          <span>T+24h</span>
        </label>
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1" aria-label="Timeline checkpoints">
        {phases.map((item) => (
          <button
            type="button"
            key={item.hour}
            onClick={() => onChange(item.hour)}
            className={`border-t pt-1 text-left text-[9px] transition-colors ${item.hour === value ? 'border-cyan-300 text-cyan-200' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
          >
            {item.hour > 0 ? `T+${item.hour}` : `T${item.hour}h`}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-slate-500">The timeline changes the corridor overlay intensity as an illustrative scenario; it is not a new satellite observation.</p>
    </section>
  );
};
