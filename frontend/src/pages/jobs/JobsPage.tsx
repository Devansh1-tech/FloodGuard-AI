/**
 * JobsPage.tsx — Enterprise Background Jobs Monitoring and Telemetry Dashboard.
 */

import React, { useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Filter,
  Play,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { JobDetailsDrawer } from '@/pages/jobs/JobDetailsDrawer';
import { useJobs } from '@/hooks/useJobs';
import { JobPriority, JobStatus, JobStatusDetail } from '@/types/jobs';
import { formatDate, formatDuration } from '@/utils/formatters';

export const JobsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobStatusDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: jobs, isLoading, refetch, isFetching } = useJobs(
    {
      status: statusFilter !== 'ALL' ? (statusFilter as JobStatus) : undefined,
      priority: priorityFilter !== 'ALL' ? (priorityFilter as JobPriority) : undefined,
      search: searchTerm || undefined,
    },
    autoRefresh
  );

  const filteredJobs = (jobs || []).filter((job) => {
    if (searchTerm) {
      const match =
        job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_id.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openDrawer = (job: JobStatusDetail) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  };

  const statusOptions = ['ALL', 'RUNNING', 'QUEUED', 'COMPLETED', 'FAILED'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Background Jobs Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline task execution, live progress tracking, and telemetry logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-Poll (3s)</span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Status:
            </span>
            {statusOptions.map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 w-full lg:w-72">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by job name or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Job Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Stage / Progress</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading background jobs...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No matching jobs found.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => (
                    <tr
                      key={job.job_id}
                      onClick={() => openDrawer(job)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{job.job_name}</div>
                        <span className="font-mono text-[11px] text-slate-500">{job.job_id}</span>
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span className="truncate max-w-[90px]">{job.current_stage}</span>
                            <span className="font-mono">{job.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {formatDuration(job.execution_time_seconds)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(job);
                          }}
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

          {filteredJobs.length > pageSize && (
            <div className="px-4 border-t border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredJobs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Side Drawer */}
      <JobDetailsDrawer
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
