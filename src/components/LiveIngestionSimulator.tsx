import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Database, 
  Zap, 
  Eye, 
  Check, 
  MessageSquare,
  Sparkles,
  Camera
} from 'lucide-react';
import { CameraFeed, ViolationEvent, PPEClass } from '../types/schema';
import { RECENT_VIOLATION_EVENTS } from '../data/mockData';

interface LiveIngestionSimulatorProps {
  cameras: CameraFeed[];
  onViolationAcknowledged?: (violationId: string, notes: string) => void;
}

interface SimulatedWorker {
  id: string;
  name: string;
  x: number; // percentage
  y: number;
  direction: number;
  speed: number;
  ppe: {
    head_helmet: boolean;
    glasses: boolean;
    face_mask: boolean;
    vest: boolean;
    hand_glove: boolean;
    boots: boolean; // false = street shoes
  };
  currentViolation?: {
    type: string;
    zone: string;
    class: PPEClass;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
  };
}

export const LiveIngestionSimulator: React.FC<LiveIngestionSimulatorProps> = ({
  cameras,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || '');
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  const activeZone = selectedCamera?.zones[0];

  const [violations, setViolations] = useState<ViolationEvent[]>(RECENT_VIOLATION_EVENTS);
  const [ackModalViolation, setAckModalViolation] = useState<ViolationEvent | null>(null);
  const [ackNotes, setAckNotes] = useState('');
  
  // Real-time Redis Streams log simulation
  const [streamLogs, setStreamLogs] = useState<Array<{ id: string; time: string; payload: string }>>([
    {
      id: '1724141174000-0',
      time: '08:06:14.012',
      payload: 'XADD ehs:stream:camera:cam-01-weld:detections * track_id=TRACK_P042 head=head_nohelmet conf=0.948',
    },
    {
      id: '1724141175000-0',
      time: '08:06:15.110',
      payload: 'XADD ehs:stream:camera:cam-01-weld:detections * track_id=TRACK_P042 extremities=hand_noglove conf=0.912',
    },
  ]);

  // Dynamic Simulated Workers
  const [workers, setWorkers] = useState<SimulatedWorker[]>([
    {
      id: 'TRACK_P042',
      name: 'Worker 42 (Welder)',
      x: 35,
      y: 40,
      direction: 1,
      speed: 0.2,
      ppe: {
        head_helmet: false, // NO HELMET VIOLATION
        glasses: true,
        face_mask: false,
        vest: true,
        hand_glove: false, // NO GLOVES VIOLATION
        boots: true,
      },
    },
    {
      id: 'TRACK_P019',
      name: 'Worker 19 (Technician)',
      x: 65,
      y: 50,
      direction: -1,
      speed: 0.15,
      ppe: {
        head_helmet: true,
        glasses: true,
        face_mask: true,
        vest: true,
        hand_glove: true,
        boots: true,
      },
    },
    {
      id: 'TRACK_P088',
      name: 'Worker 88 (Contractor)',
      x: 20,
      y: 65,
      direction: 1,
      speed: 0.1,
      ppe: {
        head_helmet: true,
        glasses: false,
        face_mask: false,
        vest: false, // NO VEST VIOLATION
        hand_glove: true,
        boots: false, // STREET SHOES VIOLATION
      },
    },
  ]);

  // Worker PPE Toggles for Interactive Testing
  const toggleWorkerPPE = (workerId: string, item: keyof SimulatedWorker['ppe']) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          const updatedPPE = { ...w.ppe, [item]: !w.ppe[item] };
          return { ...w, ppe: updatedPPE };
        }
        return w;
      })
    );
  };

  // Simulation Animation Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setWorkers((prevWorkers) => {
        return prevWorkers.map((worker) => {
          let newX = worker.x + worker.direction * worker.speed;
          let newDir = worker.direction;

          if (newX > 75) {
            newX = 75;
            newDir = -1;
          } else if (newX < 20) {
            newX = 20;
            newDir = 1;
          }

          // Evaluate active zone rules against worker PPE
          let activeViolation: SimulatedWorker['currentViolation'] | undefined = undefined;

          if (activeZone?.monitoring_config?.rules) {
            const rules = activeZone.monitoring_config.rules;

            if (rules.head_nohelmet?.enabled && !worker.ppe.head_helmet) {
              activeViolation = {
                type: 'CRITICAL_PPE_MISSING_HELMET',
                zone: 'HEAD',
                class: 'head_nohelmet',
                severity: 'CRITICAL',
                confidence: 0.94 + Math.random() * 0.05,
              };
            } else if (rules.hand_noglove?.enabled && !worker.ppe.hand_glove) {
              activeViolation = {
                type: 'MISSING_MANDATORY_GLOVES',
                zone: 'EXTREMITIES',
                class: 'hand_noglove',
                severity: 'HIGH',
                confidence: 0.91 + Math.random() * 0.04,
              };
            } else if (rules.vest?.enabled && !worker.ppe.vest) {
              activeViolation = {
                type: 'MISSING_HIGH_VIS_VEST',
                zone: 'UPPER_BODY',
                class: 'vest',
                severity: 'HIGH',
                confidence: 0.89 + Math.random() * 0.05,
              };
            } else if (rules.shoes?.enabled && !worker.ppe.boots) {
              activeViolation = {
                type: 'UNAPPROVED_FOOTWEAR_STREET_SHOES',
                zone: 'EXTREMITIES',
                class: 'shoes',
                severity: 'HIGH',
                confidence: 0.88 + Math.random() * 0.06,
              };
            }
          }

          return {
            ...worker,
            x: newX,
            direction: newDir,
            currentViolation: activeViolation,
          };
        });
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, activeZone]);

  // Periodic Random Violation Emitter to simulate live high-frequency ingestion
  useEffect(() => {
    if (!isRunning) return;

    const streamInterval = setInterval(() => {
      const violatingWorker = workers.find((w) => w.currentViolation);
      if (violatingWorker && violatingWorker.currentViolation) {
        const v = violatingWorker.currentViolation;
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
        const redisEntryId = `${Date.now()}-${Math.floor(Math.random() * 100)}`;

        // Append to stream log
        setStreamLogs((prev) => [
          {
            id: redisEntryId,
            time: timeStr,
            payload: `XADD ehs:stream:camera:${selectedCamera.id}:detections * track_id=${violatingWorker.id} zone=${v.zone} class=${v.class} conf=${v.confidence.toFixed(4)}`,
          },
          ...prev.slice(0, 19),
        ]);

        // Occasionally append to PostgreSQL table if high confidence
        if (Math.random() > 0.6) {
          const newViolationRecord: ViolationEvent = {
            id: `viol-${Date.now()}`,
            tenant_id: selectedCamera.tenant_id,
            facility_id: selectedCamera.facility_id,
            camera_id: selectedCamera.id,
            zone_id: activeZone.id,
            person_track_id: violatingWorker.id,
            anatomical_zone: v.zone as any,
            detected_class: v.class,
            violation_type: v.type,
            confidence_score: v.confidence,
            severity: v.severity,
            bounding_box: { x: violatingWorker.x, y: violatingWorker.y, width: 14, height: 28 },
            snapshot_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
            detected_at: now.toISOString(),
            acknowledged: false,
          };

          setViolations((prev) => [newViolationRecord, ...prev.slice(0, 49)]);
        }
      }
    }, 2500);

    return () => clearInterval(streamInterval);
  }, [isRunning, workers, selectedCamera, activeZone]);

  const handleAcknowledge = () => {
    if (!ackModalViolation) return;
    setViolations((prev) =>
      prev.map((v) => {
        if (v.id === ackModalViolation.id) {
          return {
            ...v,
            acknowledged: true,
            acknowledged_by: 'EHS Officer: Current Session',
            acknowledged_at: new Date().toISOString(),
          };
        }
        return v;
      })
    );
    setAckModalViolation(null);
    setAckNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-Time Telemetry Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Edge AI Detection & Ingestion Testbench
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Activity className="w-3 h-3 animate-pulse" />
                Pipeline Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulate edge RTSP decoding, YOLOv11 4-anatomical zone bounding boxes, Redis Stream batching, and PostgreSQL monthly partition table insertion in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                isRunning
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause Stream' : 'Resume Stream'}
            </button>
          </div>
        </div>

        {/* Latency Pipeline Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">RTSP Frame Ingest</span>
            <span className="text-sm font-mono font-bold text-slate-200 mt-0.5 block">14.2 ms</span>
            <span className="text-[10px] text-slate-400">H.265 / GStreamer</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">YOLOv11 TensorRT</span>
            <span className="text-sm font-mono font-bold text-amber-400 mt-0.5 block">18.6 ms</span>
            <span className="text-[10px] text-slate-400">FP16 Jetson AGX</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Redis Stream Ingest</span>
            <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">1.8 ms</span>
            <span className="text-[10px] text-slate-400">XADD Pipeline</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Rule Engine & Debounce</span>
            <span className="text-sm font-mono font-bold text-blue-400 mt-0.5 block">3.4 ms</span>
            <span className="text-[10px] text-slate-400">Go Worker Hot-Cache</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total E2E Latency</span>
            <span className="text-sm font-mono font-bold text-emerald-300 mt-0.5 block">38.0 ms</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Sub-Second SLA Met</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Feed Simulator (Left 7) + Redis Stream Logs & PostgreSQL Inserts (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Feed & Interactive Worker Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Simulated Video Feed Canvas with Dynamic Workers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-mono text-slate-200 font-semibold">{selectedCamera.name}</span>
              </div>
              <span className="font-mono text-amber-400 text-[11px]">
                Active Zone: {activeZone?.name}
              </span>
            </div>

            <div className="relative aspect-video bg-slate-950 overflow-hidden select-none">
              {/* Background Factory Atmosphere */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>
              
              {/* Monitored Polygonal Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={activeZone?.polygon_coordinates.map((pt) => `${pt[0]}%,${pt[1]}%`).join(' ')}
                  fill={activeZone?.color || '#EF4444'}
                  fillOpacity="0.12"
                  stroke={activeZone?.color || '#EF4444'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Dynamic Animated Workers */}
              {workers.map((worker) => {
                const hasViol = !!worker.currentViolation;
                return (
                  <div
                    key={worker.id}
                    className="absolute transition-all duration-200 flex flex-col items-center"
                    style={{
                      left: `${worker.x}%`,
                      top: `${worker.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Bounding Box Container */}
                    <div
                      className={`w-28 h-56 rounded border-2 flex flex-col justify-between p-1.5 backdrop-blur-[1px] transition-all ${
                        hasViol
                          ? 'border-rose-500 bg-rose-500/15 shadow-lg shadow-rose-500/20'
                          : 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      }`}
                    >
                      {/* Top Header Tag */}
                      <div
                        className={`w-full text-[9px] font-mono font-bold px-1 py-0.5 rounded flex items-center justify-between ${
                          hasViol ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        <span>{worker.id}</span>
                        <span>{hasViol ? 'VIOLATION' : 'COMPLIANT'}</span>
                      </div>

                      {/* 4 Anatomical Zone Status Indicators */}
                      <div className="w-full space-y-1 text-[8px] font-mono">
                        {/* Head */}
                        <div
                          className={`px-1 py-0.5 rounded flex justify-between ${
                            worker.ppe.head_helmet
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold'
                          }`}
                        >
                          <span>HEAD:</span>
                          <span>{worker.ppe.head_helmet ? 'HELMET ✓' : 'NO HELMET ✗'}</span>
                        </div>

                        {/* Facial */}
                        <div
                          className={`px-1 py-0.5 rounded flex justify-between ${
                            worker.ppe.glasses
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          <span>FACE:</span>
                          <span>{worker.ppe.glasses ? 'GLASSES ✓' : 'UNGUARDED'}</span>
                        </div>

                        {/* Upper Body */}
                        <div
                          className={`px-1 py-0.5 rounded flex justify-between ${
                            worker.ppe.vest
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold'
                          }`}
                        >
                          <span>TORSO:</span>
                          <span>{worker.ppe.vest ? 'VEST ✓' : 'NO VEST ✗'}</span>
                        </div>

                        {/* Extremities */}
                        <div
                          className={`px-1 py-0.5 rounded flex justify-between ${
                            worker.ppe.hand_glove && worker.ppe.boots
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-950/90 text-amber-300 border border-amber-500/60 font-bold'
                          }`}
                        >
                          <span>EXTR:</span>
                          <span>{worker.ppe.boots ? (worker.ppe.hand_glove ? 'GLOVES+BOOTS' : 'NO GLOVES ✗') : 'SHOES ✗'}</span>
                        </div>
                      </div>

                      {/* Footer Confidence */}
                      <div className="text-[9px] font-mono text-center text-slate-300 bg-slate-950/80 rounded py-0.5">
                        Conf: {(0.92 + Math.random() * 0.05).toFixed(3)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300">
                <span>FPS: </span>
                <span className="text-emerald-400 font-bold">29.8</span>
                <span className="text-slate-600 mx-2">|</span>
                <span>Tracked Workers: </span>
                <span className="text-amber-400 font-bold">{workers.length}</span>
              </div>
            </div>
          </div>

          {/* Interactive Worker PPE Control Switchboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Interactive Worker PPE State Switchboard (Test Live Triggers)
              </span>
              <span className="text-[11px] text-slate-400">Click to toggle equipment on live tracks</span>
            </div>

            <div className="space-y-3">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">{worker.id}</span>
                      <span className="text-xs text-slate-400">({worker.name})</span>
                    </div>
                  </div>

                  {/* Toggle buttons across 4 anatomical zones */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <button
                      onClick={() => toggleWorkerPPE(worker.id, 'head_helmet')}
                      className={`px-2 py-1 rounded font-mono transition-colors ${
                        worker.ppe.head_helmet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      Helmet {worker.ppe.head_helmet ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => toggleWorkerPPE(worker.id, 'glasses')}
                      className={`px-2 py-1 rounded font-mono transition-colors ${
                        worker.ppe.glasses
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Glasses {worker.ppe.glasses ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => toggleWorkerPPE(worker.id, 'vest')}
                      className={`px-2 py-1 rounded font-mono transition-colors ${
                        worker.ppe.vest
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      Vest {worker.ppe.vest ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => toggleWorkerPPE(worker.id, 'hand_glove')}
                      className={`px-2 py-1 rounded font-mono transition-colors ${
                        worker.ppe.hand_glove
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      Gloves {worker.ppe.hand_glove ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => toggleWorkerPPE(worker.id, 'boots')}
                      className={`px-2 py-1 rounded font-mono transition-colors ${
                        worker.ppe.boots
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {worker.ppe.boots ? 'Steel Boots' : 'Street Shoes'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: High-Frequency Event Log & Redis Ingestion Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Redis Stream Telemetry Feed (XADD live log) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  Redis Stream Ingest (XADD)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Sub-2ms Ingest
              </span>
            </div>

            <div className="p-3 bg-slate-950 font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {streamLogs.map((log) => (
                <div key={log.id} className="text-slate-300 border-b border-slate-900/80 pb-1">
                  <span className="text-slate-500">{log.time} </span>
                  <span className="text-amber-400">{log.payload}</span>
                </div>
              ))}
            </div>
          </div>

          {/* High-Frequency PostgreSQL Partition Table: violation_events */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  PostgreSQL Table: violation_events_y2026m08
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {violations.filter((v) => !v.acknowledged).length} Unacknowledged
              </span>
            </div>

            <div className="divide-y divide-slate-800 max-h-[380px] overflow-y-auto scrollbar-thin">
              {violations.map((viol) => (
                <div key={viol.id} className="p-3.5 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                            viol.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {viol.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          {viol.violation_type}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>Anatomical Zone: <strong className="text-slate-300">{viol.anatomical_zone}</strong></span>
                        <span>•</span>
                        <span>Track: <strong className="text-amber-400">{viol.person_track_id}</strong></span>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Detected: {new Date(viol.detected_at).toLocaleTimeString()} • Conf: {(viol.confidence_score * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Acknowledgment Action */}
                    <div>
                      {viol.acknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Ack'd
                        </span>
                      ) : (
                        <button
                          onClick={() => setAckModalViolation(viol)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded border border-slate-700 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Acknowledgment Modal */}
      {ackModalViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Acknowledge PPE Violation Incident</h3>
              </div>
              <button
                onClick={() => setAckModalViolation(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-1">
                <div>Violation: <strong className="text-rose-400">{ackModalViolation.violation_type}</strong></div>
                <div>Anatomical Zone: <strong className="text-amber-400">{ackModalViolation.anatomical_zone}</strong></div>
                <div>Worker Track: <strong>{ackModalViolation.person_track_id}</strong></div>
                <div>Timestamp: {ackModalViolation.detected_at}</div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">EHS Officer Corrective Action Notes:</label>
                <textarea
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="e.g. Worker verbally notified and issued fresh hard hat from safety locker #3."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setAckModalViolation(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md transition-all"
              >
                Confirm & Log to EHS Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
