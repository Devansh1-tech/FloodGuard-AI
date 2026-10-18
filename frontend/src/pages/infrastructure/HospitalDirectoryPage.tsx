/**
 * HospitalDirectoryPage.tsx — Terai Health Infrastructure Directory.
 *
 * Visualizes healthcare facility status across the Nepal Terai region:
 * - Direct operational status (Operational vs Submerged/Inoperable).
 * - Bed capacity, facility category, and emergency contact numbers.
 * - Nearest safe haven evacuation recommendations.
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  HeartPulse,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { TERAI_HOSPITALS, HospitalFacility } from '@/data/teraiInfrastructure';

export const HospitalDirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBasin, setSelectedBasin] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'flooded'>('all');

  const filteredHospitals = TERAI_HOSPITALS.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBasin = selectedBasin === 'all' || h.basin === selectedBasin;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'flooded' && h.isFlooded) ||
      (statusFilter === 'operational' && !h.isFlooded);

    return matchesSearch && matchesBasin && matchesStatus;
  });

  const totalBeds = TERAI_HOSPITALS.reduce((acc, h) => acc + h.beds, 0);
  const operationalBeds = TERAI_HOSPITALS.filter((h) => !h.isFlooded).reduce((acc, h) => acc + h.beds, 0);
  const floodedCount = TERAI_HOSPITALS.filter((h) => h.isFlooded).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <HeartPulse className="h-3.5 w-3.5" />
              HEALTHCARE INFRASTRUCTURE
            </span>
            <span className="text-xs text-slate-400">Nepal Terai Lowland Facilities</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-400" />
            Hospital &amp; Medical Infrastructure Directory
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Operational status, capacity, and emergency routing for major hospitals and primary health posts across Nepal Terai.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-400" />
            Monitored Facilities
          </span>
          <div className="text-2xl font-black text-white">{TERAI_HOSPITALS.length} Hubs</div>
          <p className="text-[11px] text-slate-400">Across 21 Terai districts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Operational Capacity
          </span>
          <div className="text-2xl font-black text-emerald-400">{operationalBeds.toLocaleString()} Beds</div>
          <p className="text-[11px] text-slate-400">{TERAI_HOSPITALS.length - floodedCount} hospitals active</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            Inundated Facilities
          </span>
          <div className="text-2xl font-black text-rose-400">{floodedCount} Compromised</div>
          <p className="text-[11px] text-slate-400">Patients evacuated to safe havens</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            Total Bed Capacity
          </span>
          <div className="text-2xl font-black text-cyan-400">{totalBeds.toLocaleString()} Beds</div>
          <p className="text-[11px] text-slate-400">Regional healthcare network</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospital or district..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBasin}
            onChange={(e) => setSelectedBasin(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="all">All River Basins</option>
            <option value="Eastern Terai">Eastern Terai</option>
            <option value="Central Terai">Central Terai</option>
            <option value="Western Terai">Western Terai</option>
            <option value="Far-Western Terai">Far-Western Terai</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="all">All Operational Statuses</option>
            <option value="operational">Operational Only</option>
            <option value="flooded">Inundated / Inoperable Only</option>
          </select>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHospitals.map((hosp) => (
          <div
            key={hosp.id}
            className={`rounded-2xl border p-5 transition-all space-y-3 ${
              hosp.isFlooded
                ? 'border-red-500/40 bg-red-950/20 shadow-lg shadow-red-500/5'
                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    hosp.isFlooded
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {hosp.status}
                </span>
                <h3 className="text-base font-extrabold text-white mt-1.5">{hosp.name}</h3>
                <p className="text-xs text-slate-400">{hosp.type} &bull; {hosp.district} District ({hosp.basin})</p>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-white">{hosp.beds}</span>
                <span className="text-[10px] text-slate-400 block">Beds</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Emergency Contact</span>
                <a
                  href={`tel:${hosp.phone}`}
                  className="flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {hosp.phone}
                </a>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Nearest Safe Haven</span>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold truncate">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{hosp.nearestSafeHaven}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
