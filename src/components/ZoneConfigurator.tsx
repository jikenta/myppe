import React, { useState } from 'react';
import { 
  HardHat, 
  Glasses, 
  Shirt, 
  Footprints, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Copy, 
  Check, 
  Clock, 
  Sliders, 
  BellRing, 
  ShieldAlert, 
  Eye, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { CameraFeed, CameraZone, ZoneMonitoringConfig, PPEClass } from '../types/schema';
import { PPE_CLASS_DEFINITIONS } from '../data/mockData';

interface ZoneConfiguratorProps {
  cameras: CameraFeed[];
  onSaveConfig: (cameraId: string, zoneId: string, newConfig: ZoneMonitoringConfig) => void;
}

export const ZoneConfigurator: React.FC<ZoneConfiguratorProps> = ({
  cameras,
  onSaveConfig,
}) => {
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || '');
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  
  const [selectedZoneId, setSelectedZoneId] = useState<string>(selectedCamera?.zones[0]?.id || '');
  const currentZone = selectedCamera?.zones.find((z) => z.id === selectedZoneId) || selectedCamera?.zones[0];

  // Local editable state for current zone monitoring config
  const [config, setConfig] = useState<ZoneMonitoringConfig>(
    JSON.parse(JSON.stringify(currentZone.monitoring_config))
  );

  const [activeAnatomicalTab, setActiveAnatomicalTab] = useState<'HEAD' | 'FACIAL' | 'UPPER_BODY' | 'EXTREMITIES'>('HEAD');
  const [copiedJson, setCopiedJson] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // When camera or zone changes, update local config
  const handleSelectCamera = (camId: string) => {
    setSelectedCameraId(camId);
    const cam = cameras.find((c) => c.id === camId);
    if (cam && cam.zones.length > 0) {
      setSelectedZoneId(cam.zones[0].id);
      setConfig(JSON.parse(JSON.stringify(cam.zones[0].monitoring_config)));
    }
  };

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const zone = selectedCamera.zones.find((z) => z.id === zoneId);
    if (zone) {
      setConfig(JSON.parse(JSON.stringify(zone.monitoring_config)));
    }
  };

  // Toggles for Class Rules
  const handleToggleClass = (className: PPEClass) => {
    setConfig((prev) => {
      const next = { ...prev };
      const currentRule = next.rules[className];
      next.rules[className] = {
        ...currentRule,
        enabled: !currentRule.enabled,
      };

      // Also sync top-level zone helper booleans
      if (className === 'head_helmet' || className === 'head_nohelmet') {
        next.zones.head.require_helmet = next.rules.head_helmet.enabled;
        next.zones.head.enabled = next.rules.head_helmet.enabled || next.rules.head_nohelmet.enabled;
      } else if (className === 'glasses') {
        next.zones.facial.require_glasses = next.rules.glasses.enabled;
        next.zones.facial.enabled = next.rules.glasses.enabled || next.rules.face_mask.enabled || next.rules.face_nomask.enabled;
      } else if (className === 'face_mask' || className === 'face_nomask') {
        next.zones.facial.require_mask = next.rules.face_mask.enabled;
        next.zones.facial.enabled = next.rules.glasses.enabled || next.rules.face_mask.enabled || next.rules.face_nomask.enabled;
      } else if (className === 'vest') {
        next.zones.upper_body.require_vest = next.rules.vest.enabled;
      } else if (className === 'person') {
        next.zones.upper_body.track_person_occupancy = next.rules.person.enabled;
      } else if (className === 'hand_glove' || className === 'hand_noglove') {
        next.zones.extremities.require_gloves = next.rules.hand_glove.enabled;
        next.zones.extremities.enabled = next.rules.hand_glove.enabled || next.rules.hand_noglove.enabled || next.rules.boots.enabled || next.rules.shoes.enabled;
      } else if (className === 'boots' || className === 'shoes') {
        next.zones.extremities.require_safety_boots = next.rules.boots.enabled;
        next.zones.extremities.enabled = next.rules.hand_glove.enabled || next.rules.hand_noglove.enabled || next.rules.boots.enabled || next.rules.shoes.enabled;
      }

      return next;
    });
  };

  const handleConfidenceChange = (className: PPEClass, val: number) => {
    setConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [className]: {
          ...prev.rules[className],
          confidence_threshold: val,
        },
      },
    }));
  };

  const handleActionChange = (className: PPEClass, action: 'LOG' | 'ALERT_EHS' | 'TRIGGER_BEACON' | 'CRITICAL_DISPATCH') => {
    setConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [className]: {
          ...prev.rules[className],
          action,
        },
      },
    }));
  };

  const handleSave = () => {
    const updated = {
      ...config,
      config_version: config.config_version + 1,
      updated_at: new Date().toISOString(),
      updated_by: 'EHS Officer: Current Session',
    };
    setConfig(updated);
    onSaveConfig(selectedCamera.id, currentZone.id, updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Quick Preset Handlers
  const applyPreset = (presetType: 'MAX_PROTECTION' | 'STANDARD_WALKWAY' | 'CHEMICAL_CLEANROOM') => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ZoneMonitoringConfig;
      if (presetType === 'MAX_PROTECTION') {
        // All PPE required with high thresholds
        Object.keys(next.rules).forEach((k) => {
          const key = k as PPEClass;
          next.rules[key].enabled = true;
          next.rules[key].confidence_threshold = 0.88;
        });
        next.zones.head.enabled = true;
        next.zones.facial.enabled = true;
        next.zones.upper_body.enabled = true;
        next.zones.extremities.enabled = true;
        next.debounce.sliding_window_ms = 2000;
        next.debounce.consecutive_frames_required = 3;
      } else if (presetType === 'STANDARD_WALKWAY') {
        // Only helmet, vest, and boots required
        next.rules.head_helmet.enabled = true;
        next.rules.head_nohelmet.enabled = true;
        next.rules.glasses.enabled = false;
        next.rules.face_mask.enabled = false;
        next.rules.face_nomask.enabled = false;
        next.rules.vest.enabled = true;
        next.rules.person.enabled = true;
        next.rules.hand_glove.enabled = false;
        next.rules.hand_noglove.enabled = false;
        next.rules.boots.enabled = true;
        next.rules.shoes.enabled = true;
        next.zones.head.enabled = true;
        next.zones.facial.enabled = false;
        next.zones.upper_body.enabled = true;
        next.zones.extremities.enabled = true;
      } else if (presetType === 'CHEMICAL_CLEANROOM') {
        // High facial, mask, gloves, boots
        next.rules.head_helmet.enabled = true;
        next.rules.head_nohelmet.enabled = true;
        next.rules.glasses.enabled = true;
        next.rules.face_mask.enabled = true;
        next.rules.face_nomask.enabled = true;
        next.rules.vest.enabled = true;
        next.rules.person.enabled = true;
        next.rules.hand_glove.enabled = true;
        next.rules.hand_noglove.enabled = true;
        next.rules.boots.enabled = true;
        next.rules.shoes.enabled = true;
        next.zones.facial.alert_severity = 'CRITICAL';
        next.zones.extremities.alert_severity = 'CRITICAL';
      }
      return next;
    });
  };

  const anatomicalZonesList = [
    { id: 'HEAD', name: 'Head Zone', icon: HardHat, count: '2 Classes (head_helmet, head_nohelmet)', color: 'amber' },
    { id: 'FACIAL', name: 'Facial Zone', icon: Glasses, count: '3 Classes (glasses, face_mask, face_nomask)', color: 'blue' },
    { id: 'UPPER_BODY', name: 'Upper Body Zone', icon: Shirt, count: '2 Classes (vest, person)', color: 'emerald' },
    { id: 'EXTREMITIES', name: 'Extremities Zone', icon: Footprints, count: '4 Classes (hand_glove, hand_noglove, boots, shoes)', color: 'purple' },
  ] as const;

  const currentZoneRules = PPE_CLASS_DEFINITIONS.filter(
    (def) => def.zone === activeAnatomicalTab
  );

  return (
    <div className="space-y-6">
      {/* Top Header / Scope Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dynamic Zone PPE Monitoring Rule Orchestrator
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                JSONB Schema Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Configure fine-grained PPE compliance requirements across the 4 anatomical zones for each camera feed. Changes write immediately to PostgreSQL <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded font-mono">active_monitoring_configs</code> and warm Redis hot-cache for sub-millisecond edge evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => applyPreset('MAX_PROTECTION')}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Heavy Hazard Preset
            </button>
            <button
              onClick={() => applyPreset('CHEMICAL_CLEANROOM')}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Chemical Preset
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Config Deployed!' : 'Save & Sync Edge'}
            </button>
          </div>
        </div>

        {/* Camera and Zone Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Select Camera Feed:
            </label>
            <select
              value={selectedCameraId}
              onChange={(e) => handleSelectCamera(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.camera_uid} - {cam.name} ({cam.zones.length} Zones)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Select Monitored Polygonal Zone:
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => handleSelectZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {selectedCamera.zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.zone_code} - {zone.name} ({zone.zone_type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Zone Map & Anatomical Zone Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Visual Camera Feed & Zone Overlay Canvas Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono font-medium text-slate-300">
                  {selectedCamera.camera_uid} RTSP FEED • {selectedCamera.resolution} @ {selectedCamera.fps} FPS
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Edge Device: {selectedCamera.edge_device_id}
              </span>
            </div>

            {/* Simulated Stream Viewport */}
            <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Background Factory Atmosphere */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90"></div>
              
              {/* Grid Lines representing spatial camera matrix */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:24px_24px]"></div>

              {/* Monitored Polygonal Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={currentZone.polygon_coordinates.map((pt) => `${pt[0]}%,${pt[1]}%`).join(' ')}
                  fill={currentZone.color}
                  fillOpacity="0.15"
                  stroke={currentZone.color}
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
              </svg>

              {/* Simulated Detected Worker in Zone */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/4 w-32 h-64 border-2 border-amber-400 bg-amber-500/10 rounded flex flex-col items-center justify-between p-1.5 backdrop-blur-[1px]">
                <div className="w-full flex items-center justify-between text-[10px] font-mono bg-amber-500 text-slate-950 font-bold px-1 rounded-sm">
                  <span>TRACK_P042</span>
                  <span>0.94</span>
                </div>

                {/* Anatomical Overlays with Status Badges */}
                <div className="w-full space-y-1 text-[9px] font-mono">
                  {/* Head Tag */}
                  <div className={`p-1 rounded flex items-center justify-between ${
                    config.rules.head_helmet.enabled
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  }`}>
                    <span>HEAD</span>
                    <span>{config.rules.head_helmet.enabled ? 'HELMET_OK' : 'NO_HELMET_VIOL'}</span>
                  </div>

                  {/* Face Tag */}
                  <div className={`p-1 rounded flex items-center justify-between ${
                    config.rules.glasses.enabled || config.rules.face_mask.enabled
                      ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                      : 'bg-slate-900/80 text-slate-400'
                  }`}>
                    <span>FACE</span>
                    <span>{config.rules.glasses.enabled ? 'GLASSES_ON' : 'UNGUARDED'}</span>
                  </div>

                  {/* Upper Body */}
                  <div className={`p-1 rounded flex items-center justify-between ${
                    config.rules.vest.enabled
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  }`}>
                    <span>TORSO</span>
                    <span>{config.rules.vest.enabled ? 'HI_VIS_VEST' : 'NO_VEST'}</span>
                  </div>

                  {/* Extremities */}
                  <div className={`p-1 rounded flex items-center justify-between ${
                    config.rules.hand_glove.enabled && config.rules.boots.enabled
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  }`}>
                    <span>EXTR</span>
                    <span>{config.rules.boots.enabled ? 'BOOTS+GLOVES' : 'SHOES_DETECTED'}</span>
                  </div>
                </div>

                <span className="text-[10px] text-amber-300 font-mono">PERSON SPATIAL ANCHOR</span>
              </div>

              {/* Zone Legend */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: currentZone.color }}></span>
                  <strong className="text-white">{currentZone.name}</strong>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Type: <span className="text-amber-400">{currentZone.zone_type}</span> • Polygon Vertices: {currentZone.polygon_coordinates.length}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Anatomical Zone Selector Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Four Primary Anatomical Monitoring Zones
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {anatomicalZonesList.map((z) => {
                const Icon = z.icon;
                const isSelected = activeAnatomicalTab === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => setActiveAnatomicalTab(z.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-700'}`} />
                    </div>
                    <div className="text-xs font-bold text-slate-200">{z.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{z.count}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Anatomical Zone Detailed Class Rules & Toggles */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">
                  Active Monitoring Classes for {activeAnatomicalTab.replace('_', ' ')}:
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentZoneRules.filter((r) => config.rules[r.class_name]?.enabled).length} of {currentZoneRules.length} Active
                </span>
              </div>

              {currentZoneRules.map((rule) => {
                const isEnabled = config.rules[rule.class_name]?.enabled ?? false;
                const confThreshold = config.rules[rule.class_name]?.confidence_threshold ?? 0.85;
                const action = config.rules[rule.class_name]?.action ?? 'LOG';

                return (
                  <div
                    key={rule.class_name}
                    className={`p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-slate-950/80 border-slate-700/80 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleClass(rule.class_name)}
                            id={`toggle-${rule.class_name}`}
                            className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                          />
                          <label
                            htmlFor={`toggle-${rule.class_name}`}
                            className="text-xs font-bold text-white cursor-pointer font-mono"
                          >
                            {rule.class_name}
                          </label>

                          {rule.type === 'COMPLIANT' && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              COMPLIANT
                            </span>
                          )}
                          {rule.type === 'VIOLATION' && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              VIOLATION CLASS
                            </span>
                          )}
                          {rule.type === 'DETECTION' && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              SPATIAL ANCHOR
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 pl-6">{rule.description}</p>
                      </div>

                      {/* Confidence Slider & Action Route */}
                      {isEnabled && (
                        <div className="flex items-center gap-4 pl-6 sm:pl-0">
                          {/* Confidence Slider */}
                          <div className="w-36">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                              <span>Min Conf:</span>
                              <span className="text-amber-400 font-bold">{Math.round(confThreshold * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.50"
                              max="0.99"
                              step="0.01"
                              value={confThreshold}
                              onChange={(e) => handleConfidenceChange(rule.class_name, parseFloat(e.target.value))}
                              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
                            />
                          </div>

                          {/* Action Selector */}
                          <div>
                            <span className="block text-[10px] font-mono text-slate-400 mb-1">Action:</span>
                            <select
                              value={action}
                              onChange={(e) =>
                                handleActionChange(
                                  rule.class_name,
                                  e.target.value as 'LOG' | 'ALERT_EHS' | 'TRIGGER_BEACON' | 'CRITICAL_DISPATCH'
                                )
                              }
                              className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-500"
                            >
                              <option value="LOG">LOG ONLY</option>
                              <option value="ALERT_EHS">ALERT EHS</option>
                              <option value="TRIGGER_BEACON">TRIGGER BEACON</option>
                              <option value="CRITICAL_DISPATCH">CRITICAL DISPATCH</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Operational Rules, Debouncing & Live JSONB Sync (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Debounce & Operational Guardrails */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-slate-800 pb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Inference Debouncing & False Positive Filter</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-mono text-[11px] mb-1">
                  <span>Sliding Window Debounce:</span>
                  <span className="text-amber-400 font-bold">{config.debounce.sliding_window_ms} ms</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={config.debounce.sliding_window_ms}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      debounce: {
                        ...prev.debounce,
                        sliding_window_ms: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Duration an uncompliant worker must remain tracked before firing an alert.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-mono text-[11px] mb-1">
                  <span>Consecutive Inference Frames:</span>
                  <span className="text-amber-400 font-bold">{config.debounce.consecutive_frames_required} frames</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={config.debounce.consecutive_frames_required}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      debounce: {
                        ...prev.debounce,
                        consecutive_frames_required: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-mono text-[11px] mb-1">
                  <span>Deduplication Lock TTL:</span>
                  <span className="text-amber-400 font-bold">{config.debounce.deduplication_ttl_seconds} seconds</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={config.debounce.deduplication_ttl_seconds}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      debounce: {
                        ...prev.debounce,
                        deduplication_ttl_seconds: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
                />
              </div>
            </div>

            {/* Notification Channels */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Automated Dispatch Channels:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notification_channels.email}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        notification_channels: { ...prev.notification_channels, email: e.target.checked },
                      }))
                    }
                    className="rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>EHS Officer Email</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notification_channels.sms}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        notification_channels: { ...prev.notification_channels, sms: e.target.checked },
                      }))
                    }
                    className="rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>SMS Emergency</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={config.notification_channels.on_premise_gpio_siren}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        notification_channels: {
                          ...prev.notification_channels,
                          on_premise_gpio_siren: e.target.checked,
                        },
                      }))
                    }
                    className="rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>On-Premise Floor Strobe / Siren (GPIO Relay)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Real-Time Synchronized JSONB Rule Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  active_monitoring_configs.rule_config (JSONB)
                </span>
              </div>
              <button
                onClick={copyJson}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[380px] scrollbar-thin">
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>

            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>PostgreSQL CHECK Constraint: <strong className="text-emerald-400">PASSED</strong></span>
              <span>Version: <strong className="text-amber-400 font-mono">v{config.config_version}</strong></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
