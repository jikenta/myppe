import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Filter,
  Download,
  Printer,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  HardHat,
  Glasses,
  Footprints,
  Hand,
  Users,
  ChevronRight,
  Info,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import { CameraFeed, AnatomicalZone, PPEClass } from '../types/schema';
import {
  DAYS_OF_WEEK,
  HOURS_OF_DAY,
  GENERATED_HEATMAP_DATA,
  SHIFT_PERFORMANCE_METRICS,
  OSHA_RECORDABLE_LOGS,
  OSHA_SUMMARY_STATS,
} from '../data/mockAnalyticsData';
import { HeatmapCell, ShiftPerformanceMetric, OshaRecordableEntry } from '../types/analyticsSchema';
import { useTheme } from '../context/ThemeContext';

interface ComplianceAnalyticsReportsProps {
  cameras: CameraFeed[];
}

export const ComplianceAnalyticsReports: React.FC<ComplianceAnalyticsReportsProps> = ({ cameras }) => {
  const { theme } = useTheme();

  // Filters State
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'ALL' | AnatomicalZone>('ALL');
  const [selectedConfigFilter, setSelectedConfigFilter] = useState<'ALL' | 'ACTIVE_ONLY' | 'BYPASSED_ONLY'>('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'TODAY' | '7_DAYS' | '30_DAYS' | 'Q3_AUDIT'>('7_DAYS');
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<HeatmapCell | null>(null);
  const [selectedOshaRecord, setSelectedOshaRecord] = useState<OshaRecordableEntry | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Active Tab within Analytics
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'HEATMAP_TRENDS' | 'SHIFT_ANALYSIS' | 'OSHA_COMPLIANCE_LOGS'>(
    'HEATMAP_TRENDS'
  );

  // Filtered OSHA Logs based on active filters
  const filteredOshaLogs = useMemo(() => {
    return OSHA_RECORDABLE_LOGS.filter((log) => {
      if (selectedZoneFilter !== 'ALL' && log.anatomicalZone !== selectedZoneFilter) return false;
      if (selectedConfigFilter === 'ACTIVE_ONLY' && log.monitoringConfigState !== 'ACTIVE_ENFORCED') return false;
      if (selectedConfigFilter === 'BYPASSED_ONLY' && log.monitoringConfigState === 'ACTIVE_ENFORCED') return false;
      return true;
    });
  }, [selectedZoneFilter, selectedConfigFilter]);

  // Filtered Heatmap Data
  const filteredHeatmap = useMemo(() => {
    return GENERATED_HEATMAP_DATA.filter((cell) => {
      if (selectedShiftFilter !== 'ALL' && cell.peakShift !== selectedShiftFilter) return false;
      return true;
    });
  }, [selectedShiftFilter]);

  // Overall KPI summaries based on filters
  const summaryKpis = useMemo(() => {
    let baseCompliance = 93.8;
    let totalViolations = 148;
    let activeViolations = 114;
    let bypassedViolations = 34;

    if (selectedZoneFilter === 'HEAD') {
      baseCompliance = 97.5;
      totalViolations = 44;
      activeViolations = 38;
      bypassedViolations = 6;
    } else if (selectedZoneFilter === 'FACIAL') {
      baseCompliance = 97.9;
      totalViolations = 31;
      activeViolations = 21;
      bypassedViolations = 10;
    } else if (selectedZoneFilter === 'UPPER_BODY') {
      baseCompliance = 98.7;
      totalViolations = 25;
      activeViolations = 22;
      bypassedViolations = 3;
    } else if (selectedZoneFilter === 'EXTREMITIES') {
      baseCompliance = 96.6;
      totalViolations = 48;
      activeViolations = 33;
      bypassedViolations = 15;
    }

    if (selectedConfigFilter === 'ACTIVE_ONLY') {
      totalViolations = activeViolations;
    } else if (selectedConfigFilter === 'BYPASSED_ONLY') {
      totalViolations = bypassedViolations;
      baseCompliance = 89.2;
    }

    return {
      complianceRate: baseCompliance,
      totalViolations,
      activeViolations,
      bypassedViolations,
      hoursWorked: OSHA_SUMMARY_STATS.totalHoursWorked,
      trirEquivalent: OSHA_SUMMARY_STATS.trirEquivalentRate,
      mttaSeconds: OSHA_SUMMARY_STATS.mttaAverageSeconds,
      closurePct: OSHA_SUMMARY_STATS.correctiveActionClosurePct,
    };
  }, [selectedZoneFilter, selectedConfigFilter]);

  // Function to download CSV
  const handleExportCsv = () => {
    setIsExporting('CSV');
    const headers = [
      'Case Number',
      'Date',
      'Time',
      'Employee ID',
      'Job Title',
      'Zone',
      'Anatomical Zone',
      'PPE Class Violated',
      'OSHA Citation',
      'Monitoring Config State',
      'Severity',
      'Corrective Action',
      'Sign-off',
      'Closure Status',
    ];

    const rows = filteredOshaLogs.map((log) => [
      `"${log.caseNumber}"`,
      `"${log.dateOfOccurrence}"`,
      `"${log.timeOfOccurrence}"`,
      `"${log.employeeTrackId}"`,
      `"${log.jobTitle}"`,
      `"${log.departmentZone}"`,
      `"${log.anatomicalZone}"`,
      `"${log.ppeClassViolated}"`,
      `"${log.oshaStandardCitation}"`,
      `"${log.monitoringConfigState}"`,
      `"${log.severityClassification}"`,
      `"${log.correctiveActionTaken.replace(/"/g, '""')}"`,
      `"${log.supervisorSignOff}"`,
      `"${log.closureStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OSHA_300_EHS_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(null), 1000);
  };

  // Function to export JSON audit payload
  const handleExportJson = () => {
    setIsExporting('JSON');
    const payload = {
      facility: OSHA_SUMMARY_STATS.facilityCode,
      reportingPeriod: OSHA_SUMMARY_STATS.reportingPeriod,
      generatedAt: new Date().toISOString(),
      summaryStats: summaryKpis,
      filtersApplied: {
        anatomicalZone: selectedZoneFilter,
        monitoringConfig: selectedConfigFilter,
        shift: selectedShiftFilter,
        timeRange: selectedTimeRange,
      },
      recordsCount: filteredOshaLogs.length,
      records: filteredOshaLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EHS_OSHA_Audit_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);

    setTimeout(() => setIsExporting(null), 1000);
  };

  // Color generator for Heatmap cells based on compliance %
  const getHeatmapColor = (compliance: number) => {
    if (compliance >= 97.0) return theme === 'dark' ? 'bg-emerald-600/90 text-white' : 'bg-emerald-500 text-white';
    if (compliance >= 93.0) return theme === 'dark' ? 'bg-emerald-700/60 text-emerald-100' : 'bg-emerald-400 text-slate-900';
    if (compliance >= 88.0) return theme === 'dark' ? 'bg-amber-600/70 text-amber-100' : 'bg-amber-400 text-slate-900';
    if (compliance >= 82.0) return theme === 'dark' ? 'bg-orange-600/80 text-white' : 'bg-orange-400 text-white';
    return theme === 'dark' ? 'bg-rose-600 text-white font-bold' : 'bg-rose-500 text-white font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: AI Operations & EHS Compliance Lead Command Bar */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                EHS Compliance Analytics & OSHA Reporting Hub
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                OSHA 1910 / 1926 • ISO 45001 Certified
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Temporal compliance heatmaps, multi-shift fatigue & non-compliance trends, and certified OSHA 300 / 300A audit reports filtered by anatomical body zones and dynamic rule configurations.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className={`p-1 rounded-xl border flex flex-wrap text-xs font-mono font-medium ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setAnalyticsSubTab('HEATMAP_TRENDS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                analyticsSubTab === 'HEATMAP_TRENDS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Compliance Heatmap (7x24)</span>
            </button>

            <button
              onClick={() => setAnalyticsSubTab('SHIFT_ANALYSIS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                analyticsSubTab === 'SHIFT_ANALYSIS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Shift Breakdown Trends</span>
            </button>

            <button
              onClick={() => setAnalyticsSubTab('OSHA_COMPLIANCE_LOGS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                analyticsSubTab === 'OSHA_COMPLIANCE_LOGS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>OSHA 300 Log & Export</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {filteredOshaLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Global Multi-Dimensional Filter Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Anatomical Zone Filter */}
          <div className="space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">1. Anatomical Zone:</span>
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value as any)}
              className={`w-full p-2 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Anatomical Zones (All 11 Classes)</option>
              <option value="HEAD">Head Zone (Hard Hats & Helmets)</option>
              <option value="FACIAL">Facial Zone (Glasses & Respirators)</option>
              <option value="UPPER_BODY">Upper Body (High-Vis Safety Vests)</option>
              <option value="EXTREMITIES">Extremities (Gloves & Steel-Toe Boots)</option>
            </select>
          </div>

          {/* Monitoring Configuration Filter (Active vs Bypassed) */}
          <div className="space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">2. Rule Configuration State:</span>
            <select
              value={selectedConfigFilter}
              onChange={(e) => setSelectedConfigFilter(e.target.value as any)}
              className={`w-full p-2 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Rules (Enforced & Bypassed)</option>
              <option value="ACTIVE_ONLY">Active Enforced Rules Only (Floor Alerts Fired)</option>
              <option value="BYPASSED_ONLY">Bypassed / Deselected Configurations Only</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div className="space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">3. Operational Shift:</span>
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value as any)}
              className={`w-full p-2 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All 3 Shifts (24-Hour Coverage)</option>
              <option value="MORNING">Shift A: Morning (06:00 - 14:00)</option>
              <option value="AFTERNOON">Shift B: Afternoon (14:00 - 22:00)</option>
              <option value="NIGHT">Shift C: Night Tooling (22:00 - 06:00)</option>
            </select>
          </div>

          {/* Time Range Preset */}
          <div className="space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">4. Audit Reporting Period:</span>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className={`w-full p-2 rounded-xl border font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="TODAY">Today (Real-time Live Stream)</option>
              <option value="7_DAYS">Past 7 Days (Standard Audit Cycle)</option>
              <option value="30_DAYS">Past 30 Days (Monthly ISO 45001)</option>
              <option value="Q3_AUDIT">Q3 2026 OSHA Comprehensive Audit</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Compliance Rate */}
        <div className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } space-y-1`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Compliance Rate</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-400">{summaryKpis.complianceRate}%</span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">↑ 1.8%</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Target: 95.0% Benchmark</span>
        </div>

        {/* Total Violations */}
        <div className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } space-y-1`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Incidents</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-rose-400">{summaryKpis.totalViolations}</span>
            <span className="text-[10px] font-mono text-slate-400">({summaryKpis.activeViolations} Active)</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">{summaryKpis.bypassedViolations} Suppressed/Bypassed</span>
        </div>

        {/* Total Hours Worked */}
        <div className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } space-y-1`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Worker Hours</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-blue-400">{summaryKpis.hoursWorked.toLocaleString()}</span>
            <span className="text-[10px] font-mono text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">386 Active Personnel</span>
        </div>

        {/* OSHA TRIR Near-Miss Index */}
        <div className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } space-y-1`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">OSHA TRIR Proxy</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-400">{summaryKpis.trirEquivalent}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Low Risk</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">(Incidents × 200k) / Hours</span>
        </div>

        {/* MTTA Seconds */}
        <div className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } space-y-1`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">MTTA Triage Time</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-purple-400">{summaryKpis.mttaSeconds}s</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">⚡ Fast</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Mean Floor Response</span>
        </div>

        {/* Corrective Action Closure */}
        <div className={`p-4 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } space-y-1`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Action Closure</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-400">{summaryKpis.closurePct}%</span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">Certified</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Supervisor Sign-off</span>
        </div>
      </div>

      {/* SUB-TAB 1: 7x24 TEMPORAL COMPLIANCE HEATMAP & HOURLY DENSITY */}
      {analyticsSubTab === 'HEATMAP_TRENDS' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Temporal Compliance Heatmap (7 Days × 24 Hours)
                  </h3>
                </div>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Identifies systemic fatigue windows, shift changeover non-compliance spikes, and zone-level compliance variance.
                </p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-slate-500">Compliance:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">&gt;97%</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white">93-97%</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white">88-93%</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white">82-88%</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">&lt;82%</span>
              </div>
            </div>

            {/* Shift Markers Header */}
            <div className="grid grid-cols-24 gap-1 text-[9px] font-mono text-slate-500 text-center pl-12">
              <div className="col-span-6 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded py-0.5 font-bold">
                Shift C (Night: 00-05)
              </div>
              <div className="col-span-8 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded py-0.5 font-bold">
                Shift A (Morning: 06-13)
              </div>
              <div className="col-span-8 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded py-0.5 font-bold">
                Shift B (Afternoon: 14-21)
              </div>
              <div className="col-span-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded py-0.5 font-bold">
                Shift C (22-23)
              </div>
            </div>

            {/* Hour Numbers Row */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 pl-12">
              {HOURS_OF_DAY.map((h) => (
                <div key={h} className="flex-1 text-center font-bold">
                  {h < 10 ? `0${h}` : h}
                </div>
              ))}
            </div>

            {/* 7 Days Matrix */}
            <div className="space-y-1.5">
              {DAYS_OF_WEEK.map((day, dIdx) => (
                <div key={day} className="flex items-center gap-1.5">
                  <span className="w-10 text-xs font-mono font-bold text-slate-400 text-right pr-2">
                    {day}
                  </span>

                  <div className="flex-1 grid grid-cols-24 gap-1">
                    {HOURS_OF_DAY.map((hour) => {
                      const cell = GENERATED_HEATMAP_DATA.find((c) => c.dayIndex === dIdx && c.hour === hour);
                      if (!cell) return null;

                      const isSelectedShift = selectedShiftFilter === 'ALL' || cell.peakShift === selectedShiftFilter;
                      const opacity = isSelectedShift ? 'opacity-100' : 'opacity-20';

                      return (
                        <div
                          key={`${dIdx}-${hour}`}
                          onMouseEnter={() => setHoveredHeatmapCell(cell)}
                          className={`h-7 rounded transition-all cursor-pointer flex items-center justify-center text-[9px] font-mono select-none ${getHeatmapColor(
                            cell.complianceRate
                          )} ${opacity} hover:scale-110 hover:z-20 hover:ring-2 hover:ring-white`}
                        >
                          <span className="hidden sm:inline">{cell.complianceRate.toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Cell Hover Detail Card */}
            {hoveredHeatmapCell && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                      {hoveredHeatmapCell.dayOfWeek} @ {hoveredHeatmapCell.hour < 10 ? `0${hoveredHeatmapCell.hour}` : hoveredHeatmapCell.hour}:00 CST
                    </span>
                    <span className="text-amber-400 font-bold">{hoveredHeatmapCell.peakShift} SHIFT</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Total Detections: <span className="text-white font-bold">{hoveredHeatmapCell.totalDetections}</span> • Violations: <span className="text-rose-400 font-bold">{hoveredHeatmapCell.totalViolations}</span> (Bypassed: {hoveredHeatmapCell.bypassedViolations})
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Dominant Infraction:</span>
                    <span className="text-rose-400 font-bold">{hoveredHeatmapCell.dominantViolationClass}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Compliance Rate:</span>
                    <span className="text-emerald-400 font-bold text-base">{hoveredHeatmapCell.complianceRate}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SHIFT BREAKDOWN TRENDS & ANATOMICAL COMPARISONS */}
      {analyticsSubTab === 'SHIFT_ANALYSIS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {SHIFT_PERFORMANCE_METRICS.map((shift) => (
              <div
                key={shift.shiftId}
                className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">{shift.timeRange}</span>
                    <h3 className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {shift.shiftName}
                    </h3>
                  </div>
                  <span className={`text-base font-bold font-mono ${
                    shift.complianceRate >= 94.0 ? 'text-emerald-400' : shift.complianceRate >= 90.0 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {shift.complianceRate}%
                  </span>
                </div>

                {/* Supervisor & Headcount */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Supervisor:</span>
                    <span className="text-slate-300 font-bold truncate block">{shift.supervisorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Headcount:</span>
                    <span className="text-blue-400 font-bold">{shift.workerHeadcount} Workers ({shift.workerHoursExposed}h)</span>
                  </div>
                </div>

                {/* Hourly Compliance Curves */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Hourly Shift Curve:</span>
                    <span>Incidents</span>
                  </div>
                  <div className="space-y-1">
                    {shift.hourlyTrends.map((trend) => (
                      <div key={trend.hour} className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="w-10 text-slate-500">{trend.hour}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full ${trend.compliance >= 94 ? 'bg-emerald-500' : trend.compliance >= 90 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${trend.compliance}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-slate-300">{trend.compliance.toFixed(1)}%</span>
                        <span className="w-6 text-right font-bold text-rose-400">{trend.violations}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anatomical Zone Breakdown Progress */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                    Zone Compliance Breakdown:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <HardHat className="w-3 h-3 text-amber-500" /> Head:
                      </span>
                      <span className="text-emerald-400 font-bold">{shift.zoneBreakdown.HEAD.complianceRate}%</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Glasses className="w-3 h-3 text-purple-500" /> Facial:
                      </span>
                      <span className="text-emerald-400 font-bold">{shift.zoneBreakdown.FACIAL.complianceRate}%</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-blue-500" /> Torso:
                      </span>
                      <span className="text-emerald-400 font-bold">{shift.zoneBreakdown.UPPER_BODY.complianceRate}%</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Footprints className="w-3 h-3 text-rose-500" /> Feet/Hands:
                      </span>
                      <span className="text-amber-400 font-bold">{shift.zoneBreakdown.EXTREMITIES.complianceRate}%</span>
                    </div>
                  </div>
                </div>

                {/* MTTA Metric */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Mean Triage Time:
                  </span>
                  <span className="text-emerald-400 font-bold">{shift.meanTimeToAcknowledgeSec} seconds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXPORTABLE OSHA COMPLIANCE LOGS (OSHA 300 / 300A HUB) */}
      {analyticsSubTab === 'OSHA_COMPLIANCE_LOGS' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Header & Export Action Hub */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Official OSHA 300 / 300A Compliance & Near-Miss Log
                  </h3>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Record of PPE non-compliance near-misses and regulatory citations under 29 CFR 1910 Subpart I with certified remediation audit trails.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Formal Audit PDF</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-emerald-700 hover:bg-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-amber-400 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-amber-700 hover:bg-slate-200'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>Export JSON Stream</span>
                </button>
              </div>
            </div>

            {/* OSHA Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Case Number & Date</th>
                    <th className="p-3">Employee Track & Job Title</th>
                    <th className="p-3">Zone & Camera</th>
                    <th className="p-3">OSHA Citation & Standard</th>
                    <th className="p-3">Config State</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                  {filteredOshaLogs.map((log) => (
                    <tr
                      key={log.caseNumber}
                      className={theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}
                    >
                      <td className="p-3">
                        <div className="font-bold text-amber-400">{log.caseNumber}</div>
                        <div className="text-[10px] text-slate-500">{log.dateOfOccurrence} • {log.timeOfOccurrence}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-blue-400">{log.employeeTrackId}</div>
                        <div className="text-[10px] text-slate-400">{log.jobTitle}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200">{log.departmentZone}</div>
                        <div className="text-[10px] text-slate-500">{log.cameraId}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold block w-fit">
                          {log.oshaStandardCitation}
                        </span>
                        <span className="text-[10px] text-slate-400">{log.ppeClassViolated}</span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.monitoringConfigState === 'ACTIVE_ENFORCED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {log.monitoringConfigState === 'ACTIVE_ENFORCED' ? 'ENFORCED' : 'BYPASSED'}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.severityClassification === 'NEAR_MISS_CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {log.severityClassification}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.closureStatus === 'CLOSED_REMEDIATED'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}>
                          {log.closureStatus}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedOshaRecord(log)}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                        >
                          Inspect Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT OSHA RECORD MODAL */}
      {selectedOshaRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl border rounded-2xl overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white font-mono text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-bold">OSHA 300 AUDIT LOG: {selectedOshaRecord.caseNumber}</span>
              </div>
              <button
                onClick={() => setSelectedOshaRecord(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Employee ID:</span>
                  <span className="font-bold text-blue-400">{selectedOshaRecord.employeeTrackId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Job Title:</span>
                  <span className="font-bold text-slate-200">{selectedOshaRecord.jobTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Occurrence Time:</span>
                  <span className="font-bold text-amber-400">{selectedOshaRecord.dateOfOccurrence} {selectedOshaRecord.timeOfOccurrence}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Regulatory Standard Citation:</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedOshaRecord.oshaStandardCitation}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 block text-[10px]">Hazard Description & Root Cause:</span>
                <p className="text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 font-sans leading-relaxed">
                  {selectedOshaRecord.descriptionOfHazard}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 block text-[10px]">Corrective Action Remediated:</span>
                <p className="text-emerald-300 bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/40 font-sans leading-relaxed">
                  {selectedOshaRecord.correctiveActionTaken}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Certified Sign-off: <strong className="text-white">{selectedOshaRecord.supervisorSignOff}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {selectedOshaRecord.closureStatus}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOshaRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-mono hover:bg-slate-700 font-bold"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-READY OSHA AUDIT MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 border rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Printable Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  OSHA Form 300 / 300A Equivalent EHS Safety Audit Summary
                </h1>
                <p className="text-xs text-slate-600 font-mono">
                  U.S. Department of Labor • Occupational Safety and Health Administration (29 CFR 1904 / 1910)
                </p>
              </div>
              <div className="text-right text-xs font-mono">
                <div className="font-bold">{OSHA_SUMMARY_STATS.facilityCode}</div>
                <div className="text-slate-500">Period: {OSHA_SUMMARY_STATS.reportingPeriod}</div>
              </div>
            </div>

            {/* Executive Summary Metric Grid */}
            <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Total Hours Monitored:</span>
                <span className="font-bold text-base text-slate-900">{OSHA_SUMMARY_STATS.totalHoursWorked.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PPE Compliance Rate:</span>
                <span className="font-bold text-base text-emerald-700">{summaryKpis.complianceRate}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Recorded Near-Misses:</span>
                <span className="font-bold text-base text-rose-700">{summaryKpis.totalViolations}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Action Closure Rate:</span>
                <span className="font-bold text-base text-blue-700">{OSHA_SUMMARY_STATS.correctiveActionClosurePct}%</span>
              </div>
            </div>

            {/* Recordable Log Rows */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">
                Itemized Incident Audit Trail:
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-200 text-slate-800 font-mono">
                  <tr>
                    <th className="p-2 border">Case #</th>
                    <th className="p-2 border">Date & Zone</th>
                    <th className="p-2 border">Employee Track</th>
                    <th className="p-2 border">Standard Citation</th>
                    <th className="p-2 border">Remediation Action</th>
                    <th className="p-2 border">Sign-Off</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOshaLogs.map((log) => (
                    <tr key={log.caseNumber} className="border-b">
                      <td className="p-2 border font-mono font-bold">{log.caseNumber}</td>
                      <td className="p-2 border">{log.dateOfOccurrence} ({log.departmentZone})</td>
                      <td className="p-2 border font-mono">{log.employeeTrackId}</td>
                      <td className="p-2 border font-mono font-bold text-blue-800">{log.oshaStandardCitation}</td>
                      <td className="p-2 border text-[11px]">{log.correctiveActionTaken}</td>
                      <td className="p-2 border font-mono text-[10px]">{log.supervisorSignOff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Certification Footer */}
            <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div>
                <p className="text-[11px] text-slate-600">
                  I certify that I have examined this document and that to the best of my knowledge, the entries are true, accurate, and complete.
                </p>
                <div className="mt-3 font-bold text-slate-900">
                  Certified Safety Professional: Marcus Vance, CSP (#CSP-49821)
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Print PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
