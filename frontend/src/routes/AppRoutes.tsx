/**
 * AppRoutes.tsx — Master Application Routing Configuration.
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnalysisWizardPage } from '@/pages/analysis/AnalysisWizardPage';
import { ArtifactsPage } from '@/pages/artifacts/ArtifactsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { JobsPage } from '@/pages/jobs/JobsPage';
import { InteractiveMapPage } from '@/pages/maps/InteractiveMapPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SystemPage } from '@/pages/system/SystemPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="analysis/new" element={<AnalysisWizardPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="map" element={<InteractiveMapPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="artifacts" element={<ArtifactsPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
