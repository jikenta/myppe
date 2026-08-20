import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Zap, 
  Wifi, 
  Volume2, 
  Smartphone, 
  Radio, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Server, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Cpu,
  Flame,
  Clock,
  EyeOff,
  Eye,
  Send,
  Terminal,
  VolumeX
} from 'lucide-react';
import { CameraFeed, GpioRelayState, MobilePushPayload } from '../types/schema';

interface VideoInfraStudioProps {
  cameras: CameraFeed[];
}

export const VideoInfraStudio: React.FC<VideoInfraStudioProps> = ({ cameras }) => {
  // Selected Camera Feed (Default to Line 3 Welding)
  const [selectedCameraId, setSelectedCameraId] = useState<string>('cam-01-weld');
  const [streamingProtocol, setStreamingProtocol] = useState<'WEBRTC_WHEP' | 'LL_HLS'>('WEBRTC_WHEP');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [streamLatencyMs, setStreamLatencyMs] = useState<number>(38.4);
  const [streamFps, setStreamFps] = useState<number>(25.0);
  const [bitrateKbps, setBitrateKbps] = useState<number>(4250);

  // Per-Camera Dynamic Rule State (Line 3 specific hot-reload toggles)
  // Specifically: head_nohelmet (ON), hand_noglove (ON), face_nomask (OFF / BYPASSED)
  const [line3Rules, setLine3Rules] = useState<{
    head_nohelmet: boolean;
    hand_noglove: boolean;
    face_nomask: boolean;
    shoes: boolean;
  }>({
    head_nohelmet: true,
    hand_noglove: true,
    face_nomask: false, // Bypassed on Line 3 as requested!
    shoes: true,
  });

  const [lastHotReloadTime, setLastHotReloadTime] = useState<string>('Live Synced (v4)');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [redisPubSubLog, setRedisPubSubLog] = useState<string[]>([
    '[08:14:02] REDIS_PUBSUB: Subscribed to ehs:config:channel:cam-01-weld',
    '[08:14:03] INFERENCE_WORKER: Initialized in-memory rule mask [head_nohelmet: ON, hand_noglove: ON, face_nomask: BYPASSED]',
    '[08:14:04] WEBRTC_WHEP: Active stream session established with NVENC hardware acceleration',
  ]);

  // Real-time Dispatched Alerts & Channel Feeds
  const [wsMessages, setWsMessages] = useState<{
    id: string;
    timestamp: string;
    type: string;
    class_name: string;
    severity: string;
    bypassed: boolean;
    channel: string;
    trackId: string;
  }[]>([
    {
      id: 'ws-101',
      timestamp: '08:14:15.240',
      type: 'VIOLATION_ALERT',
      class_name: 'head_nohelmet',
      severity: 'CRITICAL',
      bypassed: false,
      channel: 'WebSockets + Mobile APNs + GPIO Siren 110dB',
      trackId: 'TRACK_P042',
    },
    {
      id: 'ws-102',
      timestamp: '08:14:16.890',
      type: 'VIOLATION_ALERT',
      class_name: 'hand_noglove',
      severity: 'HIGH',
      bypassed: false,
      channel: 'WebSockets + Floor Speaker Horn',
      trackId: 'TRACK_P042',
    },
  ]);

  // Mobile Push Notification Mock
  const [mobilePushQueue, setMobilePushQueue] = useState<MobilePushPayload[]>([
    {
      notification_id: 'notif-991',
      platform: 'APNS_IOS',
      priority: 'HIGH',
      title: '🚨 CRITICAL PPE VIOLATION: NO HELMET',
      body: 'Worker TRACK_P042 in Bay 4 Robotic Arc Perimeter without hard hat. Immediate dispatch.',
      sound: 'alarm_urgent.caf',
      badge_count: 1,
      data: {
        event_id: 'viol-9901',
        camera_id: 'cam-01-weld',
        zone_code: 'ZONE-ARC-HAZARD-01',
        violation_type: 'head_nohelmet',
        severity: 'CRITICAL',
        snapshot_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
        person_track_id: 'TRACK_P042',
        deep_link: 'ehs://violations/viol-9901',
      },
      dispatched_at: '08:14:15.250',
    },
  ]);

  // Hardware GPIO Relay Bank
  const [gpioRelays, setGpioRelays] = useState<GpioRelayState[]>([
    {
      relay_id: 1,
      pin_number: 17,
      label: 'Relay 01: High-Decibel Siren (110dB)',
      target_equipment: 'SIREN_110DB',
      assigned_zone: 'Line 3 Robotic Arc Bay',
      is_energized: false,
      pulse_duration_ms: 3000,
      voltage: '24V DC / 10A Coil',
    },
    {
      relay_id: 2,
      pin_number: 27,
      label: 'Relay 02: Amber High-Visibility Xenon Strobe',
      target_equipment: 'STROBE_BEACON',
      assigned_zone: 'Line 3 Robotic Arc Bay',
      is_energized: false,
      pulse_duration_ms: 5000,
      voltage: '24V DC Coil',
    },
    {
      relay_id: 3,
      pin_number: 22,
      label: 'Relay 03: Floor Speaker / Horn Annunciator',
      target_equipment: 'FLOOR_SPEAKER_HORN',
      assigned_zone: 'Line 3 Robotic Arc Bay',
      is_energized: false,
      pulse_duration_ms: 2500,
      voltage: 'Line Audio Relay',
    },
    {
      relay_id: 4,
      pin_number: 23,
      label: 'Relay 04: Chemical Air-Lock Interlock Gate',
      target_equipment: 'AIR_LOCK_GATE',
      assigned_zone: 'Chemical Acid Tank C2',
      is_energized: false,
      pulse_duration_ms: 8000,
      voltage: '120V AC Solenoid',
    },
  ]);

  const [activeSpeakerMessage, setActiveSpeakerMessage] = useState<string | null>(null);

  const selectedCam = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  // Dynamic Rule Hot-Reload Handler (Redis Pub/Sub Sync)
  const handleToggleRule = (ruleKey: keyof typeof line3Rules) => {
    const nextState = !line3Rules[ruleKey];
    const updated = { ...line3Rules, [ruleKey]: nextState };
    setLine3Rules(updated);

    setIsSyncing(true);
    const nowStr = new Date().toLocaleTimeString();

    // Broadcast simulated Redis Pub/Sub state sync message
    const pubsubPayload = {
      channel: `ehs:config:channel:${selectedCameraId}`,
      action: 'HOT_RELOAD_RULE_MASK',
      camera_id: selectedCameraId,
      zone_id: 'zone-weld-active',
      rules: updated,
      dispatched_at: Date.now(),
      version: Math.floor(Math.random() * 100) + 5,
    };

    setTimeout(() => {
      setIsSyncing(false);
      setLastHotReloadTime(`Hot-Reloaded at ${nowStr} (< 0.12ms)`);
      setRedisPubSubLog((prev) => [
        `[${nowStr}] ⚡ PUBLISH ehs:config:channel:${selectedCameraId} -> ${String(ruleKey).toUpperCase()}=${nextState ? 'ENABLED' : 'BYPASSED'} (Rule Version Updated)`,
        `[${nowStr}] INFERENCE_WORKER: Atomically applied rule mask in 14µs without restarting RTSP stream!`,
        ...prev.slice(0, 6),
      ]);
    }, 150);
  };

  // Trigger Simulated Violation Event
  const triggerSimulationDetection = (detectedClass: 'head_nohelmet' | 'hand_noglove' | 'face_nomask') => {
    const nowStr = new Date().toLocaleTimeString();
    const isEnabled = line3Rules[detectedClass];

    if (!isEnabled) {
      // RULE IS BYPASSED!
      setRedisPubSubLog((prev) => [
        `[${nowStr}] INFERENCE: Detected ${detectedClass} on TRACK_P042, but rule is BYPASSED on Line 3 -> Alert suppressed!`,
        ...prev.slice(0, 6),
      ]);
      setWsMessages((prev) => [
        {
          id: `ws-${Date.now()}`,
          timestamp: nowStr,
          type: 'DETECTION_EVALUATED',
          class_name: detectedClass,
          severity: 'HIGH',
          bypassed: true,
          channel: 'NONE (Rule Bypassed by EHS Policy)',
          trackId: 'TRACK_P042',
        },
        ...prev.slice(0, 7),
      ]);
      return;
    }

    // RULE IS ACTIVE -> Dispatch to WebSockets, Mobile APNs, and GPIO Relays!
    const severity = detectedClass === 'head_nohelmet' ? 'CRITICAL' : 'HIGH';
    let targetRelay = 1;
    let speakerAudio = 'Warning: Hard Hat Required in Active Work Zone!';

    if (detectedClass === 'hand_noglove') {
      targetRelay = 3;
      speakerAudio = 'Attention Line 3: Protective Handwear Required for Plasma Work!';
    } else if (detectedClass === 'face_nomask') {
      targetRelay = 4;
      speakerAudio = 'Alert: Respiratory Protection Required!';
    }

    // 1. Update WebSocket Feed
    setWsMessages((prev) => [
      {
        id: `ws-${Date.now()}`,
        timestamp: nowStr,
        type: 'VIOLATION_ALERT',
        class_name: detectedClass,
        severity,
        bypassed: false,
        channel: 'WebSockets + Mobile APNs + GPIO Relays',
        trackId: 'TRACK_P042',
      },
      ...prev.slice(0, 7),
    ]);

    // 2. Add Mobile Push Notification
    setMobilePushQueue((prev) => [
      {
        notification_id: `notif-${Date.now()}`,
        platform: 'APNS_IOS',
        priority: 'HIGH',
        title: `🚨 EHS VIOLATION: ${detectedClass.toUpperCase()}`,
        body: `Worker TRACK_P042 missing mandatory ${detectedClass} in ${selectedCam.name}. Immediate triage.`,
        sound: 'alarm_urgent.caf',
        badge_count: 1,
        data: {
          event_id: `viol-${Date.now()}`,
          camera_id: selectedCameraId,
          zone_code: 'ZONE-ARC-HAZARD-01',
          violation_type: detectedClass,
          severity,
          snapshot_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
          person_track_id: 'TRACK_P042',
          deep_link: 'ehs://violations/active',
        },
        dispatched_at: nowStr,
      },
      ...prev.slice(0, 3),
    ]);

    // 3. Energize Hardware Relay & Annunciator Speaker
    setGpioRelays((prev) =>
      prev.map((r) => {
        if (r.relay_id === targetRelay || (detectedClass === 'head_nohelmet' && r.relay_id === 2)) {
          return {
            ...r,
            is_energized: true,
            last_triggered_at: nowStr,
            trigger_reason: `${detectedClass.toUpperCase()} detected on Line 3`,
          };
        }
        return r;
      })
    );

    setActiveSpeakerMessage(speakerAudio);

    // Auto de-energize relay after pulse duration
    setTimeout(() => {
      setGpioRelays((prev) =>
        prev.map((r) => {
          if (r.relay_id === targetRelay || r.relay_id === 2) {
            return { ...r, is_energized: false };
          }
          return r;
        })
      );
      setActiveSpeakerMessage(null);
    }, 3500);

    setRedisPubSubLog((prev) => [
      `[${nowStr}] ⚡ ASYNC DISPATCH: Dispatched WebSocket + APNs + GPIO Relay ${targetRelay} for ${detectedClass}`,
      ...prev.slice(0, 6),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Python (FastAPI) RTSP Ingest & WebRTC Distribution Studio
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Zero-Downtime Rule Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Scalable RTSP demuxing, WebRTC (WHEP) sub-150ms streaming, in-memory Redis rule hot-reloads, and selective asynchronous multi-channel dispatch (WebSockets, APNs Push, and Hardware GPIO Relays).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-300 font-bold">RTSP INGEST LIVE</span>
              <span className="text-slate-700">|</span>
              <span className="text-xs font-mono text-slate-300">NVENC H.264</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Video Player + Stream Stats (Left 7 cols) & Dynamic Rule Hot-Reload (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Video Stream Area (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            
            {/* Stream Header Controls */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="bg-slate-900 text-xs font-mono font-semibold text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.camera_uid} - {c.name}
                    </option>
                  ))}
                </select>

                <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex text-[11px] font-mono">
                  <button
                    onClick={() => {
                      setStreamingProtocol('WEBRTC_WHEP');
                      setStreamLatencyMs(38.4);
                    }}
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      streamingProtocol === 'WEBRTC_WHEP'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    WebRTC (WHEP)
                  </button>
                  <button
                    onClick={() => {
                      setStreamingProtocol('LL_HLS');
                      setStreamLatencyMs(480.0);
                    }}
                    className={`px-2 py-1 rounded font-semibold transition-all ${
                      streamingProtocol === 'LL_HLS'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    LL-HLS
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Video Canvas Container with AI Bounding Box Overlays */}
            <div className="relative aspect-video bg-black overflow-hidden select-none">
              {/* Background Video / Industrial Simulation Image */}
              <img
                src={
                  selectedCameraId === 'cam-01-weld'
                    ? 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80'
                    : selectedCameraId === 'cam-02-chem'
                    ? 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80'
                    : 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80'
                }
                alt="Live Camera Feed"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-90' : 'opacity-40'}`}
              />

              {/* Streaming Overlay Info */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-white font-bold">{selectedCam.camera_uid}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400">{streamFps.toFixed(1)} FPS</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400">{streamLatencyMs.toFixed(1)}ms Latency</span>
              </div>

              {/* Protocol Badge */}
              <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>{streamingProtocol === 'WEBRTC_WHEP' ? 'WebRTC (WHEP / RFC 9621)' : 'Low-Latency HLS (fMP4)'}</span>
              </div>

              {/* Active Worker Bounding Boxes Overlaid on Stream */}
              {isPlaying && selectedCameraId === 'cam-01-weld' && (
                <>
                  {/* Person Anchor Box */}
                  <div
                    className="absolute border-2 border-blue-400/80 bg-blue-500/10 rounded pointer-events-none transition-all duration-300"
                    style={{ left: '32%', top: '18%', width: '28%', height: '70%' }}
                  >
                    <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded shadow">
                      TRACK_P042 (Welder)
                    </div>

                    {/* Head Sub-Box */}
                    <div
                      className={`absolute left-[20%] top-[4%] w-[60%] h-[24%] border-2 rounded ${
                        line3Rules.head_nohelmet
                          ? 'border-rose-500 bg-rose-500/20'
                          : 'border-slate-500 bg-slate-500/10'
                      }`}
                    >
                      <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded absolute -top-4 left-0 ${
                        line3Rules.head_nohelmet ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {line3Rules.head_nohelmet ? '⚠️ head_nohelmet 0.94' : 'head_nohelmet (BYPASSED)'}
                      </span>
                    </div>

                    {/* Facial Sub-Box (BYPASSED ON LINE 3) */}
                    <div
                      className="absolute left-[25%] top-[28%] w-[50%] h-[16%] border border-dashed border-amber-400/60 bg-amber-500/10 rounded"
                    >
                      <span className="text-[9px] font-mono text-amber-300 bg-slate-950/80 px-1 rounded absolute -top-3.5 left-0">
                        {line3Rules.face_nomask ? 'face_nomask 0.91' : 'face_nomask (RULE BYPASSED)'}
                      </span>
                    </div>

                    {/* Extremities Hand Sub-Box */}
                    <div
                      className={`absolute left-[5%] top-[55%] w-[45%] h-[25%] border-2 rounded ${
                        line3Rules.hand_noglove
                          ? 'border-amber-500 bg-amber-500/20'
                          : 'border-slate-500 bg-slate-500/10'
                      }`}
                    >
                      <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded absolute -bottom-4 left-0 ${
                        line3Rules.hand_noglove ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {line3Rules.hand_noglove ? '⚠️ hand_noglove 0.89' : 'hand_noglove (BYPASSED)'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Active Floor Speaker Visual Banner */}
              {activeSpeakerMessage && (
                <div className="absolute bottom-4 left-4 right-4 bg-amber-500 text-slate-950 p-3 rounded-lg shadow-xl font-mono text-xs font-bold flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    <span>FLOOR SPEAKER ANNOUNCEMENT: "{activeSpeakerMessage}"</span>
                  </div>
                  <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px]">
                    110 dB RELAY COIL ENERGIZED
                  </span>
                </div>
              )}
            </div>

            {/* Video Pipeline Telemetry Footer */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Inference Backend:</span>
                <span className="text-slate-200 font-bold">TensorRT YOLOv11</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Demux Latency:</span>
                <span className="text-emerald-400 font-bold">&lt; 1.8ms (Zero-Copy)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Bitrate / Packet Loss:</span>
                <span className="text-amber-400 font-bold">{bitrateKbps} kbps / 0.01%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Active Subscribers:</span>
                <span className="text-purple-400 font-bold">14 WebRTC / 4 Mobile</span>
              </div>
            </div>

          </div>

          {/* Test Trigger Controls: Manually Inject Detections into Ingest Engine */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Live Ingestion Testbench: Inject Detections into Stream
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Test Selective Multi-Channel Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => triggerSimulationDetection('head_nohelmet')}
                className="p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span>Trigger No-Helmet</span>
                <span className="text-[10px] font-normal text-rose-400/80">
                  {line3Rules.head_nohelmet ? 'Active Rule -> Full Siren' : 'Currently Bypassed'}
                </span>
              </button>

              <button
                onClick={() => triggerSimulationDetection('hand_noglove')}
                className="p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span>Trigger No-Gloves</span>
                <span className="text-[10px] font-normal text-amber-400/80">
                  {line3Rules.hand_noglove ? 'Active Rule -> Speaker Horn' : 'Currently Bypassed'}
                </span>
              </button>

              <button
                onClick={() => triggerSimulationDetection('face_nomask')}
                className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all"
              >
                <span>Trigger No-Mask</span>
                <span className="text-[10px] font-normal text-blue-400/80">
                  {line3Rules.face_nomask ? 'Active Rule -> Air-Lock' : 'Bypassed on Line 3 (No Alert)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Dynamic Rule Hot-Reload & Hardware Relays (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Redis Per-Camera State Hot-Reload Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Zero-Downtime Rule Sync (Line 3)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hot-reloads in-memory rule masks via Redis Pub/Sub in &lt;15µs
                </p>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isSyncing
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold'
                  : 'bg-slate-950 text-emerald-400 border-slate-800'
              }`}>
                {isSyncing ? 'SYNCING REDIS...' : lastHotReloadTime}
              </span>
            </div>

            {/* Interactive Rule Toggles for Line 3 */}
            <div className="space-y-2.5">
              {/* head_nohelmet */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-200">head_nohelmet</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                      CRITICAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mandatory overhead crane arc helmet rule</p>
                </div>

                <button
                  onClick={() => handleToggleRule('head_nohelmet')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    line3Rules.head_nohelmet ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      line3Rules.head_nohelmet ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* hand_noglove */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-200">hand_noglove</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                      HIGH
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Plasma welding thermal glove rule</p>
                </div>

                <button
                  onClick={() => handleToggleRule('hand_noglove')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    line3Rules.hand_noglove ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      line3Rules.hand_noglove ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* face_nomask (BYPASSED ON LINE 3 AS REQUESTED!) */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-200">face_nomask</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                      line3Rules.face_nomask
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {line3Rules.face_nomask ? 'ENFORCED' : 'BYPASSED ON LINE 3'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {line3Rules.face_nomask ? 'Enforcing particulate mask' : 'Bypassed by EHS policy (No particulate hazard)'}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleRule('face_nomask')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    line3Rules.face_nomask ? 'bg-amber-500' : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      line3Rules.face_nomask ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Redis Pub/Sub Log Console */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-[10px] text-slate-500 block">Redis Pub/Sub Real-Time Telemetry Stream:</span>
              <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {redisPubSubLog.map((log, idx) => (
                  <div key={idx} className={idx === 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Hardware GPIO Relays & Industrial Annunciator Board */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Hardware GPIO Relay & Floor Speaker Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Modbus TCP / GPIO 24V</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {gpioRelays.map((relay) => (
                <div
                  key={relay.relay_id}
                  className={`p-3 rounded-xl border transition-all ${
                    relay.is_energized
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-bold">
                      Pin {relay.pin_number} (Relay {relay.relay_id})
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        relay.is_energized ? 'bg-amber-400 animate-ping' : 'bg-slate-700'
                      }`}
                    />
                  </div>

                  <div className="text-xs font-semibold">{relay.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{relay.voltage}</div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className={relay.is_energized ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                      {relay.is_energized ? '⚡ COIL ENERGIZED' : 'IDLE COOLDOWN'}
                    </span>
                    <span className="text-slate-400">{relay.pulse_duration_ms}ms pulse</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Dispatch Feeds: WebSocket Live Feed (6 cols) & Mobile Push Notification Mock (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WebSocket Real-time Alert Stream (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white uppercase">
                Asynchronous WebSocket Alert Stream (/ws/alerts)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Backpressure: 0ms</span>
          </div>

          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto scrollbar-thin">
            {wsMessages.map((msg) => (
              <div key={msg.id} className="p-3.5 hover:bg-slate-800/30 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                        msg.bypassed
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : msg.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {msg.bypassed ? 'BYPASS DROPPED' : msg.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200">{msg.class_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({msg.trackId})</span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">{msg.timestamp}</span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Routing Channels: <strong className="text-slate-300">{msg.channel}</strong></span>
                  <span className="text-emerald-400 font-semibold">Latency: 1.2ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Push Notification Mock (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-white uppercase">
                Mobile Push Notification Receiver (APNs / FCM v1)
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">iOS 18 / Android 15</span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center items-center bg-slate-950/60">
            {mobilePushQueue.length > 0 ? (
              <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                      EHS
                    </div>
                    <span className="text-xs font-bold text-slate-200">EHS SENTINEL CRITICAL ALERT</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">now</span>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-rose-400">{mobilePushQueue[0].title}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{mobilePushQueue[0].body}</p>
                  </div>

                  <img
                    src={mobilePushQueue[0].data.snapshot_url}
                    alt="Violation Thumbnail"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                  <span>Priority: <strong className="text-amber-400">HIGH (Interruption Level: TIME_SENSITIVE)</strong></span>
                  <span className="text-emerald-400 font-bold">DeepLink: {mobilePushQueue[0].data.deep_link}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No active mobile push notifications in queue.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
