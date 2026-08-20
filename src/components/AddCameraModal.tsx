import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  Video, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Sliders, 
  HardHat, 
  Eye, 
  Zap, 
  Cpu, 
  Radio, 
  Sparkles,
  Server,
  AlertCircle
} from 'lucide-react';
import { CameraFeed, CameraZone, ZoneMonitoringConfig } from '../types/schema';
import { useTheme } from '../context/ThemeContext';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCamera: (newCamera: CameraFeed) => void;
}

const PRESET_STREAM_IMAGES = [
  {
    id: 'cnc',
    title: 'CNC Precision Lathe & Milling Cell',
    zoneType: 'HAZARDOUS_WORK' as const,
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    description: 'High-speed cutting spindles and metal debris zone requiring eye, hand, and footwear protection.',
  },
  {
    id: 'forklift',
    title: 'High-Bay Logistics & Forklift Aisle',
    zoneType: 'GENERAL_WALKWAY' as const,
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    description: 'Heavy vehicular traffic corridor requiring Class 2 Hi-Vis vests and composite toe footwear.',
  },
  {
    id: 'paint',
    title: 'Industrial Coating & Solvent Spray Booth',
    zoneType: 'CHEMICAL_HANDLING' as const,
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
    description: 'VOC chemical vapour perimeter requiring full-face organic respirators and nitrile PPE.',
  },
  {
    id: 'crane',
    title: 'Overhead Gantry Crane & Heavy Hoist Bay',
    zoneType: 'LOADING_DOCK' as const,
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    description: 'Suspended load drop hazard requiring ANSI Type II hard hats and high-impact toe guards.',
  },
  {
    id: 'electronics',
    title: 'Clean Assembly & ESD Soldering Bench',
    zoneType: 'GENERAL_WALKWAY' as const,
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    description: 'ESD-safe bench requiring anti-static wristwear, eye safety glasses, and ESD lab coats.',
  },
];

