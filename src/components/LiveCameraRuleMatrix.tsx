import React, { useState } from 'react';
import { 
  Camera, 
  Zap, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Sliders, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Cpu, 
  Layers, 
  HelpCircle,
  HardHat,
  Glasses,
  Footprints,
  Hand,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { CameraFeed, PPEClassRule } from '../types/schema';
import { PPE_CLASS_DEFINITIONS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

interface LiveCameraRuleMatrixProps {
  cameras: CameraFeed[];
  onUpdateCameraRules?: (cameraId: string, zoneId: string, rules: Record<string, { enabled: boolean; threshold: number; action: string }>) => void;
}

export const LiveCameraRuleMatrix: React.FC<LiveCameraRuleMatrixProps> = ({ cameras, onUpdateCameraRules }) => {
  const { theme } = useTheme();
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || 'cam-01-weld');
  const [viewMode, setViewMode] = useState<'SINGLE_CAMERA' | 'CROSS_CAMERA_MATRIX'>('SINGLE_CAMERA');

  // Per-camera rules state: { [cameraId]: { [ruleClass]: { enabled: boolean, threshold: number, action: string } } }
  const [cameraRuleState, setCameraRuleState] = useState<Record<string, Record<string, { enabled: boolean; threshold: number; action: string }>>>(() => {
    const initialState: Record<string, Record<string, { enabled: boolean; threshold: number; action: string }>> = {};
    
    cameras.forEach((cam) => {
      const activeZone = cam.zones[0];
      const rulesMap: Record<string, { enabled: boolean; threshold: number; action: string }> = {};
      
      PPE_CLASS_DEFINITIONS.forEach((def) => {
        const existing = activeZone?.monitoring_config.rules[def.class_name];
        rulesMap[def.class_name] = {
          enabled: existing ? existing.enabled : true,
          threshold: existing ? existing.confidence_threshold : def.min_confidence,
          action: existing ? existing.action : (def.type === 'VIOLATION' ? 'ALERT_EHS' : 'LOG'),
        };
      });

      // Special case preset for Line 3 welding as requested: bypass face_nomask
      if (cam.id === 'cam-01-weld') {
        rulesMap['face_nomask'] = { enabled: false, threshold: 0.86, action: 'ALERT_EHS' };
      }

      initialState[cam.id] = rulesMap;
    });

    return initialState;
  });

  const [hotReloadStatus, setHotReloadStatus] = useState<string>('Live In-Memory Synced (v5.2)');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const selectedCam = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  const currentRules = cameraRuleState[selectedCameraId] || {};

  // Group classes by anatomical categories for easy matrix visualization
  const ruleGroups = [
    {
      id: 'HEAD',
      name: 'Head Protection',
      icon: HardHat,
      description: 'Hard hats, safety helmets, and overhead impact detection',
      classes: ['head_helmet', 'head_nohelmet'],
    },
    {
      id: 'FACIAL',
      name: 'Facial & Respiratory',
      icon: Glasses,
      description: 'Ocular eye protection, visors, and aerosol particulate masks',
      classes: ['glasses', 'face_mask', 'face_nomask'],
    },
    {
      id: 'UPPER_BODY',
      name: 'Upper Body & Spatial Worker Anchor',
      icon: User,
      description: 'Reflective safety vests and worker ByteTrack localization',
      classes: ['vest', 'person'],
    },
    {
      id: 'EXTREMITIES_HANDS',
      name: 'Hand Safety',
      icon: Hand,
      description: 'Cut/thermal protective gloves and bare-hand pinch point hazard rules',
      classes: ['hand_glove', 'hand_noglove'],
    },
    {
      id: 'EXTREMITIES_FEET',
      name: 'Footwear & Steel-Toe',
      icon: Footprints,
      description: 'Reinforced industrial boots and street footwear restrictions',
      classes: ['boots', 'shoes'],
    },
  ];

  const handleToggleRule = (cameraId: string, className: string) => {
    setIsUpdating(true);
    const camRules = cameraRuleState[cameraId] || {};
    const currentRule = camRules[className] || { enabled: true, threshold: 0.85, action: 'LOG' };
    const nextState = !currentRule.enabled;

    const updatedCamRules = {
      ...camRules,
      [className]: {
        ...currentRule,
        enabled: nextState,
      },
    };

    const nextGlobalState = {
      ...cameraRuleState,
      [cameraId]: updatedCamRules,
    };

    setCameraRuleState(nextGlobalState);

    const nowStr = new Date().toLocaleTimeString();
    setTimeout(() => {
      setIsUpdating(false);
      setHotReloadStatus(`Zero-Downtime Rule Reloaded at ${nowStr} (12µs)`);
      if (onUpdateCameraRules && selectedCam.zones[0]) {
        onUpdateCameraRules(cameraId, selectedCam.zones[0].id, updatedCamRules);
      }
    }, 120);
  };

  const handleThresholdChange = (cameraId: string, className: string, newThreshold: number) => {
    const camRules = cameraRuleState[cameraId] || {};
    const currentRule = camRules[className] || { enabled: true, threshold: 0.85, action: 'LOG' };

    setCameraRuleState({
      ...cameraRuleState,
      [cameraId]: {
        ...camRules,
        [className]: {
          ...currentRule,
          threshold: newThreshold,
        },
      },
    });
  };

  const handleActionChange = (cameraId: string, className: string, newAction: string) => {
    const camRules = cameraRuleState[cameraId] || {};
    const currentRule = camRules[className] || { enabled: true, threshold: 0.85, action: 'LOG' };

    setCameraRuleState({
      ...cameraRuleState,
      [cameraId]: {
        ...camRules,
        [className]: {
          ...currentRule,
          action: newAction,
        },
      },
    });
  };

  // Quick Preset Handlers
  const applyPreset = (presetType: 'ALL_ENABLED' | 'STRICT_SAFETY' | 'WALKWAY_RELAXED') => {
    setIsUpdating(true);
    const updatedCamRules: Record<string, { enabled: boolean; threshold: number; action: string }> = {};

    PPE_CLASS_DEFINITIONS.forEach((def) => {
      if (presetType === 'ALL_ENABLED') {
        updatedCamRules[def.class_name] = {
          enabled: true,
          threshold: def.min_confidence,
          action: def.type === 'VIOLATION' ? 'CRITICAL_DISPATCH' : 'LOG',
        };
      } else if (presetType === 'STRICT_SAFETY') {
        updatedCamRules[def.class_name] = {
          enabled: true,
          threshold: 0.80,
          action: def.type === 'VIOLATION' ? 'CRITICAL_DISPATCH' : 'LOG',
        };
      } else if (presetType === 'WALKWAY_RELAXED') {
        const isMandatory = ['head_helmet', 'head_nohelmet', 'vest', 'person'].includes(def.class_name);
        updatedCamRules[def.class_name] = {
          enabled: isMandatory,
          threshold: 0.85,
          action: def.type === 'VIOLATION' ? 'ALERT_EHS' : 'LOG',
        };
      }
    });

    setCameraRuleState({
      ...cameraRuleState,
      [selectedCameraId]: updatedCamRules,
    });

    setTimeout(() => {
      setIsUpdating(false);
      setHotReloadStatus(`Preset [${presetType}] hot-reloaded to Edge`);
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Live Camera & Rule Selector Panel
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Zero-Downtime Hot-Reload
              </span>
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Instant toggle matrix to activate or deselect AI detection classes per camera feed without dropping RTSP video frames.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`p-1 rounded-xl border flex text-xs font-mono font-medium ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setViewMode('SINGLE_CAMERA')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'SINGLE_CAMERA'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Camera Matrix
              </button>
              <button
                onClick={() => setViewMode('CROSS_CAMERA_MATRIX')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'CROSS_CAMERA_MATRIX'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cross-Camera Comparison Grid
              </button>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
              <span className="truncate max-w-[200px]">{hotReloadStatus}</span>
            </div>
          </div>
        </div>

        {/* Camera Selector Tabs (For Single Camera View) */}
        {viewMode === 'SINGLE_CAMERA' && (
          <div className="mt-5 pt-4 border-t border-slate-800/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {cameras.map((cam) => {
                const isSelected = selectedCameraId === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCameraId(cam.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : theme === 'dark'
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{cam.camera_uid}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? 'bg-slate-950 text-amber-300'
                        : theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {cam.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bulk Presets */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                Quick Presets:
              </span>
              <button
                onClick={() => applyPreset('ALL_ENABLED')}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All On
              </button>
              <button
                onClick={() => applyPreset('STRICT_SAFETY')}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/60'
                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Strict High-Hazard
              </button>
              <button
                onClick={() => applyPreset('WALKWAY_RELAXED')}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-950/40 border-blue-800/60 text-blue-300 hover:bg-blue-900/60'
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Walkway Relaxed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE CAMERA RULE SELECTOR MATRIX */}
      {viewMode === 'SINGLE_CAMERA' && (
        <div className="space-y-6">
          {/* Active Camera Header Info */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  theme === 'dark' ? 'bg-slate-950 text-amber-400 border border-slate-800' : 'bg-slate-100 text-amber-600 border border-slate-200'
                }`}>
                  {selectedCam.camera_uid}
                </span>
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {selectedCam.name}
                </h3>
              </div>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Location: <strong className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{selectedCam.location_name}</strong> • Edge Node: <span className="font-mono">{selectedCam.edge_device_id}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                Zone: <strong>{selectedCam.zones[0]?.name || 'Default Zone'}</strong>
              </span>
              <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                {selectedCam.fps} FPS / {selectedCam.resolution}
              </span>
            </div>
          </div>

          {/* Interactive Rule Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ruleGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div
                  key={group.id}
                  className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${
                        theme === 'dark' ? 'bg-slate-950 text-amber-400 border border-slate-800' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        <GroupIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold tracking-wide uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {group.name}
                        </h4>
                        <p className={`text-[11px] mt-0.5 line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {group.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Classes inside this group */}
                  <div className="space-y-3">
                    {group.classes.map((className) => {
                      const def = PPE_CLASS_DEFINITIONS.find((d) => d.class_name === className);
                      if (!def) return null;

                      const rule = currentRules[className] || {
                        enabled: true,
                        threshold: def.min_confidence,
                        action: def.type === 'VIOLATION' ? 'ALERT_EHS' : 'LOG',
                      };

                      const isViolationType = def.type === 'VIOLATION';
                      const isCompliantType = def.type === 'COMPLIANT';

                      return (
                        <div
                          key={className}
                          className={`p-3.5 rounded-xl border transition-all ${
                            rule.enabled
                              ? theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 shadow-sm'
                                : 'bg-slate-50 border-slate-200 shadow-sm'
                              : theme === 'dark'
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                              : 'bg-slate-100/60 border-slate-200/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-mono font-bold ${
                                  rule.enabled
                                    ? theme === 'dark' ? 'text-white' : 'text-slate-900'
                                    : theme === 'dark' ? 'text-slate-400 line-through' : 'text-slate-500 line-through'
                                }`}>
                                  {def.class_name}
                                </span>

                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                  isViolationType
                                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                                    : isCompliantType
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                }`}>
                                  {isViolationType ? 'VIOLATION' : isCompliantType ? 'COMPLIANT' : 'DETECTION'}
                                </span>
                              </div>

                              <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {def.display_name}
                              </p>
                            </div>

                            {/* Instant Toggle Switch */}
                            <button
                              onClick={() => handleToggleRule(selectedCameraId, className)}
                              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                                rule.enabled
                                  ? isViolationType
                                    ? 'bg-rose-600'
                                    : 'bg-emerald-600'
                                  : theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'
                              }`}
                              title={`Toggle ${className}`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform shadow-md absolute top-1 ${
                                  rule.enabled ? 'translate-x-7' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Rule Fine-Tuning when Enabled */}
                          {rule.enabled && (
                            <div className="mt-3 pt-3 border-t border-slate-800/40 dark:border-slate-800/80 space-y-2 text-[11px] font-mono">
                              {/* Confidence Threshold Slider */}
                              <div className="flex items-center justify-between gap-2">
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                                  Confidence Min:
                                </span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0.50"
                                    max="0.98"
                                    step="0.02"
                                    value={rule.threshold}
                                    onChange={(e) =>
                                      handleThresholdChange(selectedCameraId, className, parseFloat(e.target.value))
                                    }
                                    className="w-20 accent-amber-500 cursor-pointer"
                                  />
                                  <span className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {(rule.threshold * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>

                              {/* Action Route Selector */}
                              <div className="flex items-center justify-between gap-2">
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                                  Dispatch Action:
                                </span>
                                <select
                                  value={rule.action}
                                  onChange={(e) => handleActionChange(selectedCameraId, className, e.target.value)}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                    theme === 'dark'
                                      ? 'bg-slate-900 text-slate-200 border-slate-700'
                                      : 'bg-white text-slate-800 border-slate-300'
                                  }`}
                                >
                                  <option value="LOG">LOG ONLY</option>
                                  <option value="ALERT_EHS">ALERT EHS (WS + APP)</option>
                                  <option value="TRIGGER_BEACON">BEACON STROBE</option>
                                  <option value="CRITICAL_DISPATCH">CRITICAL (SIREN + APNS)</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CROSS-CAMERA COMPARISON GRID */}
      {viewMode === 'CROSS_CAMERA_MATRIX' && (
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 bg-slate-950/80 dark:bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Full Facility Multi-Camera Rule Matrix
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any cell toggle to immediately synchronize the edge inference rule without tearing down streaming sessions.
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {cameras.length} Active Cameras
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-mono border-b ${
                theme === 'dark' ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <tr>
                  <th className="p-3.5 font-semibold">PPE Class Rule</th>
                  <th className="p-3.5 font-semibold">Type</th>
                  {cameras.map((cam) => (
                    <th key={cam.id} className="p-3.5 font-semibold text-center min-w-[130px]">
                      <div>{cam.camera_uid}</div>
                      <div className="text-[10px] font-normal text-slate-500 font-sans truncate">{cam.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                theme === 'dark' ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-800'
              }`}>
                {PPE_CLASS_DEFINITIONS.map((def) => {
                  const isViolation = def.type === 'VIOLATION';
                  return (
                    <tr
                      key={def.class_name}
                      className={theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100 dark:text-slate-100 text-slate-900">
                          {def.class_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">{def.display_name}</div>
                      </td>

                      <td className="p-3.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isViolation
                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        }`}>
                          {def.type}
                        </span>
                      </td>

                      {cameras.map((cam) => {
                        const rule = cameraRuleState[cam.id]?.[def.class_name] || { enabled: true, threshold: 0.85, action: 'LOG' };
                        return (
                          <td key={cam.id} className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleRule(cam.id, def.class_name)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all inline-flex items-center gap-1.5 ${
                                rule.enabled
                                  ? isViolation
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : theme === 'dark'
                                  ? 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                                  : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                rule.enabled
                                  ? isViolation ? 'bg-rose-400' : 'bg-emerald-400'
                                  : 'bg-slate-500'
                              }`} />
                              <span>{rule.enabled ? 'ACTIVE' : 'BYPASS'}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
