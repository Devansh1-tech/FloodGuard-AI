/**
 * InfrastructureChart.tsx — Submerged critical infrastructure facilities bar chart.
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Building2 } from 'lucide-react';

export interface InfrastructureData {
  type: string;
  count: number;
  color: string;
}

export interface InfrastructureChartProps {
  data?: InfrastructureData[];
}

export const InfrastructureChart: React.FC<InfrastructureChartProps> = ({ data }) => {
  const chartData = data || [
    { type: 'Buildings', count: 70, color: '#F59E0B' },
    { type: 'Hospitals', count: 2, color: '#EF4444' },
    { type: 'Schools', count: 3, color: '#3B82F6' },
    { type: 'Police', count: 2, color: '#10B981' },
    { type: 'Shelters', count: 1, color: '#8B5CF6' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>
          <Building2 className="h-4 w-4 text-amber-400" />
          Critical Infrastructure Inundation
        </CardTitle>
        <CardDescription>Submerged public facilities and buildings count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} horizontal={false} />
              <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis dataKey="type" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [`${val} structures`, 'Submerged']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
