/**
 * ArtifactsPage.tsx — Geospatial Deliverables, GeoJSON Vectors, Rasters & Cartographic Maps.
 */

import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Image,
  Layers,
  Map,
  Package,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { artifactsService } from '@/services/artifactsService';
import { formatDate } from '@/utils/formatters';

interface ArtifactRow {
  id: string;
  name: string;
  type: 'GEOJSON' | 'GEOTIFF' | 'PNG' | 'CSV' | 'JSON' | 'GPKG';
  file_path: string;
  size: string;
  checksum: string;
  created_at: string;
  description: string;
}

export const ArtifactsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactRow | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const artifactsList: ArtifactRow[] = [
    {
      id: 'art-01',
      name: 'Flood_Administrative_Map.png',
      type: 'PNG',
      file_path: 'outputs/run_20261017_122359/impact/Flood_Administrative_Map.png',
      size: '2.4 MB',
      checksum: 'e9a4f210c83b...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'High-resolution cartographic map with district boundaries and flood polygon overlay.',
    },
    {
      id: 'art-02',
      name: 'Road_Impact_Map.png',
      type: 'PNG',
      file_path: 'outputs/run_20261017_122359/impact/Road_Impact_Map.png',
      size: '2.1 MB',
      checksum: 'c47b88902da1...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Transportation lifeline vulnerability map with severed highways and bridges.',
    },
    {
      id: 'art-03',
      name: 'Critical_Infrastructure_Map.png',
      type: 'PNG',
      file_path: 'outputs/run_20261017_122359/impact/Critical_Infrastructure_Map.png',
      size: '1.9 MB',
      checksum: '9d2a1b7e45ff...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Spatial distribution of submerged hospitals, schools, and emergency facilities.',
    },
    {
      id: 'art-04',
      name: 'Population_Exposure_Heatmap.png',
      type: 'PNG',
      file_path: 'outputs/run_20261017_122359/impact/Population_Exposure_Heatmap.png',
      size: '2.6 MB',
      checksum: '7611efac4092...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Continuous surface density heatmap of vulnerable populations exposed to floodwaters.',
    },
    {
      id: 'art-05',
      name: 'AffectedBuildings.geojson',
      type: 'GEOJSON',
      file_path: 'outputs/run_20261017_122359/impact/AffectedBuildings.geojson',
      size: '412 KB',
      checksum: '5a2890dd1278...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: '70 submerged building footprints extracted from OpenStreetMap with flood depths.',
    },
    {
      id: 'art-06',
      name: 'SettlementImpactLayers.gpkg',
      type: 'GPKG',
      file_path: 'outputs/run_20261017_122359/impact/SettlementImpactLayers.gpkg',
      size: '3.8 MB',
      checksum: 'bb104f76cc34...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: 'Consolidated OGC GeoPackage container containing all vector layers and spatial attributes.',
    },
    {
      id: 'art-07',
      name: 'flood_extent_mask.tif',
      type: 'GEOTIFF',
      file_path: 'outputs/run_20261017_122359/detection/flood_extent_mask.tif',
      size: '8.4 MB',
      checksum: 'aa55928e1009...',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      description: '10m resolution binary raster mask (1=flooded, 0=dry ground) in EPSG:4326.',
    },
  ];

  const filteredArtifacts = artifactsList.filter((a) => {
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (searchTerm) {
      const match =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const paginatedArtifacts = filteredArtifacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDownload = (artifact: ArtifactRow) => {
    const url = artifactsService.getDownloadUrl(artifact.id);
    window.open(url, '_blank');
  };

  const handlePreview = (artifact: ArtifactRow) => {
    setSelectedArtifact(artifact);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Deliverable Spatial Artifacts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Download GeoTIFF rasters, GeoJSON vectors, cartographic PNG maps, and OGC GeoPackages.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/80 border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-2">Filter Type:</span>
            {['ALL', 'PNG', 'GEOJSON', 'GEOTIFF', 'GPKG'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search artifacts..."
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

      {/* Artifacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Artifact Deliverable</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">File Size</th>
                  <th className="py-3.5 px-4">Checksum (SHA256)</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedArtifacts.map((art) => {
                  const isPng = art.type === 'PNG';
                  const isGeoJson = art.type === 'GEOJSON';
                  const isGeoTiff = art.type === 'GEOTIFF';

                  return (
                    <tr key={art.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-blue-400">
                            {isPng ? (
                              <Image className="h-4 w-4 text-emerald-400" />
                            ) : isGeoJson ? (
                              <Globe className="h-4 w-4 text-cyan-400" />
                            ) : isGeoTiff ? (
                              <Map className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Layers className="h-4 w-4 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{art.name}</span>
                            <span className="text-[11px] text-slate-400">{art.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            isPng
                              ? 'success'
                              : isGeoJson
                              ? 'info'
                              : isGeoTiff
                              ? 'warning'
                              : 'purple'
                          }
                        >
                          {art.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{art.size}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{art.checksum}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {formatDate(art.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPng && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(art)}
                              leftIcon={<Eye className="h-3.5 w-3.5" />}
                            >
                              Preview
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(art)}
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

          {filteredArtifacts.length > pageSize && (
            <div className="px-4 border-t border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredArtifacts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cartographic Map Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedArtifact?.name}
        description={selectedArtifact?.description}
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="primary"
              size="sm"
              onClick={() => selectedArtifact && handleDownload(selectedArtifact)}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download Full-Resolution PNG
            </Button>
          </div>
        }
      >
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-center min-h-[350px]">
          <div className="relative text-center p-8 space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Image className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{selectedArtifact?.name}</h4>
              <p className="text-xs text-slate-400 mt-1">Cartographic 300 DPI Flood Map Deliverable</p>
            </div>
            <Badge variant="primary">READY FOR BROADCAST & EMERGENCY OPERATIONS</Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
};
