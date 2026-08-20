import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  Zap, 
  Radio, 
  Volume2, 
  Smartphone, 
  FileCode,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  PYTHON_FASTAPI_STREAM_SERVICE, 
  PYTHON_INFERENCE_PIPELINE_HOT_RELOAD, 
  NODE_WS_DISPATCHER_TS, 
  NODE_GPIO_RELAY_MANAGER_TS, 
  NODE_MOBILE_PUSH_SERVICE_TS 
} from '../data/backendSourceCode';
import {
  YOLOV9_TENSORRT_INFERENCE_PY,
  DYNAMIC_VIOLATION_ENGINE_PY
} from '../data/yoloInferenceSourceCode';

export const BackendCodeStudio: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<
    'PYTHON_FASTAPI' | 'PYTHON_YOLOV9' | 'PYTHON_VIOLATION_ENGINE' | 'PYTHON_INFERENCE' | 'NODE_WS' | 'NODE_GPIO' | 'NODE_PUSH'
  >('PYTHON_VIOLATION_ENGINE');
  const [copied, setCopied] = useState(false);

  const codeFiles = {
    PYTHON_VIOLATION_ENGINE: {
      title: 'Dynamic Violation Engine & Spatial Matcher',
      fileName: 'engine/dynamic_violation_engine.py',
      language: 'Python 3.11 / OpenCV / Redis / /var/log',
      icon: Zap,
      badge: 'Spatial IoP & /var/log',
      content: DYNAMIC_VIOLATION_ENGINE_PY,
      description: 'Evaluates YOLOv9 detections against per-camera toggles, handles missing vest/boots spatial containment, and commits visual evidence to /var/log/ppe_violations/ when confidence > 0.55.',
    },
    PYTHON_YOLOV9: {
      title: 'YOLOv9-e TensorRT 10.x Inference Service',
      fileName: 'inference/yolov9_tensorrt_inference.py',
      language: 'Python 3.11 / TensorRT 10.x / PyCUDA / ONNX',
      icon: Server,
      badge: 'Sub-4ms Inference',
      content: YOLOV9_TENSORRT_INFERENCE_PY,
      description: 'Wraps fine-tuned YOLOv9-e across 10 anatomical PPE classes with FP16/INT8 TensorRT execution, letterbox pre-processing, and vector NMS.',
    },
    PYTHON_FASTAPI: {
      title: 'Python (FastAPI) RTSP & WebRTC Microservice',
      fileName: 'services/video_stream_service.py',
      language: 'Python 3.11 / FastAPI / aiortc / PyAV',
      icon: Server,
      badge: 'Video Ingest & WHEP',
      content: PYTHON_FASTAPI_STREAM_SERVICE,
      description: 'Handles live RTSP demuxing, NVENC hardware-accelerated transcoding, RFC 9621 WebRTC (WHEP) sub-150ms browser streaming, and LL-HLS fallback manifests.',
    },
    PYTHON_INFERENCE: {
      title: 'Zero-Downtime Hot-Reload Sync Pipeline',
      fileName: 'workers/inference_pipeline.py',
      language: 'Python 3.11 / TensorRT / Redis PubSub',
      icon: Zap,
      badge: 'Zero-Downtime Hot-Reload',
      content: PYTHON_INFERENCE_PIPELINE_HOT_RELOAD,
      description: 'Executes YOLOv9 TensorRT inference while continuously listening to Redis Pub/Sub channels to atomically apply per-camera rule changes in microseconds without stream teardown.',
    },
    NODE_WS: {
      title: 'Node.js / TypeScript WebSocket Alert Router',
      fileName: 'src/dispatch/ws_alert_dispatcher.ts',
      language: 'Node.js 20+ / TypeScript / ioredis',
      icon: Radio,
      badge: 'Async WebSocket Dispatch',
      content: NODE_WS_DISPATCHER_TS,
      description: 'Asynchronous multi-room WebSocket router with backpressure protection. Evaluates hot-cached Redis rule states and drops bypassed violation events automatically.',
    },
    NODE_GPIO: {
      title: 'Industrial Hardware GPIO & Speaker Annunciator',
      fileName: 'src/hardware/gpio_relay_manager.ts',
      language: 'Node.js / TypeScript / Modbus TCP',
      icon: Volume2,
      badge: 'Floor Horns & Strobes',
      content: NODE_GPIO_RELAY_MANAGER_TS,
      description: 'Hardware relay driver for industrial 24V siren coils, amber strobe beacons, and Line 3 floor speakers with pulse timing interlocks and debounce cooldowns.',
    },
    NODE_PUSH: {
      title: 'Mobile Push Notification Service (APNs & FCM v1)',
      fileName: 'src/notifications/mobile_push_service.ts',
      language: 'Node.js / TypeScript / HTTP/2 APNs',
      icon: Smartphone,
      badge: 'iOS & Android Push',
      content: NODE_MOBILE_PUSH_SERVICE_TS,
      description: 'Dispatches high-priority lockscreen notifications with violation snapshot attachments, worker track IDs, and deep links to safety officers.',
    },
  };

  const currentFile = codeFiles[activeCodeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Production Backend & Video Infrastructure Codebase
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                FastAPI + Node.js Microservices
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production-ready implementations for RTSP video demuxing, WebRTC/HLS streaming, Redis zero-downtime rule sync, WebSocket routing, APNs/FCM mobile push, and GPIO relay control.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Code Copied!' : `Copy ${currentFile.fileName}`}
          </button>
        </div>
      </div>

      {/* Code Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(codeFiles) as Array<keyof typeof codeFiles>).map((key) => {
          const file = codeFiles[key];
          const Icon = file.icon;
          const isSelected = activeCodeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveCodeTab(key)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-950 text-slate-400'
                }`}>
                  {file.badge}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate">{file.title}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{file.fileName}</div>
            </button>
          );
        })}
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              {currentFile.fileName}
            </span>
            <span className="text-xs font-mono text-slate-400">{currentFile.language}</span>
          </div>

          <div className="text-xs text-slate-400 max-w-lg truncate">
            {currentFile.description}
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-[600px] scrollbar-thin">
          <pre>{currentFile.content}</pre>
        </div>
      </div>
    </div>
  );
};
