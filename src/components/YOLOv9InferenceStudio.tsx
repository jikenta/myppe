import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Sliders,
  Folder,
  FileText,
  FileImage,
  Layers,
  Activity,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code,
  HardHat,
  Glasses,
  Footprints,
  Hand,
  User,
  Download,
  Copy,
  Check,
  Terminal,
  Volume2,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Database,
  Radio,
  Clock
} from 'lucide-react';
import { CameraFeed } from '../types/schema';
import { PPE_CLASS_DEFINITIONS } from '../data/mockData';
import { YOLOV9_TENSORRT_INFERENCE_PY, DYNAMIC_VIOLATION_ENGINE_PY } from '../data/yoloInferenceSourceCode';
import { useTheme } from '../context/ThemeContext';

interface YOLOv9InferenceStudioProps {
  cameras: CameraFeed[];
}

interface SimulatedDetection {
  id: string;
  className: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in percent
  isExplicitViolation: boolean;
  isCompliant: boolean;
  assignedWorker: string;
  zoneType: 'HEAD' | 'FACIAL' | 'TORSO' | 'EXTREMITIES_HANDS' | 'EXTREMITIES_FEET' | 'PERSON';
}

interface AuditLogEntry {
  violation_id: string;
  camera_id: string;
  zone_id: string;
  rule_class: string;
  violation_type: 'EXPLICIT_CLASS_VIOLATION' | 'SPATIAL_INTERSECTION_MISSING_PPE';
  confidence: number;
  worker_id: string;
  evidence_path: string;
  file_size_bytes: number;
  timestamp: string;
}

