/**
 * JobDetailsDrawer.tsx — Side drawer showing live pipeline timeline, stage milestones, and outputs.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Compass,
  FileCode,
  Layers,
  MapPin,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Drawer } from '@/components/common/Drawer';
import { PIPELINE_MILESTONES } from '@/config/constants';
import { useCancelJob, useDeleteJob, useJobDetail } from '@/hooks/useJobs';
import { JobStatusDetail } from '@/types/jobs';
import { formatDate, formatDuration } from '@/utils/formatters';

export interface JobDetailsDrawerProps {
  job: JobStatusDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailsDrawer: React.FC<JobDetailsDrawerProps> = ({ job, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: liveJob } = useJobDetail(job?.job_id, isOpen);
  const activeJob = liveJob || job;

  const cancelMutation = useCancelJob();
  const deleteMutation = useDeleteJob();

  if (!activeJob) return null;

  const isRunning = activeJob.status === 'RUNNING' || activeJob.status === 'QUEUED';

  const handleCancel = async () => {
    if (confirm('Cancel this running pipeline execution?')) {
      await cancelMutation.mutateAsync(activeJob.job_id);
    }
  };

  const handleDelete = async () => {
    if (confirm('Permanently delete this job and associated database records?')) {
      await deleteMutation.mutateAsync(activeJob.job_id);
      onClose();
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      title={
        <div className="flex items-center gap-2">
          <Badge
            variant={
              activeJob.status === 'COMPLETED' || activeJob.status === 'PARTIAL_SUCCESS'
                ? 'success'
                : activeJob.status === 'RUNNING'
                ? 'primary'
                : activeJob.status === 'FAILED'
                ? 'danger'
                : 'default'
            }
            withPulse={isRunning}
          >
            {activeJob.status}
          </Badge>
          <span className="text-base font-bold text-white">{activeJob.job_name}</span>
        </div>
      }
      description={`ID: ${activeJob.job_id}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {isRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                isLoading={cancelMutation.isPending}
                leftIcon={<Ban className="h-4 w-4" />}
              >
                Cancel Job
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
                leftIcon={<Trash2 className="h-4 w-4 text-red-400" />}
                className="text-red-400 hover:bg-red-500/10"
              >
                Delete
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/map');
              }}
              leftIcon={<Layers className="h-4 w-4" />}
            >
              Open in GIS
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Bar & Stage Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Processing Stage</span>
            <span className="font-mono font-bold text-blue-400">{activeJob.current_stage}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Overall Completion</span>
              <span className="font-bold text-white">{activeJob.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, activeJob.progress)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block">Execution Time</span>
              <span className="font-mono text-white">
                {formatDuration(activeJob.execution_time_seconds)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Priority</span>
              <span className="font-bold text-amber-400">{activeJob.priority}</span>
            </div>
          </div>
        </div>

        {/* Pipeline Execution Milestones Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            Pipeline Stage Milestones
          </h4>

          <div className="space-y-2">
            {PIPELINE_MILESTONES.map((m, index) => {
              const isCompleted =
                activeJob.status === 'COMPLETED' ||
                activeJob.status === 'PARTIAL_SUCCESS' ||
                index < PIPELINE_MILESTONES.findIndex((x) => x.id === activeJob.current_stage);
              const isCurrent = activeJob.current_stage === m.id && isRunning;

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-blue-500/80 bg-blue-950/30'
                      : isCompleted
                      ? 'border-slate-800 bg-slate-900/60'
                      : 'border-slate-800/50 bg-slate-950/40 opacity-60'
                  }`}
                >
                  <div
                    className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{m.label}</span>
                      {isCurrent && (
                        <Badge variant="primary" withPulse className="text-[10px] py-0">
                          PROCESSING
                        </Badge>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-mono text-emerald-400">PASSED</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warnings or Errors */}
        {activeJob.warnings && activeJob.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span>Pipeline Execution Warnings ({activeJob.warnings.length})</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-200 text-[11px]">
              {activeJob.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {activeJob.errors && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <XCircle className="h-4 w-4" />
              <span>Pipeline Errors</span>
            </div>
            <p className="font-mono text-[11px] text-rose-200">{activeJob.errors}</p>
          </div>
        )}

        {/* Execution Metadata / Parameters JSON Viewer */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-slate-400" />
            Execution Parameters
          </h4>
          <pre className="p-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
            {JSON.stringify(activeJob.parameters || {}, null, 2)}
          </pre>
        </div>

        {/* Timestamps */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1.5 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Created At:</span>
            <span className="text-slate-200">{formatDate(activeJob.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Started At:</span>
            <span className="text-slate-200">{formatDate(activeJob.started_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed At:</span>
            <span className="text-slate-200">{formatDate(activeJob.completed_at)}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