export const AddCameraModal: React.FC<AddCameraModalProps> = ({
  isOpen,
  onClose,
  onAddCamera,
}) => {
  const { theme } = useTheme();

  const [name, setName] = useState('Bay 5 - Heavy Automated CNC Cell');
  const [cameraUid, setCameraUid] = useState('CAM-CNC-BAY-05');
  const [locationName, setLocationName] = useState('Fabrication Hall B - North Wing');
  const [rtspUrl, setRtspUrl] = useState('rtsps://edge-nvr-05.austin.internal:8554/live/cnc-bay-05');
  const [edgeDevice, setEdgeDevice] = useState('NVIDIA-JETSON-AGX-04');
  const [fps, setFps] = useState<number>(25);
  const [resolution, setResolution] = useState('2560x1440');
  const [selectedPreset, setSelectedPreset] = useState(PRESET_STREAM_IMAGES[0]);
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [streamTested, setStreamTested] = useState<boolean | null>(null);

  // PPE Rules Quick Config
  const [requireHelmet, setRequireHelmet] = useState(true);
  const [requireGlasses, setRequireGlasses] = useState(true);
  const [requireMask, setRequireMask] = useState(false);
  const [requireVest, setRequireVest] = useState(true);
  const [requireGloves, setRequireGloves] = useState(true);
  const [requireBoots, setRequireBoots] = useState(true);

  if (!isOpen) return null;

  const handleTestStream = () => {
    setIsTestingStream(true);
    setStreamTested(null);
    setTimeout(() => {
      setIsTestingStream(false);
      setStreamTested(true);
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCamId = `cam-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const zoneId = `zone-${Date.now().toString(36)}`;

    const defaultMonitoringConfig: ZoneMonitoringConfig = {
      config_version: 1,
      updated_at: new Date().toISOString(),
      updated_by: 'EHS Platform Admin',
      is_active: true,
      schedule: {
        always_active: true,
        active_days: [0, 1, 2, 3, 4, 5, 6],
        start_time_utc: '00:00',
        end_time_utc: '23:59',
      },
      zones: {
        head: {
          enabled: true,
          require_helmet: requireHelmet,
          min_confidence: 0.85,
          grace_period_sec: 2.0,
          alert_severity: 'HIGH',
        },
        facial: {
          enabled: true,
          require_glasses: requireGlasses,
          require_mask: requireMask,
          min_confidence: 0.80,
          grace_period_sec: 3.0,
          alert_severity: 'MEDIUM',
        },
        upper_body: {
          enabled: true,
          require_vest: requireVest,
          track_person_occupancy: true,
          max_occupancy_limit: 8,
          min_confidence: 0.80,
          alert_severity: 'HIGH',
        },
        extremities: {
          enabled: true,
          require_gloves: requireGloves,
          require_safety_boots: requireBoots,
          min_confidence: 0.82,
          grace_period_sec: 2.5,
          alert_severity: 'HIGH',
        },
      },
      rules: {
        head_helmet: { enabled: requireHelmet, confidence_threshold: 0.85, action: 'LOG' },
        head_nohelmet: { enabled: requireHelmet, confidence_threshold: 0.85, action: 'ALERT_EHS' },
        glasses: { enabled: requireGlasses, confidence_threshold: 0.80, action: 'LOG' },
        face_mask: { enabled: requireMask, confidence_threshold: 0.80, action: 'LOG' },
        face_nomask: { enabled: requireMask, confidence_threshold: 0.80, action: 'ALERT_EHS' },
        vest: { enabled: requireVest, confidence_threshold: 0.82, action: 'LOG' },
        person: { enabled: true, confidence_threshold: 0.75, action: 'LOG' },
        hand_glove: { enabled: requireGloves, confidence_threshold: 0.80, action: 'LOG' },
        hand_noglove: { enabled: requireGloves, confidence_threshold: 0.84, action: 'ALERT_EHS' },
        boots: { enabled: requireBoots, confidence_threshold: 0.85, action: 'LOG' },
        shoes: { enabled: requireBoots, confidence_threshold: 0.88, action: 'ALERT_EHS' },
      },
      debounce: {
        sliding_window_ms: 1500,
        consecutive_frames_required: 4,
        deduplication_ttl_seconds: 30,
      },
      notification_channels: {
        email: true,
        sms: true,
        on_premise_gpio_siren: false,
      },
    };

    const newZone: CameraZone = {
      id: zoneId,
      tenant_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      facility_id: '8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
      camera_id: newCamId,
      zone_code: `ZONE-${selectedPreset.id.toUpperCase()}-01`,
      name: `${name} Active Zone`,
      zone_type: selectedPreset.zoneType,
      polygon_coordinates: [
        [15, 20],
        [85, 20],
        [90, 85],
        [10, 85],
      ],
      color: selectedPreset.zoneType === 'HAZARDOUS_WORK' ? '#EF4444' : selectedPreset.zoneType === 'CHEMICAL_HANDLING' ? '#F59E0B' : '#3B82F6',
      monitoring_config: defaultMonitoringConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newCamera: CameraFeed = {
      id: newCamId,
      tenant_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      facility_id: '8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
      camera_uid: cameraUid,
      name: name,
      location_name: locationName,
      rtsp_url_masked: rtspUrl,
      edge_device_id: edgeDevice,
      status: 'ONLINE',
      fps: fps,
      resolution: resolution,
      zones: [newZone],
    };

    onAddCamera(newCamera);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl border transition-colors my-8 overflow-hidden ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Register New RTSP / WebRTC Camera Feed</h2>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Connect an on-premise industrial camera stream to the YOLOv9 Edge TensorRT pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Preset Visual Feed Templates */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              1. Select Facility Zone & Visual Stream Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PRESET_STREAM_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setName(preset.title);
                    setCameraUid(`CAM-${preset.id.toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`);
                    setRtspUrl(`rtsps://edge-nvr-0${Math.floor(1 + Math.random() * 8)}.austin.internal:8554/live/${preset.id}-feed`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    selectedPreset.id === preset.id
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 relative bg-slate-900">
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-amber-300 font-semibold">
                        {preset.zoneType}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold truncate">{preset.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Camera Identification & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Camera Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border font-medium outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="e.g. Bay 5 - Automated CNC Cell"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Camera Unique Identifier (UID)
              </label>
              <input
                type="text"
                required
                value={cameraUid}
                onChange={(e) => setCameraUid(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-amber-600'
                }`}
                placeholder="CAM-CNC-BAY-05"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Physical Location / Facility Bay
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border font-medium outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="e.g. Fabrication Hall B - North Wing"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Assigned Edge Inference Node
              </label>
              <select
                value={edgeDevice}
                onChange={(e) => setEdgeDevice(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="NVIDIA-JETSON-AGX-01">NVIDIA-JETSON-AGX-01 (TensorRT 8.6, 64GB)</option>
                <option value="NVIDIA-JETSON-AGX-04">NVIDIA-JETSON-AGX-04 (TensorRT 8.6, 64GB)</option>
                <option value="EDGE-ORIN-NANO-02">EDGE-ORIN-NANO-02 (Orin Nano, 8GB)</option>
                <option value="INTEL-XEON-GPU-02">INTEL-XEON-GPU-02 (PCIe RTX 4090 Dedicated)</option>
              </select>
            </div>
          </div>

          {/* RTSP Stream & Connection Test */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                2. RTSP / WebRTC Stream Ingestion
              </label>
              <button
                type="button"
                onClick={handleTestStream}
                disabled={isTestingStream}
                className="px-3 py-1 text-xs rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                {isTestingStream ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Pinging Edge NVR...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" />
                    <span>Test Ingestion Ping</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-slate-700 text-indigo-300' : 'bg-white border-slate-300 text-indigo-700'
              }`}
              placeholder="rtsps://edge-nvr.internal:8554/live/feed-01"
            />

            {streamTested === true && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Edge WebRTC Stream Active: <strong>H.264 High Profile @ 25 FPS</strong> (RTT: 14ms)</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">WHEP OK</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Stream FPS</span>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className={`w-full mt-1 p-2 rounded-lg border font-mono ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value={15}>15 FPS (Eco Ingest)</option>
                  <option value={25}>25 FPS (Standard Edge)</option>
                  <option value={30}>30 FPS (High Precision)</option>
                  <option value={60}>60 FPS (Ultra-Speed Robotics)</option>
                </select>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Native Resolution</span>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className={`w-full mt-1 p-2 rounded-lg border font-mono ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="1920x1080">1920x1080 (1080p FHD)</option>
                  <option value="2560x1440">2560x1440 (1440p 2K)</option>
                  <option value="3840x2160">3840x2160 (4K UHD)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[11px]">Dynamic Violation Engine</span>
                <div className="mt-1 p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>IoP Spatial Containment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enforced PPE Rules Toggles */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              3. Enforced PPE Classes for this Camera Zone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'Hard Hat (Head)', state: requireHelmet, setter: setRequireHelmet, zone: 'HEAD' },
                { label: 'Safety Glasses (Eyes)', state: requireGlasses, setter: setRequireGlasses, zone: 'FACIAL' },
                { label: 'Face Mask / Respirator', state: requireMask, setter: setRequireMask, zone: 'FACIAL' },
                { label: 'Hi-Vis Safety Vest', state: requireVest, setter: setRequireVest, zone: 'UPPER_BODY' },
                { label: 'Cut/Chemical Gloves', state: requireGloves, setter: setRequireGloves, zone: 'EXTREMITIES' },
                { label: 'Steel-Toe Boots', state: requireBoots, setter: setRequireBoots, zone: 'EXTREMITIES' },
              ].map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => item.setter(!item.state)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                    item.state
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-slate-950/40 text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.zone}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                    item.state ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-800 text-transparent'
                  }`}>
                    ✓
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className={`pt-4 border-t flex items-center justify-between gap-3 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-xs transition-colors ${
                theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Deploy & Activate Camera Feed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