export const YOLOv9InferenceStudio: React.FC<YOLOv9InferenceStudioProps> = ({ cameras }) => {
  const { theme } = useTheme();
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || 'cam-01-weld');
  const [activeTab, setActiveTab] = useState<'PIPELINE_HARNESS' | 'SPATIAL_ENGINE' | 'EVIDENCE_STORAGE' | 'PYTHON_SOURCE'>('PIPELINE_HARNESS');
  const [confidenceCutoff, setConfidenceCutoff] = useState<number>(0.55);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedLogRecord, setSelectedLogRecord] = useState<AuditLogEntry | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'INFERENCE_SERVICE' | 'VIOLATION_ENGINE'>('VIOLATION_ENGINE');

  // Per-camera active rule configuration toggles state (simulating live Redis cache)
  const [cameraProfiles, setCameraProfiles] = useState<Record<string, Record<string, { enabled: boolean; threshold: number; action: string }>>>(() => {
    const profiles: Record<string, Record<string, { enabled: boolean; threshold: number; action: string }>> = {};
    cameras.forEach((cam) => {
      profiles[cam.id] = {
        head_helmet: { enabled: true, threshold: 0.85, action: 'LOG' },
        head_nohelmet: { enabled: true, threshold: 0.85, action: 'ALERT_EHS' },
        glasses: { enabled: true, threshold: 0.80, action: 'LOG' },
        face_mask: { enabled: true, threshold: 0.82, action: 'LOG' },
        face_nomask: { enabled: cam.id !== 'cam-01-weld', threshold: 0.86, action: 'ALERT_EHS' }, // Line 3 welding mask bypassed
        vest: { enabled: true, threshold: 0.85, action: 'ALERT_EHS' },
        hand_glove: { enabled: true, threshold: 0.80, action: 'LOG' },
        hand_noglove: { enabled: true, threshold: 0.85, action: 'ALERT_EHS' },
        boots: { enabled: true, threshold: 0.80, action: 'LOG' },
        shoes: { enabled: true, threshold: 0.85, action: 'ALERT_EHS' },
      };
    });
    return profiles;
  });

  // Simulated live raw detections from YOLOv9 TensorRT FP16 engine
  const [rawDetections, setRawDetections] = useState<SimulatedDetection[]>([
    {
      id: 'det-01',
      className: 'person',
      confidence: 0.962,
      bbox: [32, 18, 60, 88],
      isExplicitViolation: false,
      isCompliant: false,
      assignedWorker: 'TRACK_P042',
      zoneType: 'PERSON',
    },
    {
      id: 'det-02',
      className: 'head_nohelmet',
      confidence: 0.945,
      bbox: [38, 20, 52, 36],
      isExplicitViolation: true,
      isCompliant: false,
      assignedWorker: 'TRACK_P042',
      zoneType: 'HEAD',
    },
    {
      id: 'det-03',
      className: 'face_nomask',
      confidence: 0.884,
      bbox: [40, 27, 49, 36],
      isExplicitViolation: true,
      isCompliant: false,
      assignedWorker: 'TRACK_P042',
      zoneType: 'FACIAL',
    },
    {
      id: 'det-04',
      className: 'vest',
      confidence: 0.921,
      bbox: [35, 36, 57, 64],
      isExplicitViolation: false,
      isCompliant: true,
      assignedWorker: 'TRACK_P042',
      zoneType: 'TORSO',
    },
    {
      id: 'det-05',
      className: 'hand_noglove',
      confidence: 0.897,
      bbox: [34, 56, 45, 70],
      isExplicitViolation: true,
      isCompliant: false,
      assignedWorker: 'TRACK_P042',
      zoneType: 'EXTREMITIES_HANDS',
    },
    {
      id: 'det-06',
      className: 'boots',
      confidence: 0.885,
      bbox: [38, 76, 54, 88],
      isExplicitViolation: false,
      isCompliant: true,
      assignedWorker: 'TRACK_P042',
      zoneType: 'EXTREMITIES_FEET',
    },
  ]);

  // Committed Visual Evidence Log in /var/log/ppe_violations/
  const [evidenceLog, setEvidenceLog] = useState<AuditLogEntry[]>([
    {
      violation_id: 'viol_1771485901230_head_nohelmet',
      camera_id: 'cam-01-weld',
      zone_id: 'ZONE-ARC-HAZARD-01',
      rule_class: 'head_nohelmet',
      violation_type: 'EXPLICIT_CLASS_VIOLATION',
      confidence: 0.945,
      worker_id: 'TRACK_P042',
      evidence_path: '/var/log/ppe_violations/cam-01-weld/2026-08-20/viol_1771485901230_head_nohelmet.jpg',
      file_size_bytes: 418290,
      timestamp: '2026-08-20T15:24:10.230Z',
    },
    {
      violation_id: 'viol_1771485901245_hand_noglove',
      camera_id: 'cam-01-weld',
      zone_id: 'ZONE-ARC-HAZARD-01',
      rule_class: 'hand_noglove',
      violation_type: 'EXPLICIT_CLASS_VIOLATION',
      confidence: 0.897,
      worker_id: 'TRACK_P042',
      evidence_path: '/var/log/ppe_violations/cam-01-weld/2026-08-20/viol_1771485901245_hand_noglove.jpg',
      file_size_bytes: 389140,
      timestamp: '2026-08-20T15:24:10.245Z',
    },
    {
      violation_id: 'viol_1771485892110_face_nomask',
      camera_id: 'cam-02-chem',
      zone_id: 'ZONE-ACID-BATH-C2',
      rule_class: 'face_nomask',
      violation_type: 'EXPLICIT_CLASS_VIOLATION',
      confidence: 0.963,
      worker_id: 'TRACK_P019',
      evidence_path: '/var/log/ppe_violations/cam-02-chem/2026-08-20/viol_1771485892110_face_nomask.jpg',
      file_size_bytes: 512400,
      timestamp: '2026-08-20T15:23:45.110Z',
    },
    {
      violation_id: 'viol_1771485880050_missing_boots',
      camera_id: 'cam-03-dock',
      zone_id: 'ZONE-SUSPENDED-LOAD-01',
      rule_class: 'shoes',
      violation_type: 'SPATIAL_INTERSECTION_MISSING_PPE',
      confidence: 0.897,
      worker_id: 'TRACK_P088',
      evidence_path: '/var/log/ppe_violations/cam-03-dock/2026-08-20/viol_1771485880050_missing_boots.jpg',
      file_size_bytes: 462100,
      timestamp: '2026-08-20T15:22:30.050Z',
    },
  ]);

  const selectedCam = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  const activeProfile = cameraProfiles[selectedCameraId] || {};

  // Toggle rule in active profile
  const handleToggleRule = (className: string) => {
    const current = activeProfile[className] || { enabled: true, threshold: 0.85, action: 'LOG' };
    const updated = {
      ...activeProfile,
      [className]: {
        ...current,
        enabled: !current.enabled,
      },
    };
    setCameraProfiles({
      ...cameraProfiles,
      [selectedCameraId]: updated,
    });
  };

  // Evaluation breakdown using Dynamic Violation Engine logic
  const evaluationResult = React.useMemo(() => {
    const activeViolations: Array<SimulatedDetection & { triggerReason: string; action: string }> = [];
    const filteredBypassed: Array<SimulatedDetection & { bypassReason: string }> = [];
    const compliantList: SimulatedDetection[] = [];

    rawDetections.forEach((det) => {
      if (det.className === 'person') return;

      const ruleCfg = activeProfile[det.className] || { enabled: true, threshold: 0.55, action: 'ALERT_EHS' };

      if (det.isExplicitViolation) {
        if (!ruleCfg.enabled) {
          filteredBypassed.push({
            ...det,
            bypassReason: `Rule [${det.className}] is DESELECTED in ${selectedCam.camera_uid} profile (Bypassed)`,
          });
        } else if (det.confidence < confidenceCutoff) {
          filteredBypassed.push({
            ...det,
            bypassReason: `Confidence ${(det.confidence * 100).toFixed(1)}% is BELOW the ${(confidenceCutoff * 100).toFixed(0)}% cutoff threshold`,
          });
        } else {
          activeViolations.push({
            ...det,
            triggerReason: `Explicit violation class [${det.className}] detected with ${(det.confidence * 100).toFixed(1)}% confidence (> ${(confidenceCutoff * 100).toFixed(0)}% threshold)`,
            action: ruleCfg.action,
          });
        }
      } else if (det.isCompliant) {
        compliantList.push(det);
      }
    });

    // Check spatial intersection for missing vest or missing boots
    const personDet = rawDetections.find((d) => d.className === 'person');
    if (personDet) {
      const vestRule = activeProfile['vest'] || { enabled: true, threshold: 0.55, action: 'ALERT_EHS' };
      const hasVest = rawDetections.some((d) => d.className === 'vest' && d.confidence >= confidenceCutoff);
      if (vestRule.enabled && !hasVest && personDet.confidence >= confidenceCutoff) {
        activeViolations.push({
          id: 'spatial-vest-violation',
          className: 'missing_vest',
          confidence: personDet.confidence,
          bbox: [personDet.bbox[0], personDet.bbox[1] + 20, personDet.bbox[2], personDet.bbox[1] + 50],
          isExplicitViolation: true,
          isCompliant: false,
          assignedWorker: personDet.assignedWorker,
          zoneType: 'TORSO',
          triggerReason: `Spatial Intersection Overlap: Worker [${personDet.assignedWorker}] torso lacks required hi-vis safety vest in high-hazard zone`,
          action: vestRule.action,
        });
      }
    }

    return {
      activeViolations,
      filteredBypassed,
      compliantList,
    };
  }, [rawDetections, activeProfile, confidenceCutoff, selectedCam]);

  const copyCodeToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                YOLOv9-e TensorRT & Dynamic Violation Engine Studio
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                TensorRT 10.x FP16 • 3.8ms Latency
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Evaluates YOLOv9-e anatomical bounding box predictions against per-camera monitoring toggles, resolves spatial intersections, and commits visual evidence to <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-amber-400">/var/log/ppe_violations/</code> when confidence &gt; 0.55.
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className={`p-1 rounded-xl border flex flex-wrap text-xs font-mono font-medium ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('PIPELINE_HARNESS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'PIPELINE_HARNESS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Inference Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('SPATIAL_ENGINE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'SPATIAL_ENGINE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Spatial Intersection</span>
            </button>

            <button
              onClick={() => setActiveTab('EVIDENCE_STORAGE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'EVIDENCE_STORAGE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Evidence Storage</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {evidenceLog.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PYTHON_SOURCE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'PYTHON_SOURCE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Python Source</span>
            </button>
          </div>
        </div>

        {/* Global Controls: Camera Selector & Confidence Threshold Slider */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Active Camera Feed:</span>
            {cameras.map((cam) => {
              const isSelected = selectedCameraId === cam.id;
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCameraId(cam.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cam.camera_uid} ({cam.name.split(' ')[0]})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-400">Violation Cutoff:</span>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.01"
                value={confidenceCutoff}
                onChange={(e) => setConfidenceCutoff(parseFloat(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
              <span className="text-amber-500 font-bold">{(confidenceCutoff * 100).toFixed(0)}%</span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-100 border-slate-200 text-emerald-600'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Inference: 3.8ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: PIPELINE TEST HARNESS & DYNAMIC EVALUATION BREAKDOWN */}
      {activeTab === 'PIPELINE_HARNESS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Frame with Overlay + Per-Camera Active Toggles (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Camera Viewport with Color-Coded Detections */}
            <div className={`border rounded-2xl overflow-hidden shadow-sm ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-3 border-b flex items-center justify-between font-mono text-xs ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold">{selectedCam.camera_uid}</span>
                  <span className="text-slate-500">• {selectedCam.location_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">YOLOv9-e TRT Engine</span>
                </div>
              </div>

              {/* Viewport Canvas */}
              <div className="relative aspect-video bg-black overflow-hidden select-none">
                <img
                  src={
                    selectedCam.id === 'cam-01-weld'
                      ? 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80'
                      : selectedCam.id === 'cam-02-chem'
                      ? 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80'
                      : 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt="Camera Stream"
                  className="w-full h-full object-cover opacity-85"
                />

                {/* Overlaid Detected Bounding Boxes */}
                {rawDetections.map((det) => {
                  const ruleCfg = activeProfile[det.className] || { enabled: true, threshold: 0.55 };
                  const isBypassed = det.isExplicitViolation && (!ruleCfg.enabled || det.confidence < confidenceCutoff);
                  const isViolationActive = det.isExplicitViolation && ruleCfg.enabled && det.confidence >= confidenceCutoff;
                  const isCompliant = det.isCompliant;
                  const isPerson = det.className === 'person';

                  const borderColor = isViolationActive
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 ring-1 ring-rose-500'
                    : isBypassed
                    ? 'border-slate-400/50 bg-slate-500/10 text-slate-400 border-dashed'
                    : isCompliant
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-blue-400/80 bg-blue-500/10 text-blue-300';

                  const badgeBg = isViolationActive
                    ? 'bg-rose-600 text-white'
                    : isBypassed
                    ? 'bg-slate-700 text-slate-300'
                    : isCompliant
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white';

                  const x = det.bbox[0];
                  const y = det.bbox[1];
                  const w = det.bbox[2] - det.bbox[0];
                  const h = det.bbox[3] - det.bbox[1];

                  return (
                    <div
                      key={det.id}
                      className={`absolute border-2 rounded transition-all duration-200 ${borderColor}`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${w}%`,
                        height: `${h}%`,
                      }}
                    >
                      <div
                        className={`absolute -top-5 left-0 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded shadow flex items-center gap-1 whitespace-nowrap ${badgeBg}`}
                      >
                        <span>{det.className}</span>
                        <span>{(det.confidence * 100).toFixed(0)}%</span>
                        {isBypassed && <span className="text-[8px] bg-slate-900 px-1 rounded">BYPASSED</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Bar */}
              <div className={`p-3 border-t grid grid-cols-3 gap-2 text-[11px] font-mono ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-500 block text-[9px]">ACTIVE PROFILE</span>
                  <span className="font-bold text-amber-500">{selectedCam.camera_uid} Profile</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">RESOLVED VIOLATIONS</span>
                  <span className="font-bold text-rose-500">{evaluationResult.activeViolations.length} Active</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">BYPASSED / FILTERED</span>
                  <span className="font-bold text-slate-400">{evaluationResult.filteredBypassed.length} Suppressed</span>
                </div>
              </div>
            </div>

            {/* Per-Camera Rule Toggles (Hot-Reload Simulator) */}
            <div className={`border rounded-2xl p-4 shadow-sm space-y-3 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Active Camera Dynamic Rule Toggles ({selectedCam.camera_uid})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Zero-Downtime Sync</span>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Toggle any rule to immediately test how the Dynamic Violation Engine filters out detections in real time without dropping frames:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {PPE_CLASS_DEFINITIONS.map((def) => {
                  const rule = activeProfile[def.class_name] || { enabled: true };
                  const isViolation = def.type === 'VIOLATION';
                  return (
                    <button
                      key={def.class_name}
                      onClick={() => handleToggleRule(def.class_name)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        rule.enabled
                          ? isViolation
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : theme === 'dark'
                          ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{def.class_name}</div>
                        <div className="text-[9px] opacity-70">{def.type}</div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        rule.enabled ? (isViolation ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-600'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Engine Decision Stream & Evidence Committer (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Active Violations (Confidence > 0.55 & Rule Enabled) */}
            <div className={`border rounded-2xl p-4 shadow-sm space-y-3 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
                    Evaluated Active Violations ({evaluationResult.activeViolations.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  DISPATCHING
                </span>
              </div>

              {evaluationResult.activeViolations.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-500 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-300">All Workers Fully Compliant</p>
                  <p className="text-[11px]">No active violations exceed {confidenceCutoff * 100}% threshold.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {evaluationResult.activeViolations.map((v, i) => (
                    <div
                      key={v.id + i}
                      className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                            {v.className.toUpperCase()}
                          </span>
                          <span className="text-slate-300 font-bold">{v.assignedWorker}</span>
                        </div>
                        <span className="text-emerald-400 font-bold">{(v.confidence * 100).toFixed(1)}% Conf</span>
                      </div>

                      <p className="text-[11px] text-rose-200 leading-relaxed font-sans">{v.triggerReason}</p>

                      <div className="pt-2 border-t border-rose-900/40 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Volume2 className="w-3 h-3" /> Relay Siren: {v.action}
                        </span>
                        <span className="text-emerald-400">Committed to Disk ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filtered / Bypassed Detections (Deselected Rules or Confidence < 0.55) */}
            <div className={`border rounded-2xl p-4 shadow-sm space-y-3 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Suppressed & Filtered Stream ({evaluationResult.filteredBypassed.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Zero False Alarms</span>
              </div>

              {evaluationResult.filteredBypassed.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 italic p-3">No detections currently suppressed.</p>
              ) : (
                <div className="space-y-2">
                  {evaluationResult.filteredBypassed.map((b, i) => (
                    <div
                      key={b.id + i}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">{b.className}</span>
                        <span className="text-slate-500">{(b.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">{b.bypassReason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Commit Destination */}
            <div className={`p-4 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
            } text-xs font-mono space-y-2`}>
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <Folder className="w-4 h-4" />
                <span>Evidence Logging Directory:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Visual evidence captures are saved to:
              </p>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] break-all">
                /var/log/ppe_violations/{selectedCam.camera_uid}/2026-08-20/
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPATIAL INTERSECTION & ANATOMICAL ENGINE */}
      {activeTab === 'SPATIAL_ENGINE' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Spatial Containment & Intersection-over-Person (IoP) Algorithm
                </h3>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Anthropometric sub-region segmentation decomposes detected workers into 5 anatomical target zones to identify missing PPE (e.g. bare torso missing vest, street shoes vs. steel-toe boots).
                </p>
              </div>
              <span className="text-xs font-mono text-amber-500 font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                Spatial Math Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Interactive Anatomical Mesh Canvas (5 cols) */}
              <div className="md:col-span-5 relative aspect-[3/4] bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-between">
                  <span>Worker Anchor: TRACK_P042</span>
                  <span className="text-emerald-400">IoP Geometry Mesh</span>
                </div>

                {/* Body Segmentation Zones Diagram */}
                <div className="relative flex-1 my-2 border-2 border-blue-500/40 rounded-xl bg-blue-500/5 p-2 flex flex-col justify-between">
                  {/* Head Zone (Top 22%) */}
                  <div className="h-[22%] border-2 border-amber-500/50 bg-amber-500/10 rounded-lg p-1.5 flex items-center justify-between text-[10px] font-mono text-amber-300">
                    <span>1. Head Zone (0-22%)</span>
                    <span className="text-rose-400 font-bold">head_nohelmet</span>
                  </div>

                  {/* Facial Subzone (12-35%) */}
                  <div className="h-[15%] border-2 border-purple-500/50 bg-purple-500/10 rounded-lg p-1.5 flex items-center justify-between text-[10px] font-mono text-purple-300">
                    <span>2. Facial & Eyes</span>
                    <span className="text-slate-400">Bypassed (Line 3)</span>
                  </div>

                  {/* Torso / Upper Body (20-65%) */}
                  <div className="h-[32%] border-2 border-emerald-500/50 bg-emerald-500/10 rounded-lg p-1.5 flex items-center justify-between text-[10px] font-mono text-emerald-300">
                    <span>3. Torso / Chest</span>
                    <span className="text-emerald-400 font-bold">vest (Compliant)</span>
                  </div>

                  {/* Hands / Extremities */}
                  <div className="h-[12%] border-2 border-rose-500/50 bg-rose-500/10 rounded-lg p-1.5 flex items-center justify-between text-[10px] font-mono text-rose-300">
                    <span>4. Hands (Pinch Hazard)</span>
                    <span className="text-rose-400 font-bold">hand_noglove</span>
                  </div>

                  {/* Feet Zone (75-100%) */}
                  <div className="h-[14%] border-2 border-cyan-500/50 bg-cyan-500/10 rounded-lg p-1.5 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                    <span>5. Feet (Steel-Toe)</span>
                    <span className="text-emerald-400 font-bold">boots (Compliant)</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 text-center">
                  Intersection-over-Person Formula: <code className="text-amber-400 font-bold">Area(Item ∩ Person) / Area(Item) &gt; 0.35</code>
                </div>
              </div>

              {/* Spatial Formulas & Explanation (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold font-mono text-amber-500 uppercase">
                    1. Explicit vs. Spatial Missing PPE Detection
                  </h4>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Standard object detectors only identify objects that are physically present in the frame. The <strong>Dynamic Violation Engine</strong> incorporates a dual-mode evaluation:
                  </p>
                  <ul className="list-disc pl-5 text-xs space-y-1.5 text-slate-400 font-mono">
                    <li>
                      <strong className="text-rose-400">Explicit Violations:</strong> Trained negative classes (<code className="text-slate-200">head_nohelmet</code>, <code className="text-slate-200">face_nomask</code>, <code className="text-slate-200">hand_noglove</code>, <code className="text-slate-200">shoes</code>) are detected directly by YOLOv9.
                    </li>
                    <li>
                      <strong className="text-amber-400">Spatial Containment Violations:</strong> When a worker anchor (<code className="text-slate-200">person</code>) is localized in a high-hazard zone, the engine checks for the absence of mandatory compliant classes (<code className="text-slate-200">vest</code>, <code className="text-slate-200">boots</code>) within that worker’s anatomical sub-regions.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="text-slate-400 font-bold">Mathematical Formulation:</div>
                  <pre className="text-emerald-400 text-[11px] overflow-x-auto">
{`# Intersection-over-Person (IoP)
IoP = (Area(bbox_ppe ∩ bbox_person)) / Area(bbox_ppe)

# Trigger Condition for Missing Vest:
if (Worker_In_Zone == True) and (not any(IoP(vest, torso_subzone) > 0.40)):
    emit_violation(rule="missing_vest", worker_id=track_id, conf=person_conf)`}
                  </pre>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 font-mono space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Dynamic Suppression Optimization:</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    If an EHS officer deselects "face_nomask" on Line 3 Welding, the engine immediately drops all facial violations during spatial association without needing to retrain or restart the TensorRT model.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL EVIDENCE COMMITS & /var/log/ppe_violations/ EXPLORER */}
      {activeTab === 'EVIDENCE_STORAGE' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-amber-500" />
                  <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Visual Evidence Committer File Explorer (/var/log/ppe_violations/)
                  </h3>
                </div>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Committed JPG snapshot frames and structured JSONL audit logs saved when violation confidence exceeds 0.55.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                  {evidenceLog.length} Evidence Records
                </span>
              </div>
            </div>

            {/* File Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">File Path / Snapshot</th>
                    <th className="p-3">Camera & Zone</th>
                    <th className="p-3">Violation Class</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Worker Track ID</th>
                    <th className="p-3">Size</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                  {evidenceLog.map((log) => (
                    <tr
                      key={log.violation_id}
                      className={theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2 font-bold text-amber-400">
                          <FileImage className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[240px]">{log.evidence_path.split('/').pop()}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[280px]">
                          {log.evidence_path}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200">{log.camera_id}</div>
                        <div className="text-[10px] text-slate-500">{log.zone_id}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                          {log.rule_class}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-emerald-400">
                        {(log.confidence * 100).toFixed(1)}%
                      </td>

                      <td className="p-3 font-bold text-blue-400">
                        {log.worker_id}
                      </td>

                      <td className="p-3 text-slate-400">
                        {(log.file_size_bytes / 1024).toFixed(0)} KB
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedLogRecord(log)}
                          className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
                        >
                          Inspect Evidence
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Log Stream (JSONL representation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>/var/log/ppe_violations/audit_events.jsonl (Real-Time Append Stream)</span>
                </span>
                <button
                  onClick={() => copyCodeToClipboard(JSON.stringify(evidenceLog, null, 2), 'audit_jsonl')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'audit_jsonl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy JSONL Stream</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto space-y-1.5">
                {evidenceLog.map((log) => (
                  <div key={log.violation_id} className="text-slate-400 hover:text-white transition-colors">
                    {JSON.stringify(log)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence Inspector Modal */}
          {selectedLogRecord && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-2xl border rounded-2xl overflow-hidden shadow-2xl ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">EVIDENCE RECORD: {selectedLogRecord.violation_id}</span>
                  </div>
                  <button
                    onClick={() => setSelectedLogRecord(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80"
                      alt="Violation Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute border-2 border-rose-500 bg-rose-500/30 rounded"
                      style={{ left: '38%', top: '20%', width: '14%', height: '16%' }}
                    >
                      <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1 rounded absolute -top-4 left-0">
                        {selectedLogRecord.rule_class} ({(selectedLogRecord.confidence * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Camera:</span>
                      <span className="font-bold text-amber-500">{selectedLogRecord.camera_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Worker Anchor:</span>
                      <span className="font-bold text-blue-400">{selectedLogRecord.worker_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Confidence:</span>
                      <span className="font-bold text-emerald-400">{(selectedLogRecord.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">File Size:</span>
                      <span className="font-bold text-slate-300">{(selectedLogRecord.file_size_bytes / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 break-all">
                    Disk Path: {selectedLogRecord.evidence_path}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedLogRecord(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-mono hover:bg-slate-700"
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRODUCTION PYTHON SOURCE CODE */}
      {activeTab === 'PYTHON_SOURCE' && (
        <div className="space-y-4">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Production Python Source Code
                </h3>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Senior Computer Vision implementation of TensorRT YOLOv9-e Wrapper and Dynamic Violation Engine.
                </p>
              </div>

              {/* Switch between the two Python files */}
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-xl border flex text-xs font-mono ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setActiveSourceTab('VIOLATION_ENGINE')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeSourceTab === 'VIOLATION_ENGINE'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    dynamic_violation_engine.py
                  </button>
                  <button
                    onClick={() => setActiveSourceTab('INFERENCE_SERVICE')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeSourceTab === 'INFERENCE_SERVICE'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    yolov9_tensorrt_inference.py
                  </button>
                </div>

                <button
                  onClick={() =>
                    copyCodeToClipboard(
                      activeSourceTab === 'VIOLATION_ENGINE' ? DYNAMIC_VIOLATION_ENGINE_PY : YOLOV9_TENSORRT_INFERENCE_PY,
                      activeSourceTab
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow"
                >
                  {copiedKey === activeSourceTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Python File</span>
                </button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px]">
              <pre>
                {activeSourceTab === 'VIOLATION_ENGINE' ? DYNAMIC_VIOLATION_ENGINE_PY : YOLOV9_TENSORRT_INFERENCE_PY}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
