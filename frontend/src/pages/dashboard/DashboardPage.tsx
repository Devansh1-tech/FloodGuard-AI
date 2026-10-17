/**
 * DashboardPage.tsx — FloodGuard AI Platform Operational Command Center.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  Compass,
  Database,
  Globe,
  HardDrive,
  Layers,
  Play,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { StatCard } from '@/components/common/StatCard';
import { InfrastructureChart } from '@/components/charts/InfrastructureChart';
import { PipelineMetricsChart } from '@/components/charts/PipelineMetricsChart';
import { PopulationImpactChart } from '@/components/charts/PopulationImpactChart';
import { SeverityDonutChart } from '@/components/charts/SeverityDonutChart';
import { useJobs } from '@/hooks/useJobs';
import { useSystemConfig, useSystemHealth, useSystemStats } from '@/hooks/useSystemHealth';
import { formatBytes, formatDate, formatDuration } from '@/utils/formatters';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: config } = useSystemConfig();
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useJobs({ limit: 5 });

  const activeJobs = jobs?.filter((j) => j.status === 'RUNNING' || j.status === 'QUEUED') || [];
  const completedJobs = jobs?.filter((j) => j.status === 'COMPLETED' || j.status === 'PARTIAL_SUCCESS') || [];
  const failedJobs = jobs?.filter((j) => j.status === 'FAILED') || [];

  const handleRefreshAll = () => {
    refetchHealth();
    refetchJobs();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-slate-950/90 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/30">
                EARTH OBSERVATION COPERNICUS S1
              </span>
              <span className="text-xs text-slate-400">Terai Lowlands Operational Basin</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Disaster Risk Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time radar interferometry, Otsu SAR thresholding, building damage assessment,
              and emergency accessibility modeling for government emergency management agencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Telemetry
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/analysis/new')}
              leftIcon={<Play className="h-4 w-4 fill-current" />}
              className="shadow-lg shadow-blue-600/30"
            >
              Launch Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Subsystem Health Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Earth Engine Component */}
        <Card className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">Google Earth Engine</h4>
                <p className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  {config?.earth_engine_project || 'home-credit-505106'}
                </p>
              </div>
            </div>
            <Badge variant={health?.components?.earth_engine?.status === 'healthy' ? 'success' : 'warning'} withPulse>
              {health?.components?.earth_engine?.status || 'ONLINE'}
            </Badge>
          </div>
        </Card>

        {/* Database Component */}
        <Card className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">Geospatial Database</h4>
                <p className="text-[11px] text-slate-400">PostGIS / AsyncEngine</p>
              </div>
            </div>
            <Badge variant={health?.components?.database?.status === 'healthy' ? 'success' : 'warning'} withPulse>
              {health?.components?.database?.status || 'ONLINE'}
            </Badge>
          </div>
        </Card>

        {/* Pipeline Engine Component */}
        <Card className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">Pipeline Engine</h4>
                <p className="text-[11px] text-slate-400">Stage 2 & 3.5 Core</p>
              </div>
            </div>
            <Badge variant={health?.components?.pipeline?.status === 'healthy' ? 'success' : 'warning'} withPulse>
              {health?.components?.pipeline?.status || 'READY'}
            </Badge>
          </div>
        </Card>

        {/* Local Storage Component */}
        <Card className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300">Storage Deliverables</h4>
                <p className="text-[11px] text-slate-400">
                  {formatBytes(stats?.storage_usage_bytes || 22000000)}
                </p>
              </div>
            </div>
            <Badge variant={health?.components?.storage?.status === 'healthy' ? 'success' : 'warning'} withPulse>
              {health?.components?.storage?.status || 'MOUNTED'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inundation Analyzed"
          value="180.6 km²"
          subtitle="Koshi River Alluvial Basin"
          icon={ShieldAlert}
          iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
          trend={{ value: '180.6 km²', positive: false, label: 'Monsoon high' }}
          isLoading={statsLoading}
        />
        <StatCard
          title="Displaced Population"
          value="11,961"
          subtitle="Est. 2,600 households"
          icon={Users}
          iconColor="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
          trend={{ value: '1,376 children', positive: false }}
          isLoading={statsLoading}
        />
        <StatCard
          title="Critical Facilities Flooded"
          value="7 Facilities"
          subtitle="2 hospitals, 3 schools, 2 police"
          icon={Building2}
          iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pipeline Mean Latency"
          value={`${(stats?.average_execution_time_seconds || 7.3).toFixed(1)}s`}
          subtitle="End-to-end execution time"
          icon={Clock}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          trend={{ value: 'Supercharged', positive: true }}
          isLoading={statsLoading}
        />
      </div>

      {/* Active Jobs Live Monitoring Banner if running */}
      {activeJobs.length > 0 && (
        <Card className="border-blue-500/40 bg-blue-950/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Active Analysis Job in Progress ({activeJobs[0].job_name})
                </h4>
                <p className="text-xs text-blue-300">
                  Current Stage: <span className="font-semibold text-white">{activeJobs[0].current_stage}</span> — Progress: {activeJobs[0].progress}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeJobs[0].progress}%` }}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/jobs')}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Inspect Job
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Real-time Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopulationImpactChart />
        <InfrastructureChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityDonutChart />
        <PipelineMetricsChart />
      </div>

      {/* Recent Pipeline Executions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              <Layers className="h-4 w-4 text-blue-400" />
              Recent Analysis Executions
            </CardTitle>
            <CardDescription>Historical Sentinel-1 SAR flood mapping runs</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/jobs')}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            View All Jobs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3 px-3">Job Name</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Stage</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Created</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {jobsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading execution history...
                    </td>
                  </tr>
                ) : !jobs || jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No analyses executed yet. Click &quot;Launch Analysis&quot; to run your first pipeline.
                    </td>
                  </tr>
                ) : (
                  jobs.slice(0, 5).map((job) => (
                    <tr key={job.job_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{job.job_name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{job.job_id.slice(0, 8)}...</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            job.status === 'COMPLETED' || job.status === 'PARTIAL_SUCCESS'
                              ? 'success'
                              : job.status === 'RUNNING'
                              ? 'primary'
                              : job.status === 'FAILED'
                              ? 'danger'
                              : 'default'
                          }
                          withPulse={job.status === 'RUNNING'}
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-bold ${
                            job.priority === 'CRITICAL'
                              ? 'text-red-400'
                              : job.priority === 'HIGH'
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {job.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400">{job.current_stage}</td>
                      <td className="py-3 px-3 text-xs font-mono text-slate-300">
                        {formatDuration(job.execution_time_seconds)}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/jobs')}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
