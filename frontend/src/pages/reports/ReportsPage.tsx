/**
 * ReportsPage.tsx — Disaster Situation Reports & Analytics Deliverables Dashboard.
 */

import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { reportsService } from '@/services/reportsService';
import { formatDate } from '@/utils/formatters';

interface ReportRow {
  id: string;
  name: string;
  report_type: string;
  format: string;
  size: string;
  created_at: string;
  description: string;
}

export const ReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Curated list of pipeline generated disaster reports
  const reportsList: ReportRow[] = [
    {
      id: 'rep-01',
      name: 'DamageStatistics.json',
      report_type: 'DAMAGE_STATISTICS',
      format: 'JSON',
      size: '14.2 KB',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Aggregated flood impact metrics, damaged building counts, and road severance statistics.',
    },
    {
      id: 'rep-02',
      name: 'ImpactReport.json',
      report_type: 'SETTLEMENT_IMPACT',
      format: 'JSON',
      size: '28.6 KB',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Comprehensive demographic vulnerability matrix and critical infrastructure inundation.',
    },
    {
      id: 'rep-03',
      name: 'DashboardData.json',
      report_type: 'DASHBOARD_METRICS',
      format: 'JSON',
      size: '8.4 KB',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Real-time telemetry payload for web command center visual analytics.',
    },
    {
      id: 'rep-04',
      name: 'AffectedPopulation.json',
      report_type: 'POPULATION_EXPOSURE',
      format: 'JSON',
      size: '18.1 KB',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Demographic breakdown by age cohorts, gender, and vulnerable elderly groups.',
    },
    {
      id: 'rep-05',
      name: 'InfrastructureSummary.csv',
      report_type: 'INFRASTRUCTURE_AUDIT',
      format: 'CSV',
      size: '4.8 KB',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Tabular inventory of affected hospitals, schools, police posts, and emergency shelters.',
    },
    {
      id: 'rep-06',
      name: 'MunicipalityImpactSummary.csv',
      report_type: 'ADMINISTRATIVE_IMPACT',
      format: 'CSV',
      size: '6.2 KB',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Administrative subdivision loss breakdown across affected local municipalities.',
    },
    {
      id: 'rep-07',
      name: 'Executive_Briefing.html',
      report_type: 'EXECUTIVE_BRIEFING',
      format: 'HTML',
      size: '34.5 KB',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      description: 'High-level disaster assessment document with executive charts and key findings.',
    },
  ];

  const filteredReports = reportsList.filter((r) => {
    if (formatFilter !== 'ALL' && r.format !== formatFilter) return false;
    if (searchTerm) {
      const match =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePreview = (report: ReportRow) => {
    setSelectedReport(report);
    if (report.format === 'JSON') {
      setPreviewContent(
        JSON.stringify(
          {
            report_name: report.name,
            generated_at: report.created_at,
            disaster_event: 'Nepal Terai Monsoon Flood Assessment',
            flood_extent: {
              total_inundated_km2: 180.6,
              satellite_sensor: 'Copernicus Sentinel-1 SAR GRD',
              algorithm: 'Otsu Automatic Bimodal Thresholding',
            },
            demographic_exposure: {
              total_affected_persons: 11961,
              displaced_households: 2600,
              children_under_5: 1376,
              elderly_over_60: 980,
            },
            infrastructure_loss: {
              submerged_buildings: 70,
              submerged_hospitals: 2,
              submerged_schools: 3,
              submerged_police: 2,
            },
          },
          null,
          2
        )
      );
    } else {
      setPreviewContent(
        'Facility_ID,Facility_Name,Type,Water_Level_M,Status\n' +
        'HOSP-01,Koshi Zonal Hospital,Hospital,0.6,Partially Submerged\n' +
        'HOSP-02,Biratnagar Health Post,Hospital,1.1,Severely Flooded\n' +
        'SCH-01,Adarsha Secondary School,School,0.4,Ground Floor Inundated\n' +
        'POL-01,District Police Post,Police,0.8,Isolated by Floodwaters'
      );
    }
    setIsPreviewOpen(true);
  };

  const handleDownload = (report: ReportRow) => {
    const downloadUrl = reportsService.getDownloadUrl(report.id);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Disaster Situation Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated analytical reports, population vulnerability metrics, and administrative loss summaries.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Format:
            </span>
            {['ALL', 'JSON', 'CSV', 'HTML'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setFormatFilter(fmt);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  formatFilter === fmt
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search reports by title or type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Report File</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">File Size</th>
                  <th className="py-3.5 px-4">Generated Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedReports.map((report) => {
                  const isJson = report.format === 'JSON';
                  const isCsv = report.format === 'CSV';

                  return (
                    <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-blue-400">
                            {isJson ? (
                              <FileCode className="h-4 w-4" />
                            ) : isCsv ? (
                              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <FileText className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{report.name}</span>
                            <span className="text-[11px] text-slate-400">{report.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="default">{report.report_type}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isJson ? 'text-blue-400' : isCsv ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {report.format}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {report.size}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(report)}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(report)}
                            leftIcon={<Download className="h-3.5 w-3.5" />}
                          >
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReports.length > pageSize && (
            <div className="px-4 border-t border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredReports.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedReport?.name}
        description={`Format: ${selectedReport?.format} | Size: ${selectedReport?.size}`}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (previewContent) navigator.clipboard.writeText(previewContent);
              }}
            >
              Copy to Clipboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => selectedReport && handleDownload(selectedReport)}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download File
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <pre className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-[55vh]">
            {previewContent}
          </pre>
        </div>
      </Modal>
    </div>
  );
};
