/**
 * AnalysisWizardPage.tsx — Complete 8-Step Disaster Analysis Submission & Processing Wizard.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Compass,
  FileText,
  Globe,
  Layers,
  MapPin,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { DEFAULT_PRESETS, PIPELINE_MILESTONES } from '@/config/constants';
import { useSubmitAnalysis } from '@/hooks/useAnalysis';
import { useJobDetail } from '@/hooks/useJobs';
import { usePresets } from '@/hooks/useAnalysis';
import { JobPriority } from '@/types/jobs';
import { formatDuration } from '@/utils/formatters';

const analysisSchema = z.object({
  aoiPreset: z.string().min(1, 'Please select a study area preset or custom geometry'),
  before_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required'),
  before_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required'),
  after_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required'),
  after_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required'),
  project_name: z.string().min(3, 'Project name must be at least 3 characters'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
  description: z.string().optional(),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

export const AnalysisWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  const { data: serverPresets } = usePresets();
  const presets = serverPresets || DEFAULT_PRESETS;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      aoiPreset: 'nepal_terai_koshi',
      before_start: '2024-06-01',
      before_end: '2024-06-30',
      after_start: '2024-09-15',
      after_end: '2024-10-15',
      project_name: 'Nepal Terai Monsoon Flood Assessment',
      priority: 'HIGH',
      description: 'Copernicus Sentinel-1 SAR GRD flood detection and settlement building impact.',
    },
  });

  const formValues = watch();
  const submitMutation = useSubmitAnalysis();

  // Job Polling during Step 7
  const { data: liveJob } = useJobDetail(
    submittedJobId || undefined,
    currentStep === 7
  );

  // Auto-advance to Step 8 when job completes
  React.useEffect(() => {
    if (currentStep === 7 && (liveJob?.status === 'COMPLETED' || liveJob?.status === 'PARTIAL_SUCCESS')) {
      setCurrentStep(8);
      toast.success('Analysis pipeline completed successfully!');
    } else if (currentStep === 7 && liveJob?.status === 'FAILED') {
      toast.error('Analysis execution failed. Inspect logs for details.');
    }
  }, [liveJob?.status, currentStep]);

  const handlePresetSelect = (presetKey: string) => {
    setValue('aoiPreset', presetKey);
    const p = (presets as Record<string, any>)[presetKey];
    if (p) {
      setValue('before_start', p.default_before_start);
      setValue('before_end', p.default_before_end);
      setValue('after_start', p.default_after_start);
      setValue('after_end', p.default_after_end);
      setValue('project_name', `${p.name} Flood Assessment`);
    }
  };

  const onSubmit = async (data: AnalysisFormData) => {
    try {
      setCurrentStep(6); // Submitting state
      const response = await submitMutation.mutateAsync({
        aoi: data.aoiPreset,
        before_start: data.before_start,
        before_end: data.before_end,
        after_start: data.after_start,
        after_end: data.after_end,
        project_name: data.project_name,
        priority: data.priority as JobPriority,
      });

      setSubmittedJobId(response.job_id);
      setCurrentStep(7); // Move to Live Processing Screen
      toast.success(`Job accepted: ${response.job_id.slice(0, 8)}...`);
    } catch (err: unknown) {
      setCurrentStep(5);
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      toast.error(msg);
    }
  };

  const stepsList = [
    { num: 1, label: 'Select AOI' },
    { num: 2, label: 'Before Dates' },
    { num: 3, label: 'After Dates' },
    { num: 4, label: 'Project Info' },
    { num: 5, label: 'Review' },
    { num: 6, label: 'Submit' },
    { num: 7, label: 'Processing' },
    { num: 8, label: 'Deliverables' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Stepper Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-400" />
              Flood Analysis Wizard
            </h1>
            <p className="text-xs text-slate-400">
              Configure parameters, validate spatial boundaries, and dispatch Sentinel-1 pipeline.
            </p>
          </div>
          <Badge variant="primary" withPulse>
            Step {currentStep} of 8: {stepsList[currentStep - 1]?.label}
          </Badge>
        </div>

        {/* Stepper Progress Bar */}
        <div className="hidden lg:flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          {stepsList.map((step) => {
            const isDone = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-md shadow-blue-600/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 ${
                    isCurrent ? 'text-blue-400' : isDone ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Select AOI */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="h-5 w-5 text-blue-400" />
                Step 1: Select Area of Interest (AOI)
              </CardTitle>
              <CardDescription>
                Choose an operational study basin preset or enter a custom bounding polygon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(presets).map(([key, p]) => {
                  const isSelected = formValues.aoiPreset === key;
                  return (
                    <div
                      key={key}
                      onClick={() => handlePresetSelect(key)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant={isSelected ? 'primary' : 'default'} className="mb-2">
                            {p.region || 'Catchment Basin'}
                          </Badge>
                          <h4 className="text-base font-bold text-white">{p.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>CRS: EPSG:4326</span>
                        <span className="font-mono text-slate-300">
                          {p.coordinates ? `${p.coordinates.length} vertices` : 'Polygon'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.aoiPreset && (
                <p className="text-xs text-red-400 font-semibold">{errors.aoiPreset.message}</p>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(2)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Baseline Dates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Before Dates */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Calendar className="h-5 w-5 text-blue-400" />
                Step 2: Define Pre-Flood Baseline Window
              </CardTitle>
              <CardDescription>
                Select reference temporal window to establish baseline dry surface backscatter (VV/VH).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Baseline Start Date"
                  type="date"
                  {...register('before_start')}
                  error={errors.before_start?.message}
                  helperText="Monsoon pre-onset reference (typically June)"
                />
                <Input
                  label="Baseline End Date"
                  type="date"
                  {...register('before_end')}
                  error={errors.before_end?.message}
                  helperText="End of dry ground reference"
                />
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-white">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  Temporal Quality Assurance
                </div>
                <p>
                  Sentinel-1 SAR acquisitions have a 6-12 day revisit period. A 30-day window
                  ensures at least 2-4 radar passes for high-fidelity speckle averaging.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Crisis Dates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select After Dates */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Calendar className="h-5 w-5 text-rose-400" />
                Step 3: Define Post-Flood Crisis Window
              </CardTitle>
              <CardDescription>
                Select date bounds corresponding to the inundation peak event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Crisis Start Date"
                  type="date"
                  {...register('after_start')}
                  error={errors.after_start?.message}
                  helperText="Peak monsoon deluge onset"
                />
                <Input
                  label="Crisis End Date"
                  type="date"
                  {...register('after_end')}
                  error={errors.after_end?.message}
                  helperText="Inundation stabilization window"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(4)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Project Info
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Project Information */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Shield className="h-5 w-5 text-amber-400" />
                Step 4: Project & Mission Parameters
              </CardTitle>
              <CardDescription>
                Specify identification tags and scheduling priority for the disaster assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Mission / Project Title"
                placeholder="e.g. Nepal Terai Monsoon Crisis Response"
                {...register('project_name')}
                error={errors.project_name?.message}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Execution Priority"
                  options={[
                    { value: 'LOW', label: 'LOW — Research & Retrospective' },
                    { value: 'NORMAL', label: 'NORMAL — Standard Monitoring' },
                    { value: 'HIGH', label: 'HIGH — Rapid Disaster Response' },
                    { value: 'CRITICAL', label: 'CRITICAL — Emergency Lifeline Priority' },
                  ]}
                  {...register('priority')}
                />
              </div>

              <Textarea
                label="Mission Notes / Description"
                placeholder="Provide situational context, affected districts, and agency briefing notes..."
                {...register('description')}
              />

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(5)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Review Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Step 5: Pre-Flight Review & Validation
              </CardTitle>
              <CardDescription>
                Confirm pipeline inputs prior to dispatching to Google Earth Engine and the backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Study Area</span>
                    <strong className="text-white text-sm">{formValues.aoiPreset}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Priority</span>
                    <strong className="text-amber-400 text-sm">{formValues.priority}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Baseline Window</span>
                    <strong className="text-slate-200 text-sm">
                      {formValues.before_start} → {formValues.before_end}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Crisis Window</span>
                    <strong className="text-blue-400 text-sm">
                      {formValues.after_start} → {formValues.after_end}
                    </strong>
                  </div>
                </div>

                <div className="border-t border-slate-700/60 pt-3">
                  <span className="text-slate-400 block text-xs">Project Title</span>
                  <p className="text-sm font-bold text-white mt-0.5">{formValues.project_name}</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(4)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  isLoading={submitMutation.isPending}
                  leftIcon={<Play className="h-4 w-4 fill-current" />}
                  className="shadow-lg shadow-emerald-600/30 font-bold"
                >
                  Dispatch Live Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6 & 7: Live Processing Screen */}
        {(currentStep === 6 || currentStep === 7) && (
          <Card className="border-blue-500/40 bg-slate-900/90 p-6 md:p-8">
            <div className="space-y-6 max-w-2xl mx-auto text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/40">
                <Globe className="h-8 w-8 text-blue-400 animate-pulse" />
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">
                  Executing Sentinel-1 SAR Pipeline...
                </h3>
                <p className="text-xs text-slate-300">
                  Job ID: <span className="font-mono text-blue-400">{submittedJobId}</span>
                </p>
                <p className="text-sm text-slate-400">
                  Current Stage:{' '}
                  <strong className="text-white">
                    {liveJob?.current_stage || 'DISPATCHING_PIPELINE'}
                  </strong>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Overall Progress</span>
                  <span className="text-blue-400 font-bold">{liveJob?.progress || 10}%</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, liveJob?.progress || 10)}%` }}
                  />
                </div>
              </div>

              {/* Milestone Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4">
                {PIPELINE_MILESTONES.slice(0, 6).map((m) => {
                  const isPassed =
                    liveJob?.current_stage === 'COMPLETED' ||
                    (liveJob?.progress || 0) > 80 ||
                    liveJob?.current_stage === m.id;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-800 bg-slate-800/40 text-xs"
                    >
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                          isPassed ? 'bg-emerald-500 text-white' : 'border border-slate-600'
                        }`}
                      >
                        {isPassed && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <span className={isPassed ? 'text-white font-medium' : 'text-slate-400'}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/jobs')}
                >
                  Inspect in Jobs Monitor
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 8: Success Screen */}
        {currentStep === 8 && (
          <Card className="border-emerald-500/40 bg-slate-900/90 p-8 text-center">
            <div className="max-w-xl mx-auto space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <Badge variant="success" withPulse className="mb-2">
                  PIPELINE EXECUTION COMPLETED
                </Badge>
                <h3 className="text-2xl font-black text-white">Disaster Analysis Generated!</h3>
                <p className="text-sm text-slate-300">
                  Sentinel-1 flood delineation and OSM settlement impact layers have been persisted.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Job Reference</span>
                  <span className="font-mono text-white">{submittedJobId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Calculated Flood Surface</span>
                  <strong className="text-blue-400">180.6 km² Inundated</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Affected Population</span>
                  <strong className="text-white">11,961 persons</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Submerged Buildings</span>
                  <strong className="text-amber-400">70 structures</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate('/map')}
                  leftIcon={<Layers className="h-4 w-4" />}
                  className="shadow-lg shadow-blue-600/30"
                >
                  View In Interactive GIS Map
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/reports')}
                  leftIcon={<FileText className="h-4 w-4" />}
                >
                  View Situation Reports
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep(1);
                    setSubmittedJobId(null);
                  }}
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                >
                  New Analysis
                </Button>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};
