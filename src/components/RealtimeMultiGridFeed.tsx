import React, { useState, useEffect } from 'react';
import { 
  Grid2X2, 
  Grid3X3, 
  Maximize2, 
  Play, 
  Pause, 
  Camera, 
  Radio, 
  Zap, 
  Volume2, 
  VolumeX, 
  Download, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Info,
  Sliders,
  Expand,
  Minimize2,
  Tv,
  Plus
} from 'lucide-react';
import { CameraFeed } from '../types/schema';
import { useTheme } from '../context/ThemeContext';

interface RealtimeMultiGridFeedProps {
  cameras: CameraFeed[];
  onOpenAddCamera?: () => void;
}

interface BoundingBoxItem {
  id: string;
  className: string;
  label: string;
  type: 'COMPLIANT' | 'VIOLATION' | 'DETECTION';
  confidence: number;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number;
  height: number;
  workerTrackId: string;
  zone: string;
}

export const RealtimeMultiGridFeed: React.FC<RealtimeMultiGridFeedProps> = ({ 
  cameras, 
  onOpenAddCamera 
}) => {
  const { theme } = useTheme();
  const [gridLayout, setGridLayout] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showZonePolygons, setShowZonePolygons] = useState<boolean>(true);
  const [showWorkerAnchors, setShowWorkerAnchors] = useState<boolean>(true);
  const [isAudioAlarmActive, setIsAudioAlarmActive] = useState<boolean>(false);
  const [selectedBox, setSelectedBox] = useState<BoundingBoxItem | null>(null);

  // Live dynamic bounding boxes with simulated worker motion
  const [cameraBoxes, setCameraBoxes] = useState<Record<string, BoundingBoxItem[]>>({
    'cam-01-weld': [
      {
        id: 'box-weld-person',
        className: 'person',
        label: 'Worker (TRACK_P042)',
        type: 'DETECTION',
        confidence: 0.96,
        x: 32,
        y: 18,
        width: 28,
        height: 70,
        workerTrackId: 'TRACK_P042',
        zone: 'ZONE-ARC-HAZARD-01',
      },
      {
        id: 'box-weld-helmet',
        className: 'head_nohelmet',
        label: 'Bare Head (VIOLATION)',
        type: 'VIOLATION',
        confidence: 0.948,
        x: 38,
        y: 20,
        width: 14,
        height: 16,
        workerTrackId: 'TRACK_P042',
        zone: 'ZONE-ARC-HAZARD-01',
      },
      {
        id: 'box-weld-vest',
        className: 'vest',
        label: 'Hi-Vis Vest (COMPLIANT)',
        type: 'COMPLIANT',
        confidence: 0.92,
        x: 35,
        y: 35,
        width: 22,
        height: 28,
        workerTrackId: 'TRACK_P042',
        zone: 'ZONE-ARC-HAZARD-01',
      },
      {
        id: 'box-weld-glove',
        className: 'hand_noglove',
        label: 'Bare Hands (VIOLATION)',
        type: 'VIOLATION',
        confidence: 0.892,
        x: 34,
        y: 56,
        width: 11,
        height: 14,
        workerTrackId: 'TRACK_P042',
        zone: 'ZONE-ARC-HAZARD-01',
      },
      {
        id: 'box-weld-boots',
        className: 'boots',
        label: 'Steel Boots (COMPLIANT)',
        type: 'COMPLIANT',
        confidence: 0.885,
        x: 38,
        y: 76,
        width: 16,
        height: 12,
        workerTrackId: 'TRACK_P042',
        zone: 'ZONE-ARC-HAZARD-01',
      },
    ],
    'cam-02-chem': [
      {
        id: 'box-chem-person',
        className: 'person',
        label: 'Chemical Tech (TRACK_P019)',
        type: 'DETECTION',
        confidence: 0.97,
        x: 48,
        y: 20,
        width: 24,
        height: 68,
        workerTrackId: 'TRACK_P019',
        zone: 'ZONE-ACID-BATH-C2',
      },
      {
        id: 'box-chem-helmet',
        className: 'head_helmet',
        label: 'Hard Hat (COMPLIANT)',
        type: 'COMPLIANT',
        confidence: 0.95,
        x: 52,
        y: 22,
        width: 12,
        height: 14,
        workerTrackId: 'TRACK_P019',
        zone: 'ZONE-ACID-BATH-C2',
      },
      {
        id: 'box-chem-mask',
        className: 'face_nomask',
        label: 'No Respirator (VIOLATION)',
        type: 'VIOLATION',
        confidence: 0.963,
        x: 54,
        y: 32,
        width: 9,
        height: 10,
        workerTrackId: 'TRACK_P019',
        zone: 'ZONE-ACID-BATH-C2',
      },
      {
        id: 'box-chem-glove',
        className: 'hand_glove',
        label: 'Acid Gloves (COMPLIANT)',
        type: 'COMPLIANT',
        confidence: 0.93,
        x: 50,
        y: 50,
        width: 10,
        height: 12,
        workerTrackId: 'TRACK_P019',
        zone: 'ZONE-ACID-BATH-C2',
      },
    ],
    'cam-03-dock': [
      {
        id: 'box-dock-person',
        className: 'person',
        label: 'Rigger (TRACK_P088)',
        type: 'DETECTION',
        confidence: 0.95,
        x: 36,
        y: 22,
        width: 26,
        height: 68,
        workerTrackId: 'TRACK_P088',
        zone: 'ZONE-SUSPENDED-LOAD-01',
      },
      {
        id: 'box-dock-helmet',
        className: 'head_helmet',
        label: 'Hard Hat (COMPLIANT)',
        type: 'COMPLIANT',
        confidence: 0.94,
        x: 41,
        y: 24,
        width: 13,
        height: 14,
        workerTrackId: 'TRACK_P088',
        zone: 'ZONE-SUSPENDED-LOAD-01',
      },
      {
        id: 'box-dock-vest',
        className: 'vest',
        label: 'Hi-Vis Vest (COMPLIANT)',
        type: 'COMPLIANT',
        confidence: 0.91,
        x: 39,
        y: 38,
        width: 20,
        height: 25,
        workerTrackId: 'TRACK_P088',
        zone: 'ZONE-SUSPENDED-LOAD-01',
      },
      {
        id: 'box-dock-shoes',
        className: 'shoes',
        label: 'Street Shoes (VIOLATION)',
        type: 'VIOLATION',
        confidence: 0.897,
        x: 42,
        y: 78,
        width: 16,
        height: 14,
        workerTrackId: 'TRACK_P088',
        zone: 'ZONE-SUSPENDED-LOAD-01',
      },
    ],
  });

  // Small subtle frame jitter to simulate active 25 FPS tracking coordinates
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCameraBoxes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((camKey) => {
          next[camKey] = next[camKey].map((box) => {
            const jitterX = (Math.random() - 0.5) * 0.4;
            const jitterY = (Math.random() - 0.5) * 0.4;
            return {
              ...box,
              x: Math.max(5, Math.min(85, box.x + jitterX)),
              y: Math.max(5, Math.min(85, box.y + jitterY)),
            };
          });
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Initialize default boxes for any newly added cameras
  useEffect(() => {
    setCameraBoxes((prev) => {
      const next = { ...prev };
      cameras.forEach((cam) => {
        if (!next[cam.id]) {
          // Provide dynamic initial detection boxes for newly connected camera
          next[cam.id] = [
            {
              id: `box-${cam.id}-person`,
              className: 'person',
              label: `Worker (TRACK_${cam.id.slice(-4).toUpperCase()})`,
              type: 'DETECTION',
              confidence: 0.97,
              x: 34,
              y: 18,
              width: 32,
              height: 72,
              workerTrackId: `TRACK_${cam.id.slice(-4).toUpperCase()}`,
              zone: cam.zones[0]?.zone_code || 'ZONE-ACTIVE',
            },
            {
              id: `box-${cam.id}-helmet`,
              className: 'head_helmet',
              label: 'Hard Hat (COMPLIANT)',
              type: 'COMPLIANT',
              confidence: 0.95,
              x: 42,
              y: 20,
              width: 15,
              height: 15,
              workerTrackId: `TRACK_${cam.id.slice(-4).toUpperCase()}`,
              zone: cam.zones[0]?.zone_code || 'ZONE-ACTIVE',
            },
            {
              id: `box-${cam.id}-vest`,
              className: 'vest',
              label: 'Hi-Vis Vest (COMPLIANT)',
              type: 'COMPLIANT',
              confidence: 0.93,
              x: 38,
              y: 36,
              width: 24,
              height: 28,
              workerTrackId: `TRACK_${cam.id.slice(-4).toUpperCase()}`,
              zone: cam.zones[0]?.zone_code || 'ZONE-ACTIVE',
            },
            {
              id: `box-${cam.id}-boots`,
              className: 'boots',
              label: 'Safety Boots (COMPLIANT)',
              type: 'COMPLIANT',
              confidence: 0.91,
              x: 41,
              y: 75,
              width: 18,
              height: 15,
              workerTrackId: `TRACK_${cam.id.slice(-4).toUpperCase()}`,
              zone: cam.zones[0]?.zone_code || 'ZONE-ACTIVE',
            },
          ];
        }
      });
      return next;
    });
  }, [cameras]);

  const displayedCameras = focusedCameraId
    ? cameras.filter((c) => c.id === focusedCameraId)
    : gridLayout === '1x1'
    ? cameras.slice(0, 1)
    : gridLayout === '2x2'
    ? cameras.slice(0, 4)
    : cameras;

  const getCameraImage = (camId: string) => {
    if (camId === 'cam-01-weld') {
      return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80';
    }
    if (camId === 'cam-02-chem') {
      return 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80';
    }
    if (camId === 'cam-03-dock') {
      return 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80';
    }
    if (camId === 'cam-04-substation') {
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';
    }
    // High quality industrial fallbacks for added cameras
    const fallbacks = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    ];
    const index = Math.abs(camId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % fallbacks.length;
    return fallbacks[index];
  };

  return (
    <div className="space-y-6">
      {/* Feed Controller Bar */}
      <div className={`border rounded-2xl p-4 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-emerald-500" />
              <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Real-Time Multi-Grid WebRTC Feed
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sub-150ms WHEP
              </span>
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              High-frequency multi-camera canvas with real-time AI bounding box color-coded overlays: <strong className="text-emerald-500">Green = Compliant Class</strong>, <strong className="text-rose-500">Red = Violation Class</strong>.
            </p>
          </div>

          {/* Grid Layout & Overlay Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Grid Selectors */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-mono ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => {
                  setFocusedCameraId(null);
                  setGridLayout('1x1');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  gridLayout === '1x1' && !focusedCameraId
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1x1 Full Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFocusedCameraId(null);
                  setGridLayout('2x2');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  gridLayout === '2x2' && !focusedCameraId
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="2x2 Grid View"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFocusedCameraId(null);
                  setGridLayout('3x3');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  gridLayout === '3x3' && !focusedCameraId
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="3x3 Multi-View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Overlay Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showBoundingBoxes
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                    : theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${showBoundingBoxes ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                AI Boxes
              </button>

              <button
                onClick={() => setShowZonePolygons(!showZonePolygons)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showZonePolygons
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
                    : theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Hazards
              </button>

              {onOpenAddCamera && (
                <button
                  onClick={onOpenAddCamera}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Add New Camera Feed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Camera</span>
                </button>
              )}

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-xl border transition-all ${
                  isPlaying
                    ? theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                }`}
                title={isPlaying ? 'Pause Feeds' : 'Resume Feeds'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Video Grid Feeds */}
      <div
        className={`grid gap-5 ${
          focusedCameraId || gridLayout === '1x1'
            ? 'grid-cols-1'
            : gridLayout === '2x2'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {displayedCameras.map((cam) => {
          const boxes = cameraBoxes[cam.id] || [];
          const activeZone = cam.zones[0];
          const hasViolation = boxes.some((b) => b.type === 'VIOLATION');

          return (
            <div
              key={cam.id}
              className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all ${
                hasViolation
                  ? 'ring-2 ring-rose-500/40 border-rose-500/50'
                  : theme === 'dark'
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Stream Header */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${hasViolation ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span className={`font-mono text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {cam.camera_uid}
                  </span>
                  <span className={`text-[11px] font-sans truncate hidden sm:inline ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    • {cam.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {cam.fps} FPS
                  </span>

                  <button
                    onClick={() => setFocusedCameraId(focusedCameraId === cam.id ? null : cam.id)}
                    className={`p-1 rounded-lg border transition-colors ${
                      focusedCameraId === cam.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Toggle Full Focus"
                  >
                    {focusedCameraId === cam.id ? <Minimize2 className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Video Viewport with AI Bounding Box Overlays */}
              <div className="relative aspect-video bg-black overflow-hidden select-none group">
                <img
                  src={getCameraImage(cam.id)}
                  alt={cam.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isPlaying ? 'opacity-90' : 'opacity-40'
                  }`}
                />

                {/* Sub-150ms Telemetry Tag */}
                <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow">
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span>WebRTC WHEP</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400">36.2ms</span>
                </div>

                {/* Hazard Polygon Perimeter Overlay */}
                {showZonePolygons && activeZone && (
                  <div
                    className="absolute border-2 border-dashed border-red-500/50 bg-red-500/10 rounded-lg pointer-events-none"
                    style={{ left: '12%', top: '15%', width: '76%', height: '72%' }}
                  >
                    <span className="absolute top-1 left-2 text-[9px] font-mono text-red-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-red-500/30">
                      ⚠️ {activeZone.zone_code} (Active Hazard Area)
                    </span>
                  </div>
                )}

                {/* AI Detection Bounding Boxes Overlaid directly on Stream */}
                {showBoundingBoxes && isPlaying && (
                  <>
                    {boxes.map((box) => {
                      const isViolation = box.type === 'VIOLATION';
                      const isCompliant = box.type === 'COMPLIANT';
                      const isPerson = box.type === 'DETECTION';

                      if (isPerson && !showWorkerAnchors) return null;

                      // Color Coding strictly according to compliance state:
                      // Green = Compliant Class, Red = Violation Class, Blue = Worker Anchor
                      const borderColor = isViolation
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                        : isCompliant
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-blue-400/80 bg-blue-500/10 text-blue-300';

                      const badgeBg = isViolation
                        ? 'bg-rose-600 text-white'
                        : isCompliant
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white';

                      return (
                        <div
                          key={box.id}
                          onClick={() => setSelectedBox(box)}
                          className={`absolute border-2 rounded transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-white ${borderColor}`}
                          style={{
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                          }}
                        >
                          {/* Label Badge */}
                          <div
                            className={`absolute -top-5 left-0 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded shadow-md whitespace-nowrap flex items-center gap-1 ${badgeBg}`}
                          >
                            <span>{box.label}</span>
                            <span className="opacity-80">{(box.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Violation Flash Banner */}
                {hasViolation && (
                  <div className="absolute bottom-2 left-2 right-2 bg-rose-950/90 backdrop-blur-md border border-rose-500/60 p-2 rounded-lg text-xs font-mono text-rose-200 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                      <span className="font-bold">PPE VIOLATION DETECTED</span>
                    </div>
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded">
                      AUTO-ROUTING TO SUPERVISOR
                    </span>
                  </div>
                )}
              </div>

              {/* Stream Telemetry Footer */}
              <div className={`p-3 border-t grid grid-cols-3 gap-2 text-[11px] font-mono ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-500 block text-[9px]">RESOLUTION</span>
                  <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{cam.resolution}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">ENCODER</span>
                  <span className="text-emerald-500 font-bold">NVENC H.264</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">ACTIVE DETECTIONS</span>
                  <span className="text-amber-500 font-bold">{boxes.length} Associated Boxes</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Bounding Box Inspector Drawer (when clicked) */}
      {selectedBox && (
        <div className={`border rounded-2xl p-4 shadow-xl transition-all ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Spatial Detection Bounding Box Inspector
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                selectedBox.type === 'VIOLATION'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : selectedBox.type === 'COMPLIANT'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {selectedBox.type}
              </span>
            </div>

            <button
              onClick={() => setSelectedBox(null)}
              className={`text-xs font-mono px-2 py-1 rounded border ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Close Inspector
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Detected Class:</span>
              <span className="font-bold text-amber-400">{selectedBox.className}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Worker Track ID:</span>
              <span className="font-bold text-blue-400">{selectedBox.workerTrackId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Confidence Level:</span>
              <span className="font-bold text-emerald-400">{(selectedBox.confidence * 100).toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Active Hazard Zone:</span>
              <span className="font-bold text-rose-400">{selectedBox.zone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
