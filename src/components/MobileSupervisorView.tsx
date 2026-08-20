import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Smartphone, 
  Filter, 
  Clock, 
  Camera, 
  Layers, 
  UserCheck, 
  Share2, 
  Eye, 
  X, 
  Send, 
  Check, 
  BellRing,
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';
import { ViolationEvent, CameraFeed } from '../types/schema';
import { RECENT_VIOLATION_EVENTS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

interface MobileSupervisorViewProps {
  cameras: CameraFeed[];
}

export const MobileSupervisorView: React.FC<MobileSupervisorViewProps> = ({ cameras }) => {
  const { theme } = useTheme();
  const [violations, setViolations] = useState<ViolationEvent[]>(RECENT_VIOLATION_EVENTS);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'UNACKNOWLEDGED'>('UNACKNOWLEDGED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedViolationForEvidence, setSelectedViolationForEvidence] = useState<ViolationEvent | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; type: 'success' | 'alert' } | null>(null);

  // Quick Action Handlers
  const handleAcknowledge = (id: string, note?: string) => {
    const nowStr = new Date().toLocaleTimeString();
    setViolations((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              acknowledged: true,
              acknowledged_by: 'Safety Supervisor: Mark Davis (Floor Mobile)',
              acknowledged_at: new Date().toISOString(),
            }
          : v
      )
    );

    setActionFeedback({
      id,
      message: `Violation ${id} acknowledged and logged with audit trail at ${nowStr}`,
      type: 'success',
    });

    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleTriggerRelaySiren = (violation: ViolationEvent) => {
    const nowStr = new Date().toLocaleTimeString();
    setActionFeedback({
      id: violation.id,
      message: `⚡ 110dB Floor Horn Energized for 3000ms on ${violation.camera_id}!`,
      type: 'alert',
    });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleEscalate = (violation: ViolationEvent) => {
    const nowStr = new Date().toLocaleTimeString();
    setActionFeedback({
      id: violation.id,
      message: `📲 Critical Alert Escalated to Plant Safety Director via High-Priority APNs Push`,
      type: 'alert',
    });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleFalsePositive = (id: string) => {
    setViolations((prev) => prev.filter((v) => v.id !== id));
    setActionFeedback({
      id,
      message: `Tagged as False Positive. In-memory confidence threshold fine-tuned.`,
      type: 'success',
    });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Filter logic
  const filteredViolations = violations.filter((v) => {
    if (filterSeverity === 'UNACKNOWLEDGED' && v.acknowledged) return false;
    if (filterSeverity === 'CRITICAL' && v.severity !== 'CRITICAL') return false;
    if (filterSeverity === 'HIGH' && v.severity !== 'HIGH') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.camera_id.toLowerCase().includes(q) ||
        v.detected_class.toLowerCase().includes(q) ||
        v.person_track_id.toLowerCase().includes(q) ||
        v.zone_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCameraDetails = (cameraId: string) => {
    return cameras.find((c) => c.id === cameraId) || {
      camera_uid: cameraId,
      name: 'Industrial Monitoring Cell',
      location_name: 'Main Production Floor',
    };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mobile Supervisor Top Control Deck */}
      <div className={`border rounded-2xl p-5 shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Mobile Supervisor Triage Deck
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                PWA Floor Response
              </span>
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Touch-optimized incident cards with real-time snapshot evidence, active camera IDs, hazard zones, and 1-tap rapid acknowledgment.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold ${
              theme === 'dark' ? 'bg-slate-950 text-rose-400 border-slate-800' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{violations.filter((v) => !v.acknowledged).length} Pending Review</span>
            </span>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-mono font-bold flex items-center justify-between animate-fade-in ${
            actionFeedback.type === 'alert'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-emerald-600 text-white shadow-lg'
          }`}>
            <span>{actionFeedback.message}</span>
            <Check className="w-4 h-4" />
          </div>
        )}

        {/* Filter Pills & Search Input */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'UNACKNOWLEDGED', label: 'Pending Action' },
              { id: 'CRITICAL', label: 'Critical Only' },
              { id: 'HIGH', label: 'High Severity' },
              { id: 'ALL', label: 'All Incidents' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterSeverity(tab.id as any)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-all ${
                  filterSeverity === tab.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search camera, worker ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Incident Cards Feed */}
      <div className="space-y-4">
        {filteredViolations.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm">No Pending Incidents Found</h3>
            <p className="text-xs text-slate-500 mt-1">All safety alerts in this filter have been acknowledged.</p>
          </div>
        ) : (
          filteredViolations.map((violation) => {
            const cam = getCameraDetails(violation.camera_id);
            const isCritical = violation.severity === 'CRITICAL';

            return (
              <div
                key={violation.id}
                className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
                  !violation.acknowledged
                    ? isCritical
                      ? 'border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/20 ring-1 ring-rose-500/30'
                      : 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/20 ring-1 ring-amber-500/30'
                    : theme === 'dark'
                    ? 'border-slate-800 bg-slate-900'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Incident Card Top Header */}
                <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-2 ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {violation.severity}
                    </span>

                    <span className={`font-mono text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {violation.detected_class.toUpperCase()}
                    </span>

                    <span className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({violation.person_track_id})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(violation.detected_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Card Main Body: Snapshot Evidence & Details */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Snapshot Evidence Thumbnail (5 cols) */}
                  <div className="sm:col-span-5 relative group rounded-xl overflow-hidden border border-slate-700 aspect-video sm:aspect-square bg-black">
                    <img
                      src={violation.snapshot_url}
                      alt="Violation Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay Bounding Box on Evidence Image */}
                    {violation.bounding_box && (
                      <div
                        className="absolute border-2 border-rose-500 bg-rose-500/30 rounded"
                        style={{
                          left: `${violation.bounding_box.x}%`,
                          top: `${violation.bounding_box.y}%`,
                          width: `${violation.bounding_box.width}%`,
                          height: `${violation.bounding_box.height}%`,
                        }}
                      >
                        <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1 rounded absolute -top-4 left-0">
                          {(violation.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedViolationForEvidence(violation)}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-mono font-bold transition-opacity"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect Full HD Snapshot</span>
                    </button>
                  </div>

                  {/* Incident Metadata & Location (7 cols) */}
                  <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Camera & Location</span>
                        <div className={`text-xs font-bold flex items-center gap-1.5 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{cam.camera_uid}</span>
                          <span className="font-normal text-slate-500 truncate">• {cam.location_name}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Triggered Zone</span>
                        <div className="text-xs font-mono text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{violation.zone_id}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Violation Summary</span>
                        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {violation.violation_type.replace(/_/g, ' ')} detected on worker <strong className="font-mono">{violation.person_track_id}</strong> with <strong className="text-emerald-500">{(violation.confidence_score * 100).toFixed(1)}% AI confidence</strong>.
                        </p>
                      </div>

                      {violation.acknowledged && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-500 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold">Acknowledged by:</span> {violation.acknowledged_by}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Buttons (1-Tap Floor Response) */}
                    <div className="pt-3 border-t border-slate-800/40 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                      {!violation.acknowledged ? (
                        <>
                          <button
                            onClick={() => handleAcknowledge(violation.id)}
                            className="flex-1 min-w-[130px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Acknowledge</span>
                          </button>

                          <button
                            onClick={() => handleTriggerRelaySiren(violation)}
                            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="Energize 110dB Siren Relay"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Sound Siren</span>
                          </button>

                          <button
                            onClick={() => handleEscalate(violation)}
                            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="Escalate Alert to Plant EHS Lead"
                          >
                            <BellRing className="w-4 h-4" />
                            <span className="hidden sm:inline">Escalate</span>
                          </button>

                          <button
                            onClick={() => handleFalsePositive(violation.id)}
                            className={`px-2.5 py-2 rounded-xl text-xs font-mono border transition-colors ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mark as False Positive"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full text-xs font-mono text-slate-500">
                          <span>Incident Resolved</span>
                          <button
                            onClick={() => handleAcknowledge(violation.id)}
                            className="text-amber-500 hover:underline flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Re-open
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Snapshot HD Evidence Inspector Modal */}
      {selectedViolationForEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl border rounded-2xl overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-mono font-bold">
                  HIGH-RESOLUTION SNAPSHOT EVIDENCE ({selectedViolationForEvidence.id})
                </span>
              </div>
              <button
                onClick={() => setSelectedViolationForEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                <img
                  src={selectedViolationForEvidence.snapshot_url}
                  alt="High Resolution Evidence"
                  className="w-full h-full object-cover"
                />

                {selectedViolationForEvidence.bounding_box && (
                  <div
                    className="absolute border-2 border-rose-500 bg-rose-500/20 rounded shadow-lg"
                    style={{
                      left: `${selectedViolationForEvidence.bounding_box.x}%`,
                      top: `${selectedViolationForEvidence.bounding_box.y}%`,
                      width: `${selectedViolationForEvidence.bounding_box.width}%`,
                      height: `${selectedViolationForEvidence.bounding_box.height}%`,
                    }}
                  >
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded absolute -top-5 left-0">
                      {selectedViolationForEvidence.detected_class} ({(selectedViolationForEvidence.confidence_score * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Camera:</span>
                  <span className="font-bold text-amber-500">{selectedViolationForEvidence.camera_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tracked Worker:</span>
                  <span className="font-bold text-blue-400">{selectedViolationForEvidence.person_track_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Hazard Zone:</span>
                  <span className="font-bold text-rose-400">{selectedViolationForEvidence.zone_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Detected Time:</span>
                  <span className="font-bold text-emerald-400">
                    {new Date(selectedViolationForEvidence.detected_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedViolationForEvidence(null)}
                  className="px-4 py-2 text-xs font-mono rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  Dismiss
                </button>
                {!selectedViolationForEvidence.acknowledged && (
                  <button
                    onClick={() => {
                      handleAcknowledge(selectedViolationForEvidence.id);
                      setSelectedViolationForEvidence(null);
                    }}
                    className="px-4 py-2 text-xs font-mono font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Acknowledge & Close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
