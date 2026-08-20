import React from 'react';
import { 
  ShieldCheck, 
  Video, 
  Server, 
  Database, 
  Zap, 
  HardHat, 
  Eye, 
  Radio, 
  Code, 
  Grid2X2, 
  Sliders, 
  Smartphone, 
  Sun, 
  Moon,
  Tv,
  CheckCircle2,
  Cpu,
  BarChart3,
  Brain,
  Upload,
  Plus
} from 'lucide-react';
import { Tenant, Facility } from '../types/schema';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenant: Tenant;
  facility: Facility;
  onOpenAddCamera?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tenant,
  facility,
  onOpenAddCamera,
}) => {
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: 'multigrid-feed', label: 'Real-Time Multi-Grid Feed', icon: Tv, badge: 'WebRTC Live' },
    { id: 'image-verification', label: 'Picture Compliance Verification', icon: Upload, badge: 'AI Photo Upload' },
    { id: 'analytics-reports', label: 'Compliance Heatmaps & OSHA Reports', icon: BarChart3, badge: 'OSHA 300 / 300A' },
    { id: 'active-learning', label: 'Active Learning & Data Triage', icon: Brain, badge: '0.35 < Conf < 0.55' },
    { id: 'yolov9-cv', label: 'YOLOv9-e & Dynamic Violation Engine', icon: Cpu, badge: 'TensorRT /var/log' },
    { id: 'rule-matrix', label: 'Camera & Rule Selector Matrix', icon: Sliders, badge: 'Instant Hot-Reload' },
    { id: 'mobile-supervisor', label: 'Mobile Supervisor View', icon: Smartphone, badge: 'PWA Floor Triage' },
    { id: 'video-infra', label: 'Video Ingest & WebRTC Studio', icon: Radio, badge: 'Pipeline' },
    { id: 'backend-code', label: 'FastAPI & Node Backend Code', icon: Code, badge: 'Source' },
    { id: 'architecture', label: 'Architecture & System Blueprint', icon: Server, badge: 'Overview' },
    { id: 'configurator', label: 'Dynamic Zone Configurator', icon: HardHat, badge: 'Zones' },
    { id: 'postgres', label: 'PostgreSQL DDL & RLS Schema', icon: Database, badge: 'SQL' },
    { id: 'redis', label: 'Redis Hot-Cache & Streams', icon: Zap, badge: 'PubSub' },
    { id: 'api', label: 'REST & GraphQL API Studio', icon: Eye, badge: 'API' },
    { id: 'rbac', label: 'OAuth2 / JWT & RBAC Engine', icon: ShieldCheck, badge: 'Security' },
  ];

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Banner: Multi-tenant Context & Theme Switcher */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 border-b ${
        theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-white/10 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                EHS Sentinel Mobile Platform
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                PWA / Multi-Tenant
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Anatomical PPE AI Detection • Real-Time WebRTC Streams & Zero-Downtime Rule Matrix
            </p>
          </div>
        </div>

        {/* Facility Info & Actions */}
        <div className="flex items-center gap-2.5">
          {onOpenAddCamera && (
            <button
              onClick={onOpenAddCamera}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Add New Camera Feed"
            >
              <Plus className="w-4 h-4" />
              <span>Add Camera</span>
            </button>
          )}

          <div className={`hidden md:flex items-center gap-3 text-xs px-3.5 py-1.5 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500">Tenant:</span>
              <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>{tenant.name}</strong>
            </div>
            <span className={theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}>|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Facility:</span>
              <span className="text-amber-500 font-mono font-medium">{facility.code}</span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-800" />}
            <span className="hidden sm:inline font-mono text-[11px]">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop & Tablet Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : theme === 'dark'
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950 font-bold'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Fixed Bottom Navigation Dock (PWA Style) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl ${
        theme === 'dark' ? 'bg-slate-950/95 border-slate-800 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700'
      }`}>
        <button
          onClick={() => setActiveTab('multigrid-feed')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'multigrid-feed'
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Multi-Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('rule-matrix')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'rule-matrix'
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Rule Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('mobile-supervisor')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'mobile-supervisor'
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Supervisor</span>
        </button>

        <button
          onClick={() => setActiveTab('video-infra')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'video-infra'
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Video Studio</span>
        </button>

        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-amber-500"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
};
