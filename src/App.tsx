import React, { useState } from 'react';
import { Header } from './components/Header';
import { RealtimeMultiGridFeed } from './components/RealtimeMultiGridFeed';
import { ImageComplianceVerification } from './components/ImageComplianceVerification';
import { ComplianceAnalyticsReports } from './components/ComplianceAnalyticsReports';
import { ActiveLearningStudio } from './components/ActiveLearningStudio';
import { YOLOv9InferenceStudio } from './components/YOLOv9InferenceStudio';
import { LiveCameraRuleMatrix } from './components/LiveCameraRuleMatrix';
import { MobileSupervisorView } from './components/MobileSupervisorView';
import { VideoInfraStudio } from './components/VideoInfraStudio';
import { BackendCodeStudio } from './components/BackendCodeStudio';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint';
import { ZoneConfigurator } from './components/ZoneConfigurator';
import { LiveIngestionSimulator } from './components/LiveIngestionSimulator';
import { PostgresSchemaViewer } from './components/PostgresSchemaViewer';
import { RedisArchitectureViewer } from './components/RedisArchitectureViewer';
import { ApiSpecExplorer } from './components/ApiSpecExplorer';
import { RbacVisualizer } from './components/RbacVisualizer';
import { AddCameraModal } from './components/AddCameraModal';
import { INITIAL_TENANT, INITIAL_FACILITY, INITIAL_CAMERAS } from './data/mockData';
import { CameraFeed, ZoneMonitoringConfig } from './types/schema';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('multigrid-feed');
  const [tenant] = useState(INITIAL_TENANT);
  const [facility] = useState(INITIAL_FACILITY);
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [isAddCameraModalOpen, setIsAddCameraModalOpen] = useState<boolean>(false);

  const handleAddCamera = (newCamera: CameraFeed) => {
    setCameras((prev) => [newCamera, ...prev]);
  };

  const handleSaveConfig = (cameraId: string, zoneId: string, newConfig: ZoneMonitoringConfig) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id === cameraId) {
          const updatedZones = cam.zones.map((z) => {
            if (z.id === zoneId) {
              return {
                ...z,
                monitoring_config: newConfig,
                updated_at: new Date().toISOString(),
              };
            }
            return z;
          });
          return { ...cam, zones: updatedZones };
        }
        return cam;
      })
    );
  };

  const handleUpdateCameraRules = (cameraId: string, zoneId: string, rules: Record<string, { enabled: boolean; threshold: number; action: string }>) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id === cameraId) {
          const updatedZones = cam.zones.map((z) => {
            if (z.id === zoneId) {
              const updatedRules = { ...z.monitoring_config.rules };
              Object.keys(rules).forEach((key) => {
                updatedRules[key] = {
                  enabled: rules[key].enabled,
                  confidence_threshold: rules[key].threshold,
                  action: rules[key].action,
                };
              });
              return {
                ...z,
                monitoring_config: {
                  ...z.monitoring_config,
                  rules: updatedRules,
                  updated_at: new Date().toISOString(),
                },
              };
            }
            return z;
          });
          return { ...cam, zones: updatedZones };
        }
        return cam;
      })
    );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500 selection:text-slate-950 pb-16 md:pb-0 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenant={tenant}
        facility={facility}
        onOpenAddCamera={() => setIsAddCameraModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Core Mobile & Real-Time Views */}
        {activeTab === 'multigrid-feed' && (
          <RealtimeMultiGridFeed
            cameras={cameras}
            onOpenAddCamera={() => setIsAddCameraModalOpen(true)}
          />
        )}

        {activeTab === 'image-verification' && <ImageComplianceVerification />}

        {activeTab === 'analytics-reports' && <ComplianceAnalyticsReports cameras={cameras} />}

        {activeTab === 'active-learning' && <ActiveLearningStudio cameras={cameras} />}

        {activeTab === 'yolov9-cv' && <YOLOv9InferenceStudio cameras={cameras} />}

        {activeTab === 'rule-matrix' && (
          <LiveCameraRuleMatrix
            cameras={cameras}
            onUpdateCameraRules={handleUpdateCameraRules}
          />
        )}

        {activeTab === 'mobile-supervisor' && <MobileSupervisorView cameras={cameras} />}

        {/* Supporting Infrastructure & Architectural Studios */}
        {activeTab === 'video-infra' && <VideoInfraStudio cameras={cameras} />}

        {activeTab === 'backend-code' && <BackendCodeStudio />}

        {activeTab === 'architecture' && <ArchitectureBlueprint />}

        {activeTab === 'configurator' && (
          <ZoneConfigurator
            cameras={cameras}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'simulator' && (
          <LiveIngestionSimulator cameras={cameras} />
        )}

        {activeTab === 'postgres' && <PostgresSchemaViewer />}

        {activeTab === 'redis' && <RedisArchitectureViewer />}

        {activeTab === 'api' && <ApiSpecExplorer />}

        {activeTab === 'rbac' && <RbacVisualizer />}
      </main>

      {/* Add Camera Modal */}
      <AddCameraModal
        isOpen={isAddCameraModalOpen}
        onClose={() => setIsAddCameraModalOpen(false)}
        onAddCamera={handleAddCamera}
      />

      {/* Responsive Footer */}
      <footer className={`border-t text-xs py-4 mt-auto transition-colors ${
        theme === 'dark' ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`font-semibold font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
              EHS Sentinel Mobile Platform v2.5
            </span>
            <span>•</span>
            <span>WebRTC WHEP + Redis Realtime Sync</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Anatomical PPE Classes: head_helmet/nohelmet • glasses/mask/nomask • vest/person • glove/noglove • boots/shoes
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
