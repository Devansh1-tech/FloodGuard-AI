/**
 * SeverityDonutChart.tsx — Pie / Donut chart showing flood severity classification.
 */

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { ShieldAlert } from 'lucide-react';

export interface SeverityDonutChartProps {
  severity?: string;
  floodAreaKm2?: number;
}

export const SeverityDonutChart: React.FC<SeverityDonutChartProps> = ({
  severity = 'HIGH',
  floodAreaKm2 = 180.6,
}) => {
  const data = [
    { name: 'Flooded Surface', value: floodAreaKm2, color: '#2563EB' },
    { name: 'Dry Buffer Basin', value: Math.max(50, 450 - floodAreaKm2), color: '#334155' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            Severity Assessment
          </CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            {severity} RISK
          </span>
        </div>
        <CardDescription>Inundated surface vs AOI terrestrial catchment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#1E293B" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [`${val.toFixed(1)} km²`, 'Area']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-white">{floodAreaKm2.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">km² Flooded</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
